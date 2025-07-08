import { RoomMemberRepository } from '../../repositories/PostgreSQL/RoomMember.repository';
import { RoomMember } from '../../models/RoomMember.model';
import { ConnectionManager } from '../../repositories/PostgreSQL/ConnectionManager';
import { RoomMemberMapper, PostgresRoomMember } from '../../mappers/RoomMember.mapper';

// Mock the dependencies
jest.mock('../../repositories/PostgreSQL/ConnectionManager');
jest.mock('../../mappers/RoomMember.mapper');

describe('RoomMemberRepository', () => {
    let roomMemberRepository: RoomMemberRepository;
    let mockPool: any;
    let mockRoomMemberMapper: jest.Mocked<RoomMemberMapper>;

    // Sample test data
    const mockRoomMemberData: PostgresRoomMember = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        room_id: '456e7890-e89b-12d3-a456-426614174001',
        user_id: '789e0123-e89b-12d3-a456-426614174002',
        role: 'student',
        joined_at: new Date('2023-01-01T10:00:00Z'),
        is_active: true
    };

    const mockRoomMember = new RoomMember(
        mockRoomMemberData.id,
        mockRoomMemberData.room_id,
        mockRoomMemberData.user_id,
        mockRoomMemberData.role,
        mockRoomMemberData.joined_at,
        mockRoomMemberData.is_active
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
        
        // Setup RoomMemberMapper mock
        mockRoomMemberMapper = new RoomMemberMapper() as jest.Mocked<RoomMemberMapper>;
        mockRoomMemberMapper.map = jest.fn().mockReturnValue(mockRoomMember);
        (RoomMemberMapper as jest.MockedClass<typeof RoomMemberMapper>).mockImplementation(() => mockRoomMemberMapper);
        
        roomMemberRepository = new RoomMemberRepository();
    });

    describe('init', () => {
        it('should initialize the room member table successfully', async () => {
            // Arrange
            mockPool.query.mockResolvedValue({ rows: [] });

            // Act
            await roomMemberRepository.init();

            // Assert
            expect(ConnectionManager.getConnection).toHaveBeenCalled();
            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS room_members'));
        });

        it('should throw error when table creation fails', async () => {
            // Arrange
            const error = new Error('Database connection failed');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(roomMemberRepository.init()).rejects.toThrow('Failed to create room member table.');
        });
    });

    describe('create', () => {
        it('should create a room member successfully', async () => {
            // Arrange
            const expectedId = '123e4567-e89b-12d3-a456-426614174000';
            mockPool.query.mockResolvedValue({ rows: [{ id: expectedId }] });

            // Act
            const result = await roomMemberRepository.create(mockRoomMember);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO room_members'),
                [
                    mockRoomMember.getRoomId(),
                    mockRoomMember.getUserId(),
                    mockRoomMember.getRole()
                ]
            );
            expect(result).toBe(expectedId);
        });

        it('should throw error when room member creation fails', async () => {
            // Arrange
            const error = new Error('Foreign key constraint violation');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(roomMemberRepository.create(mockRoomMember)).rejects.toThrow('Failed to insert room member');
        });
    });

    describe('get', () => {
        it('should get a room member by id successfully', async () => {
            // Arrange
            const roomMemberId = '123e4567-e89b-12d3-a456-426614174000';
            mockPool.query.mockResolvedValue({ rows: [mockRoomMemberData] });

            // Act
            const result = await roomMemberRepository.get(roomMemberId);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM room_members'),
                [roomMemberId]
            );
            expect(mockRoomMemberMapper.map).toHaveBeenCalledWith(mockRoomMemberData);
            expect(result).toBe(mockRoomMember);
        });

        it('should throw error when room member not found', async () => {
            // Arrange
            const roomMemberId = 'non-existent-id';
            mockPool.query.mockResolvedValue({ rows: [] });

            // Act & Assert
            await expect(roomMemberRepository.get(roomMemberId)).rejects.toThrow(`Room Member with id ${roomMemberId} not found`);
        });

        it('should throw error when database query fails', async () => {
            // Arrange
            const roomMemberId = '123e4567-e89b-12d3-a456-426614174000';
            const error = new Error('Database error');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(roomMemberRepository.get(roomMemberId)).rejects.toThrow('Failed to get room member');
        });
    });

    describe('getAll', () => {
        it('should get all room members successfully', async () => {
            // Arrange
            const mockRoomMembersData = [
                mockRoomMemberData, 
                { 
                    ...mockRoomMemberData, 
                    id: '456e7890-e89b-12d3-a456-426614174001',
                    user_id: '789e0123-e89b-12d3-a456-426614174003'
                }
            ];
            mockPool.query.mockResolvedValue({ rows: mockRoomMembersData });

            // Act
            const result = await roomMemberRepository.getAll();

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM room_members'));
            expect(mockRoomMemberMapper.map).toHaveBeenCalledTimes(2);
            expect(result).toEqual([mockRoomMember, mockRoomMember]);
        });

        it('should throw error when no room members found', async () => {
            // Arrange
            mockPool.query.mockResolvedValue({ rows: [] });

            // Act & Assert
            await expect(roomMemberRepository.getAll()).rejects.toThrow('Room members not found');
        });

        it('should throw error when database query fails', async () => {
            // Arrange
            const error = new Error('Database error');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(roomMemberRepository.getAll()).rejects.toThrow('Failed to get all room members');
        });
    });

    describe('update', () => {
        it('should update a room member successfully', async () => {
            // Arrange
            mockPool.query.mockResolvedValue({ rowCount: 1 });

            // Act
            await roomMemberRepository.update(mockRoomMember);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE room_members'),
                [
                    mockRoomMember.getRoomId(),
                    mockRoomMember.getUserId(),
                    mockRoomMember.getRole(),
                    mockRoomMember.getId()
                ]
            );
        });

        it('should throw error when room member not found for update', async () => {
            // Arrange
            mockPool.query.mockResolvedValue({ rowCount: 0 });

            // Act & Assert
            await expect(roomMemberRepository.update(mockRoomMember)).rejects.toThrow(`Room member with id ${mockRoomMember.getId()} not found`);
        });

        it('should throw error when database update fails', async () => {
            // Arrange
            const error = new Error('Database error');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(roomMemberRepository.update(mockRoomMember)).rejects.toThrow(`Failed to update room member of id ${mockRoomMember.getId()}`);
        });
    });

    describe('delete', () => {
        it('should delete a room member successfully', async () => {
            // Arrange
            const roomMemberId = '123e4567-e89b-12d3-a456-426614174000';
            mockPool.query.mockResolvedValue({ rowCount: 1 });

            // Act
            await roomMemberRepository.delete(roomMemberId);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM room_members'),
                [roomMemberId]
            );
        });

        it('should throw error when room member not found for deletion', async () => {
            // Arrange
            const roomMemberId = 'non-existent-id';
            mockPool.query.mockResolvedValue({ rowCount: 0 });

            // Act & Assert
            await expect(roomMemberRepository.delete(roomMemberId)).rejects.toThrow(`Room Member of id ${roomMemberId} not found`);
        });

        it('should throw error when database deletion fails', async () => {
            // Arrange
            const roomMemberId = '123e4567-e89b-12d3-a456-426614174000';
            const error = new Error('Database error');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(roomMemberRepository.delete(roomMemberId)).rejects.toThrow(`Failed to delete room member with id ${roomMemberId}`);
        });
    });

    describe('role-specific tests', () => {
        it('should create room member with instructor role', async () => {
            // Arrange
            const instructorMember = new RoomMember(
                '123e4567-e89b-12d3-a456-426614174000',
                '456e7890-e89b-12d3-a456-426614174001',
                '789e0123-e89b-12d3-a456-426614174002',
                'instructor'
            );
            const expectedId = '123e4567-e89b-12d3-a456-426614174000';
            mockPool.query.mockResolvedValue({ rows: [{ id: expectedId }] });

            // Act
            const result = await roomMemberRepository.create(instructorMember);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO room_members'),
                [
                    instructorMember.getRoomId(),
                    instructorMember.getUserId(),
                    'instructor'
                ]
            );
            expect(result).toBe(expectedId);
        });

        it('should create room member with moderator role', async () => {
            // Arrange
            const moderatorMember = new RoomMember(
                '123e4567-e89b-12d3-a456-426614174000',
                '456e7890-e89b-12d3-a456-426614174001',
                '789e0123-e89b-12d3-a456-426614174002',
                'moderator'
            );
            const expectedId = '123e4567-e89b-12d3-a456-426614174000';
            mockPool.query.mockResolvedValue({ rows: [{ id: expectedId }] });

            // Act
            const result = await roomMemberRepository.create(moderatorMember);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO room_members'),
                [
                    moderatorMember.getRoomId(),
                    moderatorMember.getUserId(),
                    'moderator'
                ]
            );
            expect(result).toBe(expectedId);
        });
    });

    describe('error handling', () => {
        it('should preserve original error message for not found errors', async () => {
            // Arrange
            const roomMemberId = 'non-existent-id';
            mockPool.query.mockResolvedValue({ rows: [] });

            // Act & Assert
            await expect(roomMemberRepository.get(roomMemberId)).rejects.toThrow(`Room Member with id ${roomMemberId} not found`);
        });

        it('should wrap database errors with generic message', async () => {
            // Arrange
            const error = new Error('Connection timeout');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(roomMemberRepository.create(mockRoomMember)).rejects.toThrow('Failed to insert room member');
        });
    });
});
