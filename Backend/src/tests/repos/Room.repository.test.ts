import { RoomRepository } from '../../repositories/PostgreSQL/Room.repository';
import { Room } from '../../models/Room.model';
import { ConnectionManager } from '../../repositories/PostgreSQL/ConnectionManager';
import { RoomMapper, PostgresRoom } from '../../mappers/Room.mapper';

// Mock the dependencies
jest.mock('../../repositories/PostgreSQL/ConnectionManager');
jest.mock('../../mappers/Room.mapper');

describe('RoomRepository', () => {
    let roomRepository: RoomRepository;
    let mockPool: any;
    let mockRoomMapper: jest.Mocked<RoomMapper>;

    // Sample test data
    const mockRoomData: PostgresRoom = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Room',
        description: 'A test room for unit testing',
        instructor_id: '456e7890-e89b-12d3-a456-426614174001',
        invite_code: 'TEST123',
        is_public: false,
        max_participants: 50,
        is_active: true,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01')
    };

    const mockRoom = new Room(
        mockRoomData.id,
        mockRoomData.name,
        mockRoomData.instructor_id,
        mockRoomData.invite_code,
        mockRoomData.description,
        mockRoomData.is_public,
        mockRoomData.max_participants,
        mockRoomData.is_active,
        mockRoomData.created_at,
        mockRoomData.updated_at
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
        
        // Setup RoomMapper mock
        mockRoomMapper = new RoomMapper() as jest.Mocked<RoomMapper>;
        mockRoomMapper.map = jest.fn().mockReturnValue(mockRoom);
        (RoomMapper as jest.MockedClass<typeof RoomMapper>).mockImplementation(() => mockRoomMapper);
        
        roomRepository = new RoomRepository();
    });

    describe('init', () => {
        it('should initialize the room table successfully', async () => {
            // Arrange
            mockPool.query.mockResolvedValue({ rows: [] });

            // Act
            await roomRepository.init();

            // Assert
            expect(ConnectionManager.getConnection).toHaveBeenCalled();
            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS rooms'));
        });

        it('should throw error when table creation fails', async () => {
            // Arrange
            const error = new Error('Database connection failed');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(roomRepository.init()).rejects.toThrow('Failed to initialize Room table');
        });
    });

    describe('create', () => {
        it('should create a room successfully', async () => {
            // Arrange
            const expectedId = '123e4567-e89b-12d3-a456-426614174000';
            mockPool.query.mockResolvedValue({ rows: [{ id: expectedId }] });

            // Act
            const result = await roomRepository.create(mockRoom);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO rooms'),
                [
                    mockRoom.getName(),
                    mockRoom.getDescription(),
                    mockRoom.getInstructorId(),
                    mockRoom.getInviteCode(),
                    mockRoom.getIsPublic(),
                    mockRoom.getMaxParticipants(),
                    mockRoom.getIsActive()
                ]
            );
            expect(result).toBe(expectedId);
        });

        it('should throw error when room creation fails', async () => {
            // Arrange
            const error = new Error('Duplicate invite code');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(roomRepository.create(mockRoom)).rejects.toThrow('Failed to create room.');
        });
    });

    describe('get', () => {
        it('should get a room by id successfully', async () => {
            // Arrange
            const roomId = '123e4567-e89b-12d3-a456-426614174000';
            mockPool.query.mockResolvedValue({ rows: [mockRoomData] });

            // Act
            const result = await roomRepository.get(roomId);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM rooms'),
                [roomId]
            );
            expect(mockRoomMapper.map).toHaveBeenCalledWith(mockRoomData);
            expect(result).toBe(mockRoom);
        });

        it('should throw error when room not found', async () => {
            // Arrange
            const roomId = 'non-existent-id';
            mockPool.query.mockResolvedValue({ rows: [] });

            // Act & Assert
            await expect(roomRepository.get(roomId)).rejects.toThrow(`Room with id ${roomId} not found`);
        });

        it('should throw error when database query fails', async () => {
            // Arrange
            const roomId = '123e4567-e89b-12d3-a456-426614174000';
            const error = new Error('Database error');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(roomRepository.get(roomId)).rejects.toThrow(`Failed to get room of id ${roomId}`);
        });
    });

    describe('getAll', () => {
        it('should get all rooms successfully', async () => {
            // Arrange
            const mockRoomsData = [mockRoomData, { ...mockRoomData, id: '456e7890-e89b-12d3-a456-426614174001' }];
            mockPool.query.mockResolvedValue({ rows: mockRoomsData });

            // Act
            const result = await roomRepository.getAll();

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM rooms'));
            expect(mockRoomMapper.map).toHaveBeenCalledTimes(2);
            expect(result).toEqual([mockRoom, mockRoom]);
        });

        it('should return empty array when no rooms found', async () => {
            // Arrange
            mockPool.query.mockResolvedValue({ rows: [] });

            // Act
            const result = await roomRepository.getAll();

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM rooms'));
            expect(result).toEqual([]);
        });

        it('should throw error when database query fails', async () => {
            // Arrange
            const error = new Error('Database error');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(roomRepository.getAll()).rejects.toThrow('Failed to get all rooms');
        });
    });

    describe('update', () => {
        it('should update a room successfully', async () => {
            // Arrange
            mockPool.query.mockResolvedValue({ rows: [{ id: mockRoom.getId() }] });

            // Act
            await roomRepository.update(mockRoom);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE rooms'),
                [
                    mockRoom.getName(),
                    mockRoom.getDescription(),
                    mockRoom.getInstructorId(),
                    mockRoom.getInviteCode(),
                    mockRoom.getIsPublic(),
                    mockRoom.getMaxParticipants(),
                    mockRoom.getIsActive(),
                    mockRoom.getId()
                ]
            );
        });

        it('should throw error when room update fails', async () => {
            // Arrange
            const error = new Error('Database error');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(roomRepository.update(mockRoom)).rejects.toThrow('Failed to update room');
        });
    });

    describe('delete', () => {
        it('should delete a room successfully', async () => {
            // Arrange
            const roomId = '123e4567-e89b-12d3-a456-426614174000';
            mockPool.query.mockResolvedValue({ rowCount: 1 });

            // Act
            await roomRepository.delete(roomId);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM rooms WHERE id = $1'),
                [roomId]
            );
        });

        it('should throw error when room not found for deletion', async () => {
            // Arrange
            const roomId = 'non-existent-id';
            mockPool.query.mockResolvedValue({ rowCount: 0 });

            // Act & Assert
            await expect(roomRepository.delete(roomId)).rejects.toThrow(`Room with id ${roomId} not found`);
        });

        it('should throw error when room deletion fails', async () => {
            // Arrange
            const roomId = '123e4567-e89b-12d3-a456-426614174000';
            const error = new Error('Database error');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(roomRepository.delete(roomId)).rejects.toThrow(`Failed to delete room with id ${roomId}`);
        });
    });

    describe('edge cases', () => {
        it('should handle room with null description', async () => {
            // Arrange
            const roomWithNullDescription = new Room(
                '123e4567-e89b-12d3-a456-426614174000',
                'Test Room',
                '456e7890-e89b-12d3-a456-426614174001',
                'TEST123',
                undefined, // null description
                false,
                50,
                true
            );
            mockPool.query.mockResolvedValue({ rows: [{ id: '123e4567-e89b-12d3-a456-426614174000' }] });

            // Act
            await roomRepository.create(roomWithNullDescription);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO rooms'),
                [
                    roomWithNullDescription.getName(),
                    roomWithNullDescription.getDescription(),
                    roomWithNullDescription.getInstructorId(),
                    roomWithNullDescription.getInviteCode(),
                    roomWithNullDescription.getIsPublic(),
                    roomWithNullDescription.getMaxParticipants(),
                    roomWithNullDescription.getIsActive()
                ]
            );
        });

        it('should handle room with maximum participants', async () => {
            // Arrange
            const roomWithMaxParticipants = new Room(
                '123e4567-e89b-12d3-a456-426614174000',
                'Large Room',
                '456e7890-e89b-12d3-a456-426614174001',
                'LARGE123',
                'A large room',
                true,
                100, // max participants
                true
            );
            mockPool.query.mockResolvedValue({ rows: [{ id: '123e4567-e89b-12d3-a456-426614174000' }] });

            // Act
            await roomRepository.create(roomWithMaxParticipants);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO rooms'),
                [
                    roomWithMaxParticipants.getName(),
                    roomWithMaxParticipants.getDescription(),
                    roomWithMaxParticipants.getInstructorId(),
                    roomWithMaxParticipants.getInviteCode(),
                    roomWithMaxParticipants.getIsPublic(),
                    roomWithMaxParticipants.getMaxParticipants(),
                    roomWithMaxParticipants.getIsActive()
                ]
            );
        });
    });
});
