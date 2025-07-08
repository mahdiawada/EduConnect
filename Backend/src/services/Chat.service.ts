import { Chat } from "../models/Chat.model";
import { Message } from "../models/Messages.model";
import { ChatRepository } from "../repositories/PostgreSQL/Chat.repository";
import { MessagesRepository } from "../repositories/PostgreSQL/Messages.repository";
import { v4 as uuidv4 } from 'uuid';

export class ChatService {
    private chatRepo: ChatRepository;
    private messageRepo: MessagesRepository;

    constructor() {
        this.chatRepo = new ChatRepository();
        this.messageRepo = new MessagesRepository();
    }

    // Create a new chat group
    public async createChat(name: string, roomId: string, createdBy: string, isPrivate: boolean = false): Promise<Chat> {
        this.validateChatData(name, roomId, createdBy);
        
        const chatId = uuidv4();
        const chat = new Chat(chatId, name, roomId, createdBy, isPrivate);
        
        await this.chatRepo.create(chat);
        return chat;
    }

    // Get all chats for a room
    public async getChatsByRoom(roomId: string): Promise<Chat[]> {
        try {
            return await this.chatRepo.getChatsByRoom(roomId);
        } catch (error) {
            throw new Error(`Failed to get chats for room ${roomId}: ${error}`);
        }
    }

    // Get a specific chat
    public async getChat(chatId: string): Promise<Chat> {
        try {
            return await this.chatRepo.get(chatId);
        } catch (error) {
            throw new Error(`Failed to get chat ${chatId}: ${error}`);
        }
    }

    // Send a message to a chat
    public async sendMessage(chatId: string, senderId: string, content: string, messageType: 'text' | 'image' | 'file' | 'system' = 'text'): Promise<Message> {
        this.validateMessageData(chatId, senderId, content);
        
        const messageId = uuidv4();
        const message = new Message(messageId, chatId, senderId, content, messageType);
        
        await this.messageRepo.create(message);
        return message;
    }

    // Get messages for a chat with pagination
    public async getMessages(chatId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
        try {
            return await this.messageRepo.getByChatId(chatId, limit, offset);
        } catch (error) {
            throw new Error(`Failed to get messages for chat ${chatId}: ${error}`);
        }
    }

    // Get recent messages (for real-time updates)
    public async getRecentMessages(chatId: string, since: Date): Promise<Message[]> {
        try {
            return await this.messageRepo.getRecentMessages(chatId, since);
        } catch (error) {
            throw new Error(`Failed to get recent messages for chat ${chatId}: ${error}`);
        }
    }

    // Update chat name
    public async updateChatName(chatId: string, newName: string, userId: string): Promise<void> {
        this.validateChatName(newName);
        
        const chat = await this.getChat(chatId);
        
        // Check if user has permission to update (creator or instructor)
        if (chat.getCreatedBy() !== userId) {
            throw new Error("You don't have permission to update this chat");
        }
        
        chat.setName(newName);
        await this.chatRepo.update(chat);
    }

    // Delete a message
    public async deleteMessage(messageId: string, userId: string): Promise<void> {
        const message = await this.messageRepo.get(messageId);
        
        // Check if user has permission to delete (sender or instructor)
        if (message.getSenderId() !== userId) {
            throw new Error("You don't have permission to delete this message");
        }
        
        await this.messageRepo.delete(messageId);
    }

    // Get message count for a chat
    public async getMessageCount(chatId: string): Promise<number> {
        try {
            return await this.messageRepo.getMessageCountByChat(chatId);
        } catch (error) {
            throw new Error(`Failed to get message count for chat ${chatId}: ${error}`);
        }
    }

    // Validation methods
    private validateChatData(name: string, roomId: string, createdBy: string): void {
        if (!name || name.trim() === "") {
            throw new Error("Chat name is required");
        }
        
        if (name.length > 100) {
            throw new Error("Chat name must be less than 100 characters");
        }
        
        if (!roomId || roomId.trim() === "") {
            throw new Error("Room ID is required");
        }
        
        if (!createdBy || createdBy.trim() === "") {
            throw new Error("Creator ID is required");
        }
    }

    private validateMessageData(chatId: string, senderId: string, content: string): void {
        if (!chatId || chatId.trim() === "") {
            throw new Error("Chat ID is required");
        }
        
        if (!senderId || senderId.trim() === "") {
            throw new Error("Sender ID is required");
        }
        
        if (!content || content.trim() === "") {
            throw new Error("Message content is required");
        }
        
        if (content.length > 1000) {
            throw new Error("Message content must be less than 1000 characters");
        }
    }

    private validateChatName(name: string): void {
        if (!name || name.trim() === "") {
            throw new Error("Chat name is required");
        }
        
        if (name.length > 100) {
            throw new Error("Chat name must be less than 100 characters");
        }
    }
} 