import { UserService } from "../services/User.service";
import { Request, Response } from "express";
import { User } from "../models/User.model";
import logger from "../utils/logger";

export class UserController {
    private userService: UserService;
    constructor(userService: UserService){
        this.userService = userService;
    }

    // Create user
    public async createUser(req: Request, res: Response){
        try {
            const {username, email, password, fullName, avatarUrl, bio} = req.body;
            if(!username || !email || !password || !fullName){
                throw new Error("Missing required fields");
            }
            const newUser = new User("",username, email, password, fullName, avatarUrl, bio);
            const userId = await this.userService.createUser(newUser);
            try {
                const createdUser = await this.userService.getUserById(userId);
                res.status(201).json(createdUser);
            } catch (error) {
                res.status(201).json({ message: "User created, but unable to fetch user details", id: userId });
            }
        } catch (error) {
            logger.error('Error creating user', error);
            throw new Error('Error creating user');
        }
    }

    // Get user by id
    public async getUserById(req: Request, res: Response){
        const {id} = req.params;
            if(!id){
                throw new Error("User ID is required in the path");
            }
        try {
            const user = await this.userService.getUserById(id);
            res.status(200).json(user);
        } catch (error) {
            logger.error('Error getting user by id', error);
            throw new Error('Error getting user by id');
        }
    }

    // Get all users
    public async getAllUsers(req: Request, res: Response){
        try {
            const users = await this.userService.getAllUsers();
            res.status(200).json(users);
        } catch (error) {
            logger.error('Error getting all users', error);
            throw new Error('Error getting all users');
        }
    }

    // Update user
    public async updateUser(req: Request, res: Response){
        try {
            const id = req.params.id;
        const {username, email, fullName, avatarUrl, bio} = req.body;
        if(!id){
            throw new Error("User ID is required in the path");
        }
        if(!username && !email && !fullName && !avatarUrl && !bio){
            throw new Error("At least one field to update is required");
        }
        
        const existingUser = await this.userService.getUserById(id);
        const updatedUser = new User(
            existingUser.getId(),
            username || existingUser.getUsername(),
            email || existingUser.getEmail(),
            existingUser.getPasswordHash(),
            fullName || existingUser.getFullName(),
            avatarUrl || existingUser.getAvatarUrl(),
            bio || existingUser.getBio(),
            existingUser.getIsActive(),
            existingUser.getCreatedAt(),
            existingUser.getUpdatedAt()
        )
        await this.userService.updateUser(updatedUser);
        res.status(200).json(updatedUser);
        } catch (error) {
            logger.error('Error updating user', error);
        if ( error instanceof Error ) {
            throw error;
        }
        if((error as Error).message === 'User not found') {
                    throw new Error('User not found');
                }
        throw new Error('Error updating user');
        }
    }

    // Delete user
        public async deleteUser(req: Request, res: Response){
            const id = req.params.id;
            if(!id){
                throw new Error("User ID is required in the path");
            }
            try {
                await this.userService.deleteUser(id);
                res.status(204).send();
            } catch (error) {
                logger.error('Error deleting user', error);
                throw new Error('Error deleting user');
            }
    }
}
