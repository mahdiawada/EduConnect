import { Router } from 'express';
import { RoomController } from '../controllers/Room.controller';
import { RoomService } from '../services/Room.service';
import { createRoomRepository } from '../repositories/PostgreSQL/Room.repository';
import { createRoomMemberRepository } from '../repositories/PostgreSQL/RoomMember.repository';
import { createUserRepository } from '../repositories/PostgreSQL/User.repository';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Use an async IIFE to handle top-level await
(async () => {
    // Dependency Injection setup
    const roomRepository = await createRoomRepository();
    const roomMemberRepository = await createRoomMemberRepository();
    const userRepository = await createUserRepository();
    const roomService = new RoomService(roomRepository, roomMemberRepository, userRepository);
    const roomController = new RoomController(roomService);

    router.post('/', asyncHandler(roomController.createRoom.bind(roomController)));
    router.post('/join', asyncHandler(roomController.joinRoom.bind(roomController)));
    router.get('/my-rooms', asyncHandler(roomController.getUserRooms.bind(roomController)));
    router.get('/joined', asyncHandler(roomController.getJoinedRooms.bind(roomController)));
    router.get('/:id', asyncHandler(roomController.getRoomById.bind(roomController)));
    router.get('/', asyncHandler(roomController.getAllRooms.bind(roomController)));
    router.put('/:id', asyncHandler(roomController.updateRoom.bind(roomController)));
    router.delete('/:id', asyncHandler(roomController.deleteRoom.bind(roomController)));
    router.get('/:roomId/members', asyncHandler(roomController.getRoomMembers.bind(roomController)));
    router.delete('/:roomId/members/:memberId', asyncHandler(roomController.removeMember.bind(roomController)));
    router.post('/:roomId/invite', authenticate, asyncHandler(roomController.emailInvite.bind(roomController)));
})();

export default router;
