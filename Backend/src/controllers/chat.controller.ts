import { Request, Response } from 'express';
import { ChatService } from '../services/Chat.service';
import { BadRequestException } from '../utils/exceptions/http/BadRequestException';

export class ChatController {
    constructor(private chatService: ChatService) {}

    public async createChat(req: Request, res: Response) {
        const { name, roomId } = req.body;
        const roomInstructor = ( req as any ).userId;

        if (!roomInstructor) {
            throw new BadRequestException('User authentication required');
        }

        const chat = await this.chatService.createChat(name, roomId, roomInstructor);
        res.status(201).json(chat);
    }

    public async getChatsByRoom(req: Request, res: Response) {
        const roomId = req.params.roomId;

        if(!roomId) {
            throw new BadRequestException('Room Id is required in the path');
        }

        const chats = await this.chatService.getChatsByRoom(roomId);
        res.status(200).json(chats);
    }

    public async getChatById(req: Request, res: Response) {
        const id = req.params.id;
        if(!id) {
            throw new BadRequestException('Chat Id is required in the path');
        }

        const chat = await this.chatService.getChat(id);
        res.status(200).json(chat);
    }

    public async sendMessage(req: Request, res: Response) {
        const chatId = req.params.chatId;
        const senderId = (req as any).userId;
        const { content, messageType } = req.body;

        if (!content) {
            throw new BadRequestException('Message content is required');
        }

        const message = await this.chatService.sendMessage(chatId, senderId, content, messageType);
        res.status(201).json(message);
    }

    public async getMessages(req: Request, res: Response) {
        const chatId = req.params.chatId;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

        const messages = await this.chatService.getMessages(chatId, limit, offset);
        res.status(200).json(messages);
    }

    public async updateChatName(req: Request, res: Response): Promise<void> {
        const chatId = req.params.id;
        const userId = (req as any).userId;
        const { name } = req.body;

        if (!name) {
            throw new BadRequestException('New chat name is required');
        }

        await this.chatService.updateChatName(chatId, name, userId);
        res.status(200).json({ message: 'Chat name updated successfully' });
    }

    public async deleteMessage(req: Request, res: Response): Promise<void> {
        const messageId = req.params.messageId;
        const userId = (req as any).userId;

        await this.chatService.deleteMessage(messageId, userId);
        res.status(204).send();
    }

    public async deleteChat(req: Request, res: Response): Promise<void> {
        const chatId = req.params.id;
        const userId = (req as any).userId;

        if (!chatId) {
            throw new BadRequestException('Chat ID is required in the path');
        }

        if (!userId) {
            throw new BadRequestException('User authentication required');
        }

        await this.chatService.deleteChat(chatId, userId);
        
        res.status(204).send();
    }
}