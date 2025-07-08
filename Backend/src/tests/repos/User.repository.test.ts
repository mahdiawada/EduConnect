import { UserRepository } from '../../repositories/PostgreSQL/User.repository';
import { User } from '../../models/User.model';
import { ConnectionManager } from '../../repositories/PostgreSQL/ConnectionManager';
import { UserMapper, PostgresUser } from '../../mappers/User.mapper';

// Mock the dependencies
jest.mock('../../repositories/PostgreSQL/ConnectionManager');
jest.mock('../../mappers/User.mapper');

describe('UserRepository', () => {
    let userRepository: UserRepository;
    let mockPool: any;
    let mockUserMapper: jest.Mocked<UserMapper>;

    // Sample test data
    const mockUserData: PostgresUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123',
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        is_active: true,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01')
    };

    const mockUser = new User(
        mockUserData.id,
        mockUserData.username,
        mockUserData.email,
        mockUserData.password_hash,
        mockUserData.full_name,
        mockUserData.avatar_url,
        mockUserData.bio,
        mockUserData.is_active,
        mockUserData.created_at,
        mockUserData.updated_at
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
        
        // Setup UserMapper mock
        mockUserMapper = new UserMapper() as jest.Mocked<UserMapper>;
        mockUserMapper.map = jest.fn().mockReturnValue(mockUser);
        (UserMapper as jest.MockedClass<typeof UserMapper>).mockImplementation(() => mockUserMapper);
        
        userRepository = new UserRepository();
    });

    describe('init', () => {
        it('should initialize the user table successfully', async () => {
            // Arrange
            mockPool.query.mockResolvedValue({ rows: [] });

            // Act
            await userRepository.init();

            // Assert
            expect(ConnectionManager.getConnection).toHaveBeenCalled();
            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS users'));
        });

        it('should throw error when table creation fails', async () => {
            // Arrange
            const error = new Error('Database connection failed');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(userRepository.init()).rejects.toThrow('Failed to initialize User table');
        });
    });

    describe('create', () => {
        it('should create a user successfully', async () => {
            // Arrange
            const expectedId = '123e4567-e89b-12d3-a456-426614174000';
            mockPool.query.mockResolvedValue({ rows: [{ id: expectedId }] });

            // Act
            const result = await userRepository.create(mockUser);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO users'),
                [
                    mockUser.getUsername(),
                    mockUser.getEmail(),
                    mockUser.getPasswordHash(),
                    mockUser.getFullName(),
                    mockUser.getAvatarUrl(),
                    mockUser.getBio(),
                    mockUser.getIsActive()
                ]
            );
            expect(result).toBe(expectedId);
        });

        it('should throw error when user creation fails', async () => {
            // Arrange
            const error = new Error('Duplicate email');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(userRepository.create(mockUser)).rejects.toThrow('Failed to create user.');
        });
    });

    describe('get', () => {
        it('should get a user by id successfully', async () => {
            // Arrange
            const userId = '123e4567-e89b-12d3-a456-426614174000';
            mockPool.query.mockResolvedValue({ rows: [mockUserData] });

            // Act
            const result = await userRepository.get(userId);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM users'),
                [userId]
            );
            expect(mockUserMapper.map).toHaveBeenCalledWith(mockUserData);
            expect(result).toBe(mockUser);
        });

        it('should throw error when user not found', async () => {
            // Arrange
            const userId = 'non-existent-id';
            mockPool.query.mockResolvedValue({ rows: [] });

            // Act & Assert
            await expect(userRepository.get(userId)).rejects.toThrow(`User with id ${userId} not found`);
        });

        it('should throw error when database query fails', async () => {
            // Arrange
            const userId = '123e4567-e89b-12d3-a456-426614174000';
            const error = new Error('Database error');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(userRepository.get(userId)).rejects.toThrow(`Failed to get user of id ${userId}`);
        });
    });

    describe('getAll', () => {
        it('should get all users successfully', async () => {
            // Arrange
            const mockUsersData = [mockUserData, { ...mockUserData, id: '456e7890-e89b-12d3-a456-426614174001' }];
            mockPool.query.mockResolvedValue({ rows: mockUsersData });

            // Act
            const result = await userRepository.getAll();

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM users'));
            expect(mockUserMapper.map).toHaveBeenCalledTimes(2);
            expect(result).toEqual([mockUser, mockUser]);
        });

        it('should throw error when no users found', async () => {
            // Arrange
            mockPool.query.mockResolvedValue({ rows: [] });

            // Act & Assert
            await expect(userRepository.getAll()).rejects.toThrow('No Users found');
        });

        it('should throw error when database query fails', async () => {
            // Arrange
            const error = new Error('Database error');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(userRepository.getAll()).rejects.toThrow('Failed to get all users');
        });
    });

    describe('update', () => {
        it('should update a user successfully', async () => {
            // Arrange
            mockPool.query.mockResolvedValue({ rows: [{ id: mockUser.getId() }] });

            // Act
            await userRepository.update(mockUser);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users'),
                [
                    mockUser.getId(),
                    mockUser.getUsername(),
                    mockUser.getEmail(),
                    mockUser.getPasswordHash(),
                    mockUser.getFullName(),
                    mockUser.getAvatarUrl(),
                    mockUser.getBio(),
                    mockUser.getIsActive()
                ]
            );
        });

        it('should throw error when update fails', async () => {
            // Arrange
            const error = new Error('Update failed');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(userRepository.update(mockUser)).rejects.toThrow(`Couldn't update user of id ${mockUser.getId()}`);
        });
    });

    describe('delete', () => {
        it('should delete a user successfully', async () => {
            // Arrange
            const userId = '123e4567-e89b-12d3-a456-426614174000';
            mockPool.query.mockResolvedValue({ rowCount: 1 });

            // Act
            await userRepository.delete(userId);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM users'),
                [userId]
            );
        });

        it('should throw error when user not found for deletion', async () => {
            // Arrange
            const userId = 'non-existent-id';
            mockPool.query.mockResolvedValue({ rowCount: 0 });

            // Act & Assert
            await expect(userRepository.delete(userId)).rejects.toThrow(`User with id ${userId} not found`);
        });

        it('should throw error when deletion fails', async () => {
            // Arrange
            const userId = '123e4567-e89b-12d3-a456-426614174000';
            const error = new Error('Delete failed');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(userRepository.delete(userId)).rejects.toThrow(`Failed to delete user with id ${userId}`);
        });
    });

    describe('findByEmail', () => {
        it('should find user by email successfully', async () => {
            // Arrange
            const email = 'test@example.com';
            mockPool.query.mockResolvedValue({ rows: [mockUserData] });

            // Act
            const result = await userRepository.getByEmail(email);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM users WHERE email'),
                [email]
            );
            expect(mockUserMapper.map).toHaveBeenCalledWith(mockUserData);
            expect(result).toBe(mockUser);
        });

        it('should return null when user not found by email', async () => {
            // Arrange
            const email = 'nonexistent@example.com';
            mockPool.query.mockResolvedValue({ rows: [] });

            // Act
            const result = await userRepository.getByEmail(email);

            // Assert
            expect(result).toBeNull();
        });

        it('should throw error when database query fails', async () => {
            // Arrange
            const email = 'test@example.com';
            const error = new Error('Database error');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(userRepository.getByEmail(email)).rejects.toThrow(`Failed to find user by email ${email}`);
        });
    });

    describe('findByUsername', () => {
        it('should find user by username successfully', async () => {
            // Arrange
            const username = 'testuser';
            mockPool.query.mockResolvedValue({ rows: [mockUserData] });

            // Act
            const result = await userRepository.getByUsername(username);

            // Assert
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM users WHERE username = $1'),
                [username]
            );
            expect(mockUserMapper.map).toHaveBeenCalledWith(mockUserData);
            expect(result).toBe(mockUser);
        });

        it('should return null when user not found by username', async () => {
            // Arrange
            const username = 'nonexistentuser';
            mockPool.query.mockResolvedValue({ rows: [] });

            // Act
            const result = await userRepository.getByUsername(username);

            // Assert
            expect(result).toBeNull();
        });

        it('should throw error when database query fails', async () => {
            // Arrange
            const username = 'testuser';
            const error = new Error('Database error');
            mockPool.query.mockRejectedValue(error);

            // Act & Assert
            await expect(userRepository.getByUsername(username)).rejects.toThrow(`Failed to find user by username ${username}`);
        });
    });
});
