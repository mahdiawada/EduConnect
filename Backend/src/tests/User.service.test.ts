import { UserService } from '../services/User.service';
import { User } from '../models/User.model';
import { v4 as uuidv4 } from 'uuid';

// Mock the repository to avoid database dependencies
jest.mock('../repositories/PostgreSQL/User.repository', () => ({
    createUserRepository: jest.fn().mockResolvedValue({
        create: jest.fn(),
        get: jest.fn(),
        getAll: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        getByEmail: jest.fn()
    })
}));

describe('UserService', () => {
    let userService: UserService;
    let mockUserRepo: any;

    beforeEach(() => {
        userService = new UserService();
        // Reset all mocks
        jest.clearAllMocks();
    });

    describe('Password Hashing', () => {
        it('should hash passwords when creating a user', async () => {
            const plainPassword = 'MySecurePassword123!';
            const user = new User(
                uuidv4(),
                'testuser',
                'test@example.com',
                plainPassword, // This will be hashed
                'Test User'
            );

            const mockCreate = jest.fn().mockResolvedValue(user.getId());
            
            // Mock the repository to capture the user object passed to create
            const { createUserRepository } = require('../repositories/PostgreSQL/User.repository');
            mockUserRepo = {
                create: mockCreate,
                get: jest.fn(),
                getAll: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                getByEmail: jest.fn()
            };
            createUserRepository.mockResolvedValue(mockUserRepo);

            await userService.createUser(user);

            expect(mockCreate).toHaveBeenCalledTimes(1);
            const capturedUser = mockCreate.mock.calls[0][0];
            
            // Verify the password was hashed (should be different from plain text)
            expect(capturedUser.getPasswordHash()).not.toBe(plainPassword);
            expect(capturedUser.getPasswordHash()).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/); // bcrypt hash pattern
        });

        it('should validate passwords correctly', async () => {
            const plainPassword = 'MySecurePassword123!';
            const user = new User(
                uuidv4(),
                'testuser',
                'test@example.com',
                plainPassword,
                'Test User'
            );

            // First create a user to get the hashed password
            const mockCreate = jest.fn().mockResolvedValue(user.getId());
            const { createUserRepository } = require('../repositories/PostgreSQL/User.repository');
            mockUserRepo = {
                create: mockCreate,
                get: jest.fn(),
                getAll: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                getByEmail: jest.fn()
            };
            createUserRepository.mockResolvedValue(mockUserRepo);

            await userService.createUser(user);
            const capturedUser = mockCreate.mock.calls[0][0];
            const hashedPassword = capturedUser.getPasswordHash();

            // Now test validation with the same password
            mockUserRepo.getByEmail.mockResolvedValue(capturedUser);
            
            const userId = await userService.validateUser('test@example.com', plainPassword);
            expect(userId).toBe(user.getId());
        });

        it('should reject invalid passwords', async () => {
            const user = new User(
                uuidv4(),
                'testuser',
                'test@example.com',
                'MySecurePassword123!',
                'Test User'
            );

            // Mock repository to return a user with a hashed password
            const { createUserRepository } = require('../repositories/PostgreSQL/User.repository');
            mockUserRepo = {
                create: jest.fn(),
                get: jest.fn(),
                getAll: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                getByEmail: jest.fn().mockResolvedValue(user)
            };
            createUserRepository.mockResolvedValue(mockUserRepo);

            // Try to validate with wrong password
            await expect(
                userService.validateUser('test@example.com', 'WrongPassword123!')
            ).rejects.toThrow('Invalid password');
        });

        it('should reject non-existent users', async () => {
            const { createUserRepository } = require('../repositories/PostgreSQL/User.repository');
            mockUserRepo = {
                create: jest.fn(),
                get: jest.fn(),
                getAll: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                getByEmail: jest.fn().mockResolvedValue(null)
            };
            createUserRepository.mockResolvedValue(mockUserRepo);

            await expect(
                userService.validateUser('nonexistent@example.com', 'AnyPassword123!')
            ).rejects.toThrow('User not found');
        });
    });

    describe('Password Strength Validation', () => {
        it('should validate strong passwords', () => {
            const strongPassword = 'MySecurePassword123!';
            const result = userService.validatePasswordStrength(strongPassword);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject weak passwords', () => {
            const weakPassword = 'weak';
            const result = userService.validatePasswordStrength(weakPassword);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors).toContain('Password must be at least 8 characters long');
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
            expect(result.errors).toContain('Password must contain at least one number');
            expect(result.errors).toContain('Password must contain at least one special character');
        });

        it('should provide specific error messages for each validation rule', () => {
            const password = 'password'; // Missing uppercase, number, special char
            const result = userService.validatePasswordStrength(password);
            
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
            expect(result.errors).toContain('Password must contain at least one number');
            expect(result.errors).toContain('Password must contain at least one special character');
            expect(result.errors).not.toContain('Password must be at least 8 characters long');
        });
    });

    describe('Password Update', () => {
        it('should hash new passwords when updating', async () => {
            const userId = uuidv4();
            const oldUser = new User(
                userId,
                'testuser',
                'test@example.com',
                'oldpassword',
                'Test User'
            );

            const { createUserRepository } = require('../repositories/PostgreSQL/User.repository');
            mockUserRepo = {
                create: jest.fn(),
                get: jest.fn().mockResolvedValue(oldUser),
                getAll: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                getByEmail: jest.fn()
            };
            createUserRepository.mockResolvedValue(mockUserRepo);

            const newPassword = 'NewSecurePassword456!';
            await userService.updateUserPassword(userId, newPassword);

            expect(mockUserRepo.update).toHaveBeenCalledTimes(1);
            const updatedUser = mockUserRepo.update.mock.calls[0][0];
            
            // Verify the new password was hashed
            expect(updatedUser.getPasswordHash()).not.toBe(newPassword);
            expect(updatedUser.getPasswordHash()).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/);
        });
    });
}); 