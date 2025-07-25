import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { ChatService } from '../services/Chat.service';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

const chatService = new ChatService();
const chatController = new ChatController(chatService);

// Routes
router.post('/', asyncHandler(chatController.createChat.bind(chatController)));
router.get('/room/:roomId', asyncHandler(chatController.getChatsByRoom.bind(chatController)));
router.get('/:id', asyncHandler(chatController.getChatById.bind(chatController)));
router.delete('/:id', asyncHandler(chatController.deleteChat.bind(chatController)));

// Message routes
router.post('/:chatId/messages', asyncHandler(chatController.sendMessage.bind(chatController)));
router.get('/:chatId/messages', asyncHandler(chatController.getMessages.bind(chatController)));

// Update and Delete routes
router.put('/:id/name', asyncHandler(chatController.updateChatName.bind(chatController)));
router.delete('/messages/:messageId', asyncHandler(chatController.deleteMessage.bind(chatController)));


export default router; 