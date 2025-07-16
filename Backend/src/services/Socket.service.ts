import { Server, Socket } from 'socket.io';
import { AuthenticationService } from './Authentication.service';
import { RoomService } from './Room.service';
import { Chat } from '../models/Chat.model';
import { Message } from '../models/Messages.model';
import { MessageBuilder } from '../models/builders/Messages.builder';
import { createChatRepository } from '../repositories/PostgreSQL/Chat.repository';
import { createMessagesRepository } from '../repositories/PostgreSQL/Messages.repository';
import { createRoomRepository } from '../repositories/PostgreSQL/Room.repository';
import { createRoomMemberRepository } from '../repositories/PostgreSQL/RoomMember.repository';
import { createUserRepository } from '../repositories/PostgreSQL/User.repository';
import logger from '../utils/logger';
import { generateUUID } from '../utils';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userEmail?: string;
}

interface SocketRoomData {
    roomId: string;
    userId: string;
    userEmail: string;
}

// Store active connections
const activeUsers = new Map<string, { socketId: string; roomId?: string; userEmail: string }>();
const roomUsers = new Map<string, Set<string>>(); // roomId -> Set of userIds

export function setupSocketIO(io: Server) {
    // Socket authentication middleware
    io.use(async (socket: AuthenticatedSocket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication token required'));
            }

            const authService = new AuthenticationService();
            const payload = authService.verifyToken(token);
            
            socket.userId = payload.userID;
            socket.userEmail = payload.email;
            
            logger.info(`Socket authenticated for user: ${socket.userEmail}`);
            next();
        } catch (error) {
            logger.error('Socket authentication failed:', error);
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', async (socket: AuthenticatedSocket) => {
        logger.info(`User connected: ${socket.userEmail} (${socket.id})`);
        
        // Store active user
        if (socket.userId && socket.userEmail) {
            activeUsers.set(socket.userId, {
                socketId: socket.id,
                userEmail: socket.userEmail
            });
        }

        // Join a room
        socket.on('join-room', async (data: { roomId: string }) => {
            try {
                const { roomId } = data;
                
                if (!socket.userId) return;

                // Verify user is member of the room
                const roomRepository = await createRoomRepository();
                const roomMemberRepository = await createRoomMemberRepository();
                const userRepository = await createUserRepository();
                
                const roomService = new RoomService(roomRepository, roomMemberRepository, userRepository);
                const isMember = await roomService.isUserMemberOfRoom(socket.userId, roomId);
                
                if (!isMember) {
                    socket.emit('error', { message: 'You are not a member of this room' });
                    return;
                }

                // Leave previous room if any
                const currentRoomData = activeUsers.get(socket.userId);
                if (currentRoomData?.roomId) {
                    socket.leave(currentRoomData.roomId);
                    
                    // Remove from room users tracking
                    const roomUsersSet = roomUsers.get(currentRoomData.roomId);
                    if (roomUsersSet) {
                        roomUsersSet.delete(socket.userId);
                        if (roomUsersSet.size === 0) {
                            roomUsers.delete(currentRoomData.roomId);
                        }
                    }
                }

                // Join new room
                socket.join(roomId);
                
                // Update user's room
                activeUsers.set(socket.userId, {
                    socketId: socket.id,
                    userEmail: socket.userEmail!,
                    roomId: roomId
                });

                // Track room users
                if (!roomUsers.has(roomId)) {
                    roomUsers.set(roomId, new Set());
                }
                roomUsers.get(roomId)!.add(socket.userId);

                // Notify room about user joining
                socket.to(roomId).emit('user-joined', {
                    userId: socket.userId,
                    userEmail: socket.userEmail,
                    message: `${socket.userEmail} joined the room`
                });

                // Send current online users in room
                const onlineUsers = Array.from(roomUsers.get(roomId) || []).map(userId => {
                    const user = activeUsers.get(userId);
                    return user ? { userId, userEmail: user.userEmail } : null;
                }).filter(Boolean);

                socket.emit('room-joined', { 
                    roomId, 
                    onlineUsers,
                    message: 'Successfully joined room' 
                });

                logger.info(`User ${socket.userEmail} joined room: ${roomId}`);
            } catch (error) {
                logger.error('Error joining room:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        // Send message
        socket.on('send-message', async (data: { chatId: string; content: string; roomId: string }) => {
            try {
                const { chatId, content, roomId } = data;
                
                if (!socket.userId || !content.trim()) return;

                // Save message to database
                const messagesRepository = await createMessagesRepository();
                const chatRepository = await createChatRepository();
                
                // Verify user is member of the room
                const roomRepository = await createRoomRepository();
                const roomMemberRepository = await createRoomMemberRepository();
                const userRepository = await createUserRepository();
                
                const roomService = new RoomService(roomRepository, roomMemberRepository, userRepository);
                const isMember = await roomService.isUserMemberOfRoom(socket.userId, roomId);
                
                if (!isMember) {
                    socket.emit('error', { message: 'You are not a member of this room' });
                    return;
                }

                // Create and save message
                const messageId = generateUUID("message");
                const message = new MessageBuilder()
                    .setId(messageId)
                    .setChatId(chatId)
                    .setSenderId(socket.userId)
                    .setContent(content.trim())
                    .setMessageType('text')
                    .setCreatedAt(new Date())
                    .build();

                await messagesRepository.create(message);

                // Broadcast message to room
                const messageData = {
                    id: message.getId(),
                    chatId: message.getChatId(),
                    senderId: message.getSenderId(),
                    senderEmail: socket.userEmail,
                    content: message.getContent(),
                    timestamp: message.getCreatedAt()
                };

                io.to(roomId).emit('new-message', messageData);
                
                logger.info(`Message sent by ${socket.userEmail} in room ${roomId}`);
            } catch (error) {
                logger.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Typing indicator
        socket.on('typing-start', (data: { roomId: string; chatId: string }) => {
            const { roomId, chatId } = data;
            socket.to(roomId).emit('user-typing', {
                userId: socket.userId,
                userEmail: socket.userEmail,
                chatId,
                isTyping: true
            });
        });

        socket.on('typing-stop', (data: { roomId: string; chatId: string }) => {
            const { roomId, chatId } = data;
            socket.to(roomId).emit('user-typing', {
                userId: socket.userId,
                userEmail: socket.userEmail,
                chatId,
                isTyping: false
            });
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            logger.info(`User disconnected: ${socket.userEmail} (${socket.id})`);
            
            if (socket.userId) {
                const userData = activeUsers.get(socket.userId);
                if (userData?.roomId) {
                    // Notify room about user leaving
                    socket.to(userData.roomId).emit('user-left', {
                        userId: socket.userId,
                        userEmail: socket.userEmail,
                        message: `${socket.userEmail} left the room`
                    });

                    // Remove from room users tracking
                    const roomUsersSet = roomUsers.get(userData.roomId);
                    if (roomUsersSet) {
                        roomUsersSet.delete(socket.userId);
                        if (roomUsersSet.size === 0) {
                            roomUsers.delete(userData.roomId);
                        }
                    }
                }
                
                activeUsers.delete(socket.userId);
            }
        });
    });

    return io;
} 