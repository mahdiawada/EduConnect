import { ChatRepository } from '../../repositories/PostgreSQL/Chat.repository';
import { Chat } from '../../models/Chat.model';
import { ConnectionManager } from '../../repositories/PostgreSQL/ConnectionManager';
import { ChatMapper, PostgresChat } from '../../mappers/Chat.mapper';

// Mock the dependencies
jest.mock('../../repositories/PostgreSQL/ConnectionManager');
jest.mock('../../mappers/Chat.mapper');

describe('ChatRepository', () => {
    let chatRepository: ChatRepository;
    let mockPool: any;
    let mockChatMapper: jest.Mocked<ChatMapper>;

    // Sample test data
    const mockChatData: PostgresChat = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'General Discussion',
        room_id: '456e7890-e89b-12d3-a456-426614174001',
        created_by: '789e0123-e89b-12d3-a456-426614174002',
        is_private: false,
        created_at: new Date('2023-01-01T10:00:00Z'),
        updated_at: new Date('2023-01-01T10:00:00Z')
    };

    const mockChat = new Chat(
        mockChatData.id,
        mockChatData.name,
        mockChatData.room_id,
        mockChatData.created_by,
        mockChatData.is_private,
        mockChatData.created_at,
        mockChatData.updated_at
    );

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        
        // Setup mock pool
        mockPool = {
            query: jest.fn()
        };
        
        // Setup ConnectionManager mock
        (ConnectionManager.getConnection as jest.Mock).mockResolvedValue(mockPool);
        
        // Setup ChatMapper mock
        mockChatMapper = new ChatMapper() as jest.Mocked<ChatMapper>;
        mockChatMapper.map = jest.fn().mockReturnValue(mockChat);
        (ChatMapper as jest.MockedClass<typeof ChatMapper>).mockImplementation(() => mockChatMapper);
        
        chatRepository = new ChatRepository();
    });

    describe('init', () => {
        it('should initialize the chat table successfully', async () => {
            // Arrange
            mockPool.query.mockResolvedValue({ rows: [] });

            // Act
            await chatRepository.init();

            // Assert
            expect(ConnectionManager.getConnection).toHaveBeenCalled();
            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS chats'));
        });

        it('should throw error when table creation fails', async () => {
            // Arrange
            const error = new Error('Database connection failed');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(chatRepository.init()).rejects.toThrow('Failed to create chat table.');
        });
    });

    describe('create', () => {
        it('should create a chat successfully', async () => {
            // Arrange
            const expectedId = '123e4567-e89b-12d3-a456-426614174000';
            mockPool.query.mockResolvedValue({ rows: [{ id: expectedId }] });

            // Act
            const result = await chatRepository.create(mockChat);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO chats'),
                [
                    mockChat.getName(),
                    mockChat.getRoomId(),
                    mockChat.getCreatedBy(),
                    mockChat.getIsPrivate(),
                ]
            );
            expect(result).toBe(expectedId);
        });

        it('should throw error when chat creation fails', async () => {
            // Arrange
            const error = new Error('Foreign key constraint violation');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(chatRepository.create(mockChat)).rejects.toThrow('Failed to insert chat');
        });
    });

    describe('get', () => {
        it('should get a chat by id successfully', async () => {
            // Arrange
            const chatId = '123e4567-e89b-12d3-a456-426614174000';
            mockPool.query.mockResolvedValue({ rows: [mockChatData] });

            // Act
            const result = await chatRepository.get(chatId);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM chats'),
                [chatId]
            );
            expect(mockChatMapper.map).toHaveBeenCalledWith(mockChatData);
            expect(result).toBe(mockChat);
        });

        it('should throw error when chat not found', async () => {
            // Arrange
            const chatId = 'non-existent-id';
            mockPool.query.mockResolvedValue({ rows: [] });

            // Act & Assert
            await expect(chatRepository.get(chatId)).rejects.toThrow(`Chat with id ${chatId} not found`);
        });

        it('should throw error when database query fails', async () => {
            // Arrange
            const chatId = '123e4567-e89b-12d3-a456-426614174000';
            const error = new Error('Database error');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(chatRepository.get(chatId)).rejects.toThrow('Failed to get chat');
        });
    });

    describe('getAll', () => {
        it('should get all chats successfully', async () => {
            // Arrange
            const mockChatsData = [
                mockChatData, 
                { 
                    ...mockChatData, 
                    id: '456e7890-e89b-12d3-a456-426614174001',
                    name: 'Private Discussion'
                }
            ];
            mockPool.query.mockResolvedValue({ rows: mockChatsData });

            // Act
            const result = await chatRepository.getAll();

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM chats'));
            expect(mockChatMapper.map).toHaveBeenCalledTimes(2);
            expect(result).toEqual([mockChat, mockChat]);
        });

        it('should throw error when no chats found', async () => {
            // Arrange
            mockPool.query.mockResolvedValue({ rows: [] });

            // Act & Assert
            await expect(chatRepository.getAll()).rejects.toThrow('Chats not found');
        });

        it('should throw error when database query fails', async () => {
            // Arrange
            const error = new Error('Database error');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(chatRepository.getAll()).rejects.toThrow('Failed to get all chats');
        });
    });

    describe('update', () => {
        it('should update a chat successfully', async () => {
            // Arrange
            mockPool.query.mockResolvedValue({ rowCount: 1 });

            // Act
            await chatRepository.update(mockChat);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE chats'),
                [
                    mockChat.getName(),
                    mockChat.getRoomId(),
                    mockChat.getCreatedBy(),
                    mockChat.getIsPrivate(),
                    mockChat.getId()
                ]
            );
        });

        it('should throw error when chat not found for update', async () => {
            // Arrange
            mockPool.query.mockResolvedValue({ rowCount: 0 });

            // Act & Assert
            await expect(chatRepository.update(mockChat)).rejects.toThrow(`Chat with id ${mockChat.getId()} not found`);
        });

        it('should throw error when database update fails', async () => {
            // Arrange
            const error = new Error('Database error');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(chatRepository.update(mockChat)).rejects.toThrow(`Failed to update chat of id ${mockChat.getId()}`);
        });
    });

    describe('delete', () => {
        it('should delete a chat successfully', async () => {
            // Arrange
            const chatId = '123e4567-e89b-12d3-a456-426614174000';
            mockPool.query.mockResolvedValue({ rowCount: 1 });

            // Act
            await chatRepository.delete(chatId);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM chats'),
                [chatId]
            );
        });

        it('should throw error when chat not found for deletion', async () => {
            // Arrange
            const chatId = 'non-existent-id';
            mockPool.query.mockResolvedValue({ rowCount: 0 });

            // Act & Assert
            await expect(chatRepository.delete(chatId)).rejects.toThrow(`Chat of id ${chatId} not found`);
        });

        it('should throw error when database deletion fails', async () => {
            // Arrange
            const chatId = '123e4567-e89b-12d3-a456-426614174000';
            const error = new Error('Database error');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(chatRepository.delete(chatId)).rejects.toThrow(`Failed to delete chat with id ${chatId}`);
        });
    });

    describe('getChatsByRoom', () => {
        

        it('should return empty array when no chats found for room', async () => {
            // Arrange
            const roomId = '456e7890-e89b-12d3-a456-426614174001';
            mockPool.query.mockResolvedValue({ rows: [] });

            // Act
            const result = await chatRepository.getChatsByRoom(roomId);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM chats'),
                [roomId]
            );
            expect(result).toEqual([]);
        });

        it('should throw error when database query fails', async () => {
            // Arrange
            const roomId = '456e7890-e89b-12d3-a456-426614174001';
            const error = new Error('Database error');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(chatRepository.getChatsByRoom(roomId)).rejects.toThrow(`Failed to get chats for room ${roomId}`);
        });
    });

    

    describe('chat-type-specific tests', () => {
        it('should create public chat successfully', async () => {
            // Arrange
            const publicChat = new Chat(
                '123e4567-e89b-12d3-a456-426614174000',
                'Public Discussion',
                '456e7890-e89b-12d3-a456-426614174001',
                '789e0123-e89b-12d3-a456-426614174002',
                false // isPrivate
            );
            const expectedId = '123e4567-e89b-12d3-a456-426614174000';
            mockPool.query.mockResolvedValue({ rows: [{ id: expectedId }] });

            // Act
            const result = await chatRepository.create(publicChat);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO chats'),
                [
                    publicChat.getName(),
                    publicChat.getRoomId(),
                    publicChat.getCreatedBy(),
                    false, // isPrivate
                ]
            );
            expect(result).toBe(expectedId);
        });

        it('should create private chat successfully', async () => {
            // Arrange
            const privateChat = new Chat(
                '123e4567-e89b-12d3-a456-426614174000',
                'Private Discussion',
                '456e7890-e89b-12d3-a456-426614174001',
                '789e0123-e89b-12d3-a456-426614174002',
                true // isPrivate
            );
            const expectedId = '123e4567-e89b-12d3-a456-426614174000';
            mockPool.query.mockResolvedValue({ rows: [{ id: expectedId }] });

            // Act
            const result = await chatRepository.create(privateChat);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO chats'),
                [
                    privateChat.getName(),
                    privateChat.getRoomId(),
                    privateChat.getCreatedBy(),
                    true,  // isPrivate
                ]
            );
            expect(result).toBe(expectedId);
        });
    });

    describe('error handling', () => {
        it('should preserve original error message for not found errors', async () => {
            // Arrange
            const chatId = 'non-existent-id';
            mockPool.query.mockResolvedValue({ rows: [] });

            // Act & Assert
            await expect(chatRepository.get(chatId)).rejects.toThrow(`Chat with id ${chatId} not found`);
        });

        it('should wrap database errors with generic message', async () => {
            // Arrange
            const error = new Error('Connection timeout');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(chatRepository.create(mockChat)).rejects.toThrow('Failed to insert chat');
        });
    });
});
