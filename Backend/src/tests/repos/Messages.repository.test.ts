import { MessagesRepository } from '../../repositories/PostgreSQL/Messages.repository';
import { Message } from '../../models/Messages.model';
import { MessageBuilder } from '../../models/builders/Messages.builder';
import { ConnectionManager } from '../../repositories/PostgreSQL/ConnectionManager';

// Mock the ConnectionManager
jest.mock('../../repositories/PostgreSQL/ConnectionManager');
jest.mock('../../utils/logger');

describe('MessagesRepository', () => {
    let messagesRepository: MessagesRepository;
    let mockPool: any;

    beforeEach(() => {
        messagesRepository = new MessagesRepository();
        
        // Setup mock pool
        mockPool = {
            query: jest.fn()
        };
        
        (ConnectionManager.getConnection as jest.Mock).mockResolvedValue(mockPool);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('init', () => {
        it('should initialize the messages table successfully', async () => {
            mockPool.query.mockResolvedValue({ rows: [] });

            await messagesRepository.init();

            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS messages'));
        });

        it('should throw error when table creation fails', async () => {
            const error = new Error('Database connection failed');
            mockPool.query.mockRejectedValue(error);

            await expect(messagesRepository.init()).rejects.toThrow('Failed to initialize Messages table');
        });
    });

    describe('create', () => {
        it('should create a message successfully', async () => {
            const message = new MessageBuilder()
                .setId('msg-123')
                .setChatId('chat-123')
                .setSenderId('user-123')
                .setContent('Hello world')
                .setMessageType('text')
                .build();

            mockPool.query.mockResolvedValue({
                rows: [{ id: 'msg-123' }]
            });

            const result = await messagesRepository.create(message);

            expect(result).toBe('msg-123');
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO messages'),
                ['chat-123', 'user-123', 'Hello world', 'text']
            );
        });

        it('should throw error when message creation fails', async () => {
            const message = new MessageBuilder()
                .setId('msg-123')
                .setChatId('chat-123')
                .setSenderId('user-123')
                .setContent('Hello world')
                .setMessageType('text')
                .build();

            mockPool.query.mockRejectedValue(new Error('Database error'));

            await expect(messagesRepository.create(message)).rejects.toThrow('Failed to create message.');
        });
    });

    describe('get', () => {
        it('should get a message by id successfully', async () => {
            const mockMessageData = {
                id: 'msg-123',
                chat_id: 'chat-123',
                sender_id: 'user-123',
                content: 'Hello world',
                message_type: 'text',
                created_at: new Date()
            };

            mockPool.query.mockResolvedValue({
                rows: [mockMessageData]
            });

            const result = await messagesRepository.get('msg-123');

            expect(result).toBeInstanceOf(Message);
            expect(result.getId()).toBe('msg-123');
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM messages WHERE id = $1'),
                ['msg-123']
            );
        });

        it('should throw error when message not found', async () => {
            mockPool.query.mockResolvedValue({ rows: [] });

            await expect(messagesRepository.get('msg-123')).rejects.toThrow('Message with id msg-123 not found');
        });

        it('should throw error when database query fails', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            await expect(messagesRepository.get('msg-123')).rejects.toThrow('Failed to get message of id msg-123');
        });
    });

    describe('getAll', () => {
        it('should get all messages successfully', async () => {
            const mockMessagesData = [
                {
                    id: 'msg-1',
                    chat_id: 'chat-123',
                    sender_id: 'user-123',
                    content: 'Hello world',
                    message_type: 'text',
                    created_at: new Date()
                },
                {
                    id: 'msg-2',
                    chat_id: 'chat-123',
                    sender_id: 'user-456',
                    content: 'Hi there',
                    message_type: 'text',
                    created_at: new Date()
                }
            ];

            mockPool.query.mockResolvedValue({
                rows: mockMessagesData
            });

            const result = await messagesRepository.getAll();

            expect(result).toHaveLength(2);
            expect(result[0]).toBeInstanceOf(Message);
            expect(result[1]).toBeInstanceOf(Message);
            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM messages ORDER BY created_at ASC'));
        });

        it('should throw error when no messages found', async () => {
            mockPool.query.mockResolvedValue({ rows: [] });

            await expect(messagesRepository.getAll()).rejects.toThrow('No Messages found');
        });

        it('should throw error when database query fails', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            await expect(messagesRepository.getAll()).rejects.toThrow('Failed to get all messages');
        });
    });

    describe('update', () => {
        it('should update a message successfully', async () => {
            const message = new MessageBuilder()
                .setId('msg-123')
                .setChatId('chat-123')
                .setSenderId('user-123')
                .setContent('Updated content')
                .setMessageType('text')
                .build();

            mockPool.query.mockResolvedValue({
                rows: [{ id: 'msg-123' }]
            });

            await messagesRepository.update(message);

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE messages'),
                ['msg-123', 'Updated content', 'text']
            );
        });

        it('should throw error when update fails', async () => {
            const message = new MessageBuilder()
                .setId('msg-123')
                .setChatId('chat-123')
                .setSenderId('user-123')
                .setContent('Updated content')
                .setMessageType('text')
                .build();

            mockPool.query.mockRejectedValue(new Error('Database error'));

            await expect(messagesRepository.update(message)).rejects.toThrow('Couldn\'t update message of id msg-123');
        });
    });

    describe('delete', () => {
        it('should delete a message successfully', async () => {
            mockPool.query.mockResolvedValue({
                rowCount: 1
            });

            await messagesRepository.delete('msg-123');

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM messages WHERE id = $1'),
                ['msg-123']
            );
        });

        it('should throw error when message not found for deletion', async () => {
            mockPool.query.mockResolvedValue({
                rowCount: 0
            });

            await expect(messagesRepository.delete('msg-123')).rejects.toThrow('Message with id msg-123 not found');
        });

        it('should throw error when deletion fails', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            await expect(messagesRepository.delete('msg-123')).rejects.toThrow('Failed to delete message with id msg-123');
        });
    });

    describe('getByChatId', () => {
        it('should get messages by chat id successfully', async () => {
            const mockMessagesData = [
                {
                    id: 'msg-1',
                    chat_id: 'chat-123',
                    sender_id: 'user-123',
                    content: 'Hello world',
                    message_type: 'text',
                    created_at: new Date()
                }
            ];

            mockPool.query.mockResolvedValue({
                rows: mockMessagesData
            });

            const result = await messagesRepository.getByChatId('chat-123', 50, 0);

            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(Message);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM messages WHERE chat_id = $1'),
                ['chat-123', 50, 0]
            );
        });

        it('should return empty array when no messages found for chat', async () => {
            mockPool.query.mockResolvedValue({ rows: [] });

            const result = await messagesRepository.getByChatId('chat-123');

            expect(result).toEqual([]);
        });

        it('should throw error when database query fails', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            await expect(messagesRepository.getByChatId('chat-123')).rejects.toThrow('Failed to get messages by chat id chat-123');
        });
    });

    describe('getBySenderId', () => {
        it('should get messages by sender id successfully', async () => {
            const mockMessagesData = [
                {
                    id: 'msg-1',
                    chat_id: 'chat-123',
                    sender_id: 'user-123',
                    content: 'Hello world',
                    message_type: 'text',
                    created_at: new Date()
                }
            ];

            mockPool.query.mockResolvedValue({
                rows: mockMessagesData
            });

            const result = await messagesRepository.getBySenderId('user-123');

            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(Message);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM messages WHERE sender_id = $1'),
                ['user-123']
            );
        });

        it('should return empty array when no messages found for sender', async () => {
            mockPool.query.mockResolvedValue({ rows: [] });

            const result = await messagesRepository.getBySenderId('user-123');

            expect(result).toEqual([]);
        });

        it('should throw error when database query fails', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            await expect(messagesRepository.getBySenderId('user-123')).rejects.toThrow('Failed to get messages by sender id user-123');
        });
    });

    describe('getRecentMessages', () => {
        it('should get recent messages successfully', async () => {
            const since = new Date('2023-01-01');
            const mockMessagesData = [
                {
                    id: 'msg-1',
                    chat_id: 'chat-123',
                    sender_id: 'user-123',
                    content: 'Hello world',
                    message_type: 'text',
                    created_at: new Date()
                }
            ];

            mockPool.query.mockResolvedValue({
                rows: mockMessagesData
            });

            const result = await messagesRepository.getRecentMessages('chat-123', since);

            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(Message);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM messages WHERE chat_id = $1 AND created_at > $2'),
                ['chat-123', since]
            );
        });

        it('should return empty array when no recent messages found', async () => {
            const since = new Date('2023-01-01');
            mockPool.query.mockResolvedValue({ rows: [] });

            const result = await messagesRepository.getRecentMessages('chat-123', since);

            expect(result).toEqual([]);
        });

        it('should throw error when database query fails', async () => {
            const since = new Date('2023-01-01');
            mockPool.query.mockRejectedValue(new Error('Database error'));

            await expect(messagesRepository.getRecentMessages('chat-123', since)).rejects.toThrow('Failed to get recent messages for chat id chat-123');
        });
    });

    describe('getMessageCountByChat', () => {
        it('should get message count by chat successfully', async () => {
            mockPool.query.mockResolvedValue({
                rows: [{ count: '5' }]
            });

            const result = await messagesRepository.getMessageCountByChat('chat-123');

            expect(result).toBe(5);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT COUNT(*) as count FROM messages WHERE chat_id = $1'),
                ['chat-123']
            );
        });

        it('should throw error when database query fails', async () => {
            mockPool.query.mockRejectedValue(new Error('Database error'));

            await expect(messagesRepository.getMessageCountByChat('chat-123')).rejects.toThrow('Failed to get message count for chat id chat-123');
        });
    });

    describe('message-type-specific tests', () => {
        it('should create text message successfully', async () => {
            const message = new MessageBuilder()
                .setId('msg-123')
                .setChatId('chat-123')
                .setSenderId('user-123')
                .setContent('Text message')
                .setMessageType('text')
                .build();

            mockPool.query.mockResolvedValue({
                rows: [{ id: 'msg-123' }]
            });

            const result = await messagesRepository.create(message);

            expect(result).toBe('msg-123');
        });

        it('should create image message successfully', async () => {
            const message = new MessageBuilder()
                .setId('msg-123')
                .setChatId('chat-123')
                .setSenderId('user-123')
                .setContent('image.jpg')
                .setMessageType('image')
                .build();

            mockPool.query.mockResolvedValue({
                rows: [{ id: 'msg-123' }]
            });

            const result = await messagesRepository.create(message);

            expect(result).toBe('msg-123');
        });

        it('should create file message successfully', async () => {
            const message = new MessageBuilder()
                .setId('msg-123')
                .setChatId('chat-123')
                .setSenderId('user-123')
                .setContent('document.pdf')
                .setMessageType('file')
                .build();

            mockPool.query.mockResolvedValue({
                rows: [{ id: 'msg-123' }]
            });

            const result = await messagesRepository.create(message);

            expect(result).toBe('msg-123');
        });

        it('should create system message successfully', async () => {
            const message = new MessageBuilder()
                .setId('msg-123')
                .setChatId('chat-123')
                .setSenderId('user-123')
                .setContent('User joined the chat')
                .setMessageType('system')
                .build();

            mockPool.query.mockResolvedValue({
                rows: [{ id: 'msg-123' }]
            });

            const result = await messagesRepository.create(message);

            expect(result).toBe('msg-123');
        });
    });

    describe('error handling', () => {
        it('should preserve original error message for not found errors', async () => {
            mockPool.query.mockResolvedValue({ rows: [] });

            await expect(messagesRepository.get('msg-123')).rejects.toThrow('Message with id msg-123 not found');
        });

        it('should wrap database errors with generic message', async () => {
            mockPool.query.mockRejectedValue(new Error('Connection timeout'));

            await expect(messagesRepository.getAll()).rejects.toThrow('Failed to get all messages');
        });
    });
}); 