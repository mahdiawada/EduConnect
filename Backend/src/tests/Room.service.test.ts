import { RoomService } from '../services/Room.service';
import { Room } from '../models/Room.model';
import { RoomMember } from '../models/RoomMember.model';
import { RoomRepository } from '../repositories/PostgreSQL/Room.repository';
import { RoomMemberRepository } from '../repositories/PostgreSQL/RoomMember.repository';

// Mock the repositories
jest.mock('../repositories/PostgreSQL/Room.repository');
jest.mock('../repositories/PostgreSQL/RoomMember.repository');

describe('RoomService', () => {
    let roomService: RoomService;
    let mockRoomRepo: jest.Mocked<RoomRepository>;
    let mockRoomMemberRepo: jest.Mocked<RoomMemberRepository>;

    beforeEach(() => {
        roomService = new RoomService();
        
        // Get the mocked instances
        mockRoomRepo = (roomService as any).roomRepo;
        mockRoomMemberRepo = (roomService as any).roomMemberRepo;
        
        jest.clearAllMocks();
    });

    describe('createRoom', () => {
        it('should throw error when room name is missing', async () => {
            await expect(roomService.createRoom('', 'user123')).rejects.toThrow('Room name is required');
        });

        it('should throw error when room name is too long', async () => {
            const longName = 'a'.repeat(101);
            await expect(roomService.createRoom(longName, 'user123')).rejects.toThrow('Room name must be less than 100 characters');
        });

        it('should throw error when instructor ID is missing', async () => {
            await expect(roomService.createRoom('Test Room', '')).rejects.toThrow('Instructor ID is required');
        });

        it('should throw error when max participants is too low', async () => {
            await expect(roomService.createRoom('Test Room', 'user123', undefined, false, 0)).rejects.toThrow('Max participants must be between 1 and 1000');
        });

        it('should throw error when max participants is too high', async () => {
            await expect(roomService.createRoom('Test Room', 'user123', undefined, false, 1001)).rejects.toThrow('Max participants must be between 1 and 1000');
        });

        it('should create room successfully with valid data', async () => {
            // Mock repository methods
            mockRoomRepo.create.mockResolvedValue('room-123');
            mockRoomMemberRepo.create.mockResolvedValue('member-123');

            const result = await roomService.createRoom('Test Room', 'user123', 'Test Description', true, 100);

            expect(result).toBeInstanceOf(Room);
            expect(result.getName()).toBe('Test Room');
            expect(result.getInstructorId()).toBe('user123');
            expect(result.getDescription()).toBe('Test Description');
            expect(result.getIsPublic()).toBe(true);
            expect(result.getMaxParticipants()).toBe(100);
            expect(result.getIsActive()).toBe(true);
            expect(mockRoomRepo.create).toHaveBeenCalled();
            expect(mockRoomMemberRepo.create).toHaveBeenCalled();
        });

        it('should create room with default values', async () => {
            mockRoomRepo.create.mockResolvedValue('room-123');
            mockRoomMemberRepo.create.mockResolvedValue('member-123');

            const result = await roomService.createRoom('Test Room', 'user123');

            expect(result.getIsPublic()).toBe(false);
            expect(result.getMaxParticipants()).toBe(50);
            expect(result.getDescription()).toBeUndefined();
        });
    });

    describe('getRoom', () => {
        it('should get room successfully', async () => {
            const mockRoom = new Room('room-123', 'Test Room', 'user123', 'ABC123');
            mockRoomRepo.get.mockResolvedValue(mockRoom);

            const result = await roomService.getRoom('room-123');

            expect(result).toBe(mockRoom);
            expect(mockRoomRepo.get).toHaveBeenCalledWith('room-123');
        });

        it('should throw error when room not found', async () => {
            mockRoomRepo.get.mockRejectedValue(new Error('Room not found'));

            await expect(roomService.getRoom('room-123')).rejects.toThrow('Failed to get room room-123: Error: Room not found');
        });
    });

    describe('getRoomsByUser', () => {
        it('should get rooms for user successfully', async () => {
            const mockRoomData = [
                {
                    id: 'room-1',
                    name: 'Room 1',
                    instructor_id: 'user123',
                    invite_code: 'ABC123',
                    is_public: true,
                    max_participants: 50,
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            ];
            mockRoomMemberRepo.getRoomsByUserId.mockResolvedValue(mockRoomData);

            const result = await roomService.getRoomsByUser('user123');

            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(Room);
            expect(mockRoomMemberRepo.getRoomsByUserId).toHaveBeenCalledWith('user123');
        });

        it('should throw error when getting rooms fails', async () => {
            mockRoomMemberRepo.getRoomsByUserId.mockRejectedValue(new Error('Database error'));

            await expect(roomService.getRoomsByUser('user123')).rejects.toThrow('Failed to get rooms for user user123: Error: Database error');
        });
    });

    describe('getPublicRooms', () => {
        it('should get public rooms successfully', async () => {
            const mockRooms = [
                new Room('room-1', 'Public Room 1', 'user123', 'ABC123', 'Description 1', true),
                new Room('room-2', 'Public Room 2', 'user456', 'DEF456', 'Description 2', true)
            ];
            mockRoomRepo.getPublicRooms.mockResolvedValue(mockRooms);

            const result = await roomService.getPublicRooms();

            expect(result).toEqual(mockRooms);
            expect(mockRoomRepo.getPublicRooms).toHaveBeenCalled();
        });

        it('should throw error when getting public rooms fails', async () => {
            mockRoomRepo.getPublicRooms.mockRejectedValue(new Error('Database error'));

            await expect(roomService.getPublicRooms()).rejects.toThrow('Failed to get public rooms: Error: Database error');
        });
    });

    describe('joinRoomByInvite', () => {
        it('should join room by invite code successfully', async () => {
            const mockRoom = new Room('room-123', 'Test Room', 'user123', 'ABC123');
            mockRoom.canJoin = jest.fn().mockReturnValue(true);
            mockRoom.isFull = jest.fn().mockReturnValue(false);
            
            mockRoomRepo.getByInviteCode.mockResolvedValue(mockRoom);
            mockRoomMemberRepo.getByRoomAndUser.mockResolvedValue(null);
            mockRoomMemberRepo.getMemberCount.mockResolvedValue(5);
            mockRoomMemberRepo.create.mockResolvedValue('member-123');

            const result = await roomService.joinRoomByInvite('ABC123', 'user456');

            expect(result).toBe(mockRoom);
            expect(mockRoomRepo.getByInviteCode).toHaveBeenCalledWith('ABC123');
            expect(mockRoomMemberRepo.getByRoomAndUser).toHaveBeenCalledWith('room-123', 'user456');
            expect(mockRoomMemberRepo.getMemberCount).toHaveBeenCalledWith('room-123');
            expect(mockRoomMemberRepo.create).toHaveBeenCalled();
        });

        it('should throw error when room is not active', async () => {
            const mockRoom = new Room('room-123', 'Test Room', 'user123', 'ABC123');
            mockRoom.canJoin = jest.fn().mockReturnValue(false);
            
            mockRoomRepo.getByInviteCode.mockResolvedValue(mockRoom);

            await expect(roomService.joinRoomByInvite('ABC123', 'user456')).rejects.toThrow('Failed to join room: Error: This room is not active');
        });

        it('should throw error when user is already a member', async () => {
            const mockRoom = new Room('room-123', 'Test Room', 'user123', 'ABC123');
            const mockMember = new RoomMember('member-123', 'room-123', 'user456', 'student');
            
            mockRoom.canJoin = jest.fn().mockReturnValue(true);
            mockRoomRepo.getByInviteCode.mockResolvedValue(mockRoom);
            mockRoomMemberRepo.getByRoomAndUser.mockResolvedValue(mockMember);

            await expect(roomService.joinRoomByInvite('ABC123', 'user456')).rejects.toThrow('Failed to join room: Error: You are already a member of this room');
        });

        it('should throw error when room is full', async () => {
            const mockRoom = new Room('room-123', 'Test Room', 'user123', 'ABC123');
            mockRoom.canJoin = jest.fn().mockReturnValue(true);
            mockRoom.isFull = jest.fn().mockReturnValue(true);
            
            mockRoomRepo.getByInviteCode.mockResolvedValue(mockRoom);
            mockRoomMemberRepo.getByRoomAndUser.mockResolvedValue(null);
            mockRoomMemberRepo.getMemberCount.mockResolvedValue(50);

            await expect(roomService.joinRoomByInvite('ABC123', 'user456')).rejects.toThrow('Failed to join room: Error: This room is full');
        });
    });

    describe('joinPublicRoom', () => {
        it('should join public room successfully', async () => {
            const mockRoom = new Room('room-123', 'Test Room', 'user123', 'ABC123', 'Description', true);
            mockRoom.canBeJoinedPublicly = jest.fn().mockReturnValue(true);
            mockRoom.isFull = jest.fn().mockReturnValue(false);
            
            mockRoomRepo.get.mockResolvedValue(mockRoom);
            mockRoomMemberRepo.getByRoomAndUser.mockResolvedValue(null);
            mockRoomMemberRepo.getMemberCount.mockResolvedValue(5);
            mockRoomMemberRepo.create.mockResolvedValue('member-123');

            await roomService.joinPublicRoom('room-123', 'user456');

            expect(mockRoomRepo.get).toHaveBeenCalledWith('room-123');
            expect(mockRoomMemberRepo.getByRoomAndUser).toHaveBeenCalledWith('room-123', 'user456');
            expect(mockRoomMemberRepo.getMemberCount).toHaveBeenCalledWith('room-123');
            expect(mockRoomMemberRepo.create).toHaveBeenCalled();
        });

        it('should throw error when room is not public', async () => {
            const mockRoom = new Room('room-123', 'Test Room', 'user123', 'ABC123', 'Description', false);
            mockRoom.canBeJoinedPublicly = jest.fn().mockReturnValue(false);
            
            mockRoomRepo.get.mockResolvedValue(mockRoom);

            await expect(roomService.joinPublicRoom('room-123', 'user456')).rejects.toThrow('Failed to join public room: Error: This room is not public or not active');
        });
    });

    describe('getRoomMembers', () => {
        it('should get room members successfully', async () => {
            const mockMembers = [
                new RoomMember('member-1', 'room-123', 'user123', 'instructor'),
                new RoomMember('member-2', 'room-123', 'user456', 'student')
            ];
            mockRoomMemberRepo.getByRoomId.mockResolvedValue(mockMembers);

            const result = await roomService.getRoomMembers('room-123');

            expect(result).toEqual(mockMembers);
            expect(mockRoomMemberRepo.getByRoomId).toHaveBeenCalledWith('room-123');
        });

        it('should throw error when getting members fails', async () => {
            mockRoomMemberRepo.getByRoomId.mockRejectedValue(new Error('Database error'));

            await expect(roomService.getRoomMembers('room-123')).rejects.toThrow('Failed to get room members for room room-123: Error: Database error');
        });
    });

    describe('removeRoomMember', () => {
        it('should remove member when instructor has permission', async () => {
            const mockRoom = new Room('room-123', 'Test Room', 'user123', 'ABC123');
            const mockRemover = new RoomMember('member-1', 'room-123', 'user123', 'instructor');
            const mockInstructors = [mockRemover];
            
            mockRoomRepo.get.mockResolvedValue(mockRoom);
            mockRoomMemberRepo.getByRoomAndUser.mockResolvedValue(mockRemover);
            mockRoomMemberRepo.getByRoomIdAndRole.mockResolvedValue(mockInstructors);
            mockRoomMemberRepo.deleteByRoomAndUser.mockResolvedValue(undefined);

            await roomService.removeRoomMember('room-123', 'user456', 'user123');

            expect(mockRoomMemberRepo.deleteByRoomAndUser).toHaveBeenCalledWith('room-123', 'user456');
        });

        it('should throw error when user lacks permission', async () => {
            const mockRoom = new Room('room-123', 'Test Room', 'user123', 'ABC123');
            const mockRemover = new RoomMember('member-1', 'room-123', 'user789', 'student');
            
            mockRoomRepo.get.mockResolvedValue(mockRoom);
            mockRoomMemberRepo.getByRoomAndUser.mockResolvedValue(mockRemover);

            await expect(roomService.removeRoomMember('room-123', 'user456', 'user789')).rejects.toThrow('Failed to remove room member: Error: You don\'t have permission to remove this member');
        });

        it('should throw error when instructor tries to remove themselves as only instructor', async () => {
            const mockRoom = new Room('room-123', 'Test Room', 'user123', 'ABC123');
            const mockRemover = new RoomMember('member-1', 'room-123', 'user123', 'instructor');
            const mockInstructors = [mockRemover]; // Only one instructor
            
            mockRoomRepo.get.mockResolvedValue(mockRoom);
            mockRoomMemberRepo.getByRoomAndUser.mockResolvedValue(mockRemover);
            mockRoomMemberRepo.getByRoomIdAndRole.mockResolvedValue(mockInstructors);

            await expect(roomService.removeRoomMember('room-123', 'user123', 'user123')).rejects.toThrow('Failed to remove room member: Error: Cannot remove the only instructor from the room');
        });
    });

    describe('updateRoom', () => {
        it('should update room when instructor has permission', async () => {
            const mockRoom = new Room('room-123', 'Old Name', 'user123', 'ABC123');
            const mockMember = new RoomMember('member-1', 'room-123', 'user123', 'instructor');
            
            mockRoomRepo.get.mockResolvedValue(mockRoom);
            mockRoomMemberRepo.getByRoomAndUser.mockResolvedValue(mockMember);
            mockRoomRepo.update.mockResolvedValue(undefined);

            await roomService.updateRoom('room-123', { name: 'New Name' }, 'user123');

            expect(mockRoomRepo.update).toHaveBeenCalled();
        });

        it('should throw error when non-instructor tries to update', async () => {
            const mockRoom = new Room('room-123', 'Test Room', 'user123', 'ABC123');
            const mockMember = new RoomMember('member-1', 'room-123', 'user456', 'student');
            
            mockRoomRepo.get.mockResolvedValue(mockRoom);
            mockRoomMemberRepo.getByRoomAndUser.mockResolvedValue(mockMember);

            await expect(roomService.updateRoom('room-123', { name: 'New Name' }, 'user456')).rejects.toThrow('Failed to update room: Error: Only instructors can update room information');
        });

        it('should validate room name when updating', async () => {
            const mockRoom = new Room('room-123', 'Test Room', 'user123', 'ABC123');
            const mockMember = new RoomMember('member-1', 'room-123', 'user123', 'instructor');
            
            mockRoomRepo.get.mockResolvedValue(mockRoom);
            mockRoomMemberRepo.getByRoomAndUser.mockResolvedValue(mockMember);

            await expect(roomService.updateRoom('room-123', { name: '' }, 'user123')).rejects.toThrow('Failed to update room: Error: Room name is required');
        });
    });

   
    describe('validation methods', () => {
        describe('validateRoomName', () => {
            it('should throw error for empty room name', async () => {
                const mockRoom = new Room('room-123', 'Test Room', 'user123', 'ABC123');
                const mockMember = new RoomMember('member-1', 'room-123', 'user123', 'instructor');
                
                mockRoomRepo.get.mockResolvedValue(mockRoom);
                mockRoomMemberRepo.getByRoomAndUser.mockResolvedValue(mockMember);

                await expect(roomService.updateRoom('room-123', { name: '' }, 'user123')).rejects.toThrow('Failed to update room: Error: Room name is required');
            });

            it('should throw error for room name too long', async () => {
                const mockRoom = new Room('room-123', 'Test Room', 'user123', 'ABC123');
                const mockMember = new RoomMember('member-1', 'room-123', 'user123', 'instructor');
                const longName = 'a'.repeat(101);
                
                mockRoomRepo.get.mockResolvedValue(mockRoom);
                mockRoomMemberRepo.getByRoomAndUser.mockResolvedValue(mockMember);

                await expect(roomService.updateRoom('room-123', { name: longName }, 'user123')).rejects.toThrow('Failed to update room: Error: Room name must be less than 100 characters');
            });
        });

        describe('validateMaxParticipants', () => {
            it('should throw error for max participants too low', async () => {
                const mockRoom = new Room('room-123', 'Test Room', 'user123', 'ABC123');
                const mockMember = new RoomMember('member-1', 'room-123', 'user123', 'instructor');
                
                mockRoomRepo.get.mockResolvedValue(mockRoom);
                mockRoomMemberRepo.getByRoomAndUser.mockResolvedValue(mockMember);

                await expect(roomService.updateRoom('room-123', { maxParticipants: 0 }, 'user123')).rejects.toThrow('Failed to update room: Error: Max participants must be between 1 and 1000');
            });

            it('should throw error for max participants too high', async () => {
                const mockRoom = new Room('room-123', 'Test Room', 'user123', 'ABC123');
                const mockMember = new RoomMember('member-1', 'room-123', 'user123', 'instructor');
                
                mockRoomRepo.get.mockResolvedValue(mockRoom);
                mockRoomMemberRepo.getByRoomAndUser.mockResolvedValue(mockMember);

                await expect(roomService.updateRoom('room-123', { maxParticipants: 1001 }, 'user123')).rejects.toThrow('Failed to update room: Error: Max participants must be between 1 and 1000');
            });
        });
    });
}); 