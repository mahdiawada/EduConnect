import { id } from "../repositories/IRepository";
import { User } from "../models/User.model";
import { createUserRepository, UserRepository } from "../repositories/PostgreSQL/User.repository";
import bcrypt from "bcrypt";
import { NotFoundException } from "../utils/exceptions/http/NotFoundException";

export class UserService {
    private userRepo?: UserRepository;
    private readonly SALT_ROUNDS = 10; 

    public async createUser(user: User): Promise<id> {
        const hashedPassword = await this.hashPassword(user.getPassword());
        
        const userWithHashedPassword = new User(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            hashedPassword,
            user.getFullName(),
            user.getAvatarUrl(),
            user.getBio(),
            user.getIsActive(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
        
        return (await this.getRepo()).create(userWithHashedPassword);
    }

    // get user
    public async getUserById(userId: id): Promise<User> {
        return (await this.getRepo()).get(userId);
    }

    // get all users
    public async getAllUsers(): Promise<User[]> {
        return (await this.getRepo()).getAll();
    }

    // update user
    public async updateUser(user: User): Promise<void> {
        return (await this.getRepo()).update(user);
    }

    // delete user
    public async deleteUser(userId: id): Promise<void> {
        return (await this.getRepo()).delete(userId);
    }

    // Validate user credentials with proper password comparison
    async validateUser(email: string, password: string): Promise<id> {  
        const user = await (await this.getRepo()).getByEmail(email);
        if (!user) {
            throw new NotFoundException("User not found");
        }
        
        // Compare the provided password with the stored hash
        const isValidPassword = await this.comparePassword(password, user.getPasswordHash());
        if (!isValidPassword) {
            throw new NotFoundException("Invalid password");
        }
        
        return user.getId();
    }

    // Hash a password using bcrypt
    private async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, this.SALT_ROUNDS);
    }

    // Compare a plain text password with a hash
    private async comparePassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }

    // Update user password with hashing
    public async updateUserPassword(userId: id, newPassword: string): Promise<void> {
        const user = await this.getUserById(userId);
        const hashedPassword = await this.hashPassword(newPassword);
        user.setPasswordHash(hashedPassword);
        await this.updateUser(user);
    }

    // Check if a password meets security requirements
    public validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        if (password.length < 8) {
            errors.push("Password must be at least 8 characters long");
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push("Password must contain at least one uppercase letter");
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push("Password must contain at least one lowercase letter");
        }
        
        if (!/\d/.test(password)) {
            errors.push("Password must contain at least one number");
        }
        
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push("Password must contain at least one special character");
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private async getRepo() {
        if (!this.userRepo) {
            this.userRepo = await createUserRepository();
        }
        return this.userRepo;
    }
}