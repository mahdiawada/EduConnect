import { ChatService } from '../services/Chat.service';
import { Chat } from '../models/Chat.model';
import { Message } from '../models/Messages.model';

// Mock the repositories
jest.mock('../repositories/PostgreSQL/Chat.repository');
jest.mock('../repositories/PostgreSQL/Messages.repository');

describe('ChatService', () => {
    let chatService: ChatService;

    beforeEach(() => {
        chatService = new ChatService();
        jest.clearAllMocks();
    });

    describe('createChat', () => {
        it('should throw error when chat name is missing', async () => {
            await expect(chatService.createChat('', 'room123', 'user123')).rejects.toThrow('Chat name is required');
        });

        it('should throw error when chat name is too long', async () => {
            const longName = 'a'.repeat(101);
            await expect(chatService.createChat(longName, 'room123', 'user123')).rejects.toThrow('Chat name must be less than 100 characters');
        });

        it('should throw error when room ID is missing', async () => {
            await expect(chatService.createChat('Test Chat', '', 'user123')).rejects.toThrow('Room ID is required');
        });

        it('should throw error when creator ID is missing', async () => {
            await expect(chatService.createChat('Test Chat', 'room123', '')).rejects.toThrow('Creator ID is required');
        });

        it('should accept valid chat data', async () => {
            // Mock the repository create method
            const mockCreate = jest.fn().mockResolvedValue('chat123');
            (chatService as any).chatRepo.create = mockCreate;

            const result = await chatService.createChat('Test Chat', 'room123', 'user123');

            expect(result).toBeDefined();
            expect(result.getName()).toBe('Test Chat');
            expect(result.getRoomId()).toBe('room123');
            expect(result.getCreatedBy()).toBe('user123');
            expect(mockCreate).toHaveBeenCalled();
        });
    });

    describe('sendMessage', () => {
        it('should throw error when chat ID is missing', async () => {
            await expect(chatService.sendMessage('', 'user123', 'Hello')).rejects.toThrow('Chat ID is required');
        });

        it('should throw error when sender ID is missing', async () => {
            await expect(chatService.sendMessage('chat123', '', 'Hello')).rejects.toThrow('Sender ID is required');
        });

        it('should throw error when message content is missing', async () => {
            await expect(chatService.sendMessage('chat123', 'user123', '')).rejects.toThrow('Message content is required');
        });

        it('should throw error when message content is too long', async () => {
            const longMessage = 'a'.repeat(1001);
            await expect(chatService.sendMessage('chat123', 'user123', longMessage)).rejects.toThrow('Message content must be less than 1000 characters');
        });

        it('should accept valid message data', async () => {
            // Mock the repository create method
            const mockCreate = jest.fn().mockResolvedValue('msg123');
            (chatService as any).messageRepo.create = mockCreate;

            const result = await chatService.sendMessage('chat123', 'user123', 'Hello world');

            expect(result).toBeDefined();
            expect(result.getChatId()).toBe('chat123');
            expect(result.getSenderId()).toBe('user123');
            expect(result.getContent()).toBe('Hello world');
            expect(result.getMessageType()).toBe('text');
            expect(mockCreate).toHaveBeenCalled();
        });

        it('should accept different message types', async () => {
            // Mock the repository create method
            const mockCreate = jest.fn().mockResolvedValue('msg123');
            (chatService as any).messageRepo.create = mockCreate;

            const result = await chatService.sendMessage('chat123', 'user123', 'image.jpg', 'image');

            expect(result.getMessageType()).toBe('image');
        });
    });

    describe('updateChatName', () => {
        it('should throw error when new name is missing', async () => {
            await expect(chatService.updateChatName('chat123', '', 'user123')).rejects.toThrow('Chat name is required');
        });

        it('should throw error when new name is too long', async () => {
            const longName = 'a'.repeat(101);
            await expect(chatService.updateChatName('chat123', longName, 'user123')).rejects.toThrow('Chat name must be less than 100 characters');
        });

        it('should update chat name when user has permission', async () => {
            // Mock the repository methods
            const mockChat = new Chat('chat123', 'Old Name', 'room123', 'user123');
            const mockGet = jest.fn().mockResolvedValue(mockChat);
            const mockUpdate = jest.fn().mockResolvedValue(undefined);
            (chatService as any).chatRepo.get = mockGet;
            (chatService as any).chatRepo.update = mockUpdate;

            await chatService.updateChatName('chat123', 'New Name', 'user123');

            expect(mockGet).toHaveBeenCalledWith('chat123');
            expect(mockUpdate).toHaveBeenCalled();
        });
    });

    describe('deleteMessage', () => {
        it('should throw error when user is not the sender', async () => {
            // Mock the repository methods
            const mockMessage = new Message('msg123', 'chat123', 'otheruser', 'Hello');
            const mockGet = jest.fn().mockResolvedValue(mockMessage);
            const mockDelete = jest.fn().mockResolvedValue(undefined);
            (chatService as any).messageRepo.get = mockGet;
            (chatService as any).messageRepo.delete = mockDelete;

            await expect(chatService.deleteMessage('msg123', 'user123')).rejects.toThrow("You don't have permission to delete this message");
        });

        it('should delete message when user is the sender', async () => {
            // Mock the repository methods
            const mockMessage = new Message('msg123', 'chat123', 'user123', 'Hello');
            const mockGet = jest.fn().mockResolvedValue(mockMessage);
            const mockDelete = jest.fn().mockResolvedValue(undefined);
            (chatService as any).messageRepo.get = mockGet;
            (chatService as any).messageRepo.delete = mockDelete;

            await chatService.deleteMessage('msg123', 'user123');

            expect(mockGet).toHaveBeenCalledWith('msg123');
            expect(mockDelete).toHaveBeenCalledWith('msg123');
        });
    });
}); 