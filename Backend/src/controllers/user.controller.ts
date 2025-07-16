import { UserService } from "../services/User.service";
import { Request, Response } from "express";
import { User } from "../models/User.model";
import logger from "../utils/logger";
import { BadRequestException } from "../utils/exceptions/http/BadRequestException";
import { ServiceException } from "../utils/exceptions/ServiceException";
import { NotFoundException } from "../utils/exceptions/http/NotFoundException";

export class UserController {
    private userService: UserService;
    constructor(userService: UserService){
        this.userService = userService;
    }

    // Create user
    public async createUser(req: Request, res: Response) {
        try {
            const {username, email, password, fullName, avatarUrl, bio} = req.body;
            
            // Input validation
            if(!username || !email || !password || !fullName){
                throw new BadRequestException("Name, email, and password are required", {
                username: !username,
                email: !email,
                password: !password,
                fullName: !fullName
            });
            }

            const newUser = new User("", username, email, password, fullName, avatarUrl, bio);
            const userId = await this.userService.createUser(newUser);
            
            try {
                const createdUser = await this.userService.getUserById(userId);
                res.status(201).json(createdUser);
            } catch (error) {
                res.status(201).json({ message: "User created successfully, but unable to fetch user details", id: userId });
            }
        } catch (error) {
            logger.error('Error creating user', error);
            throw new ServiceException('Error creating user');
        }
    }

    // Get user by id
    public async getUserById(req: Request, res: Response){
        const id = req.params.id;
        
        if(!id){
            throw new BadRequestException('User ID is required in the path');
        }
        
        try {
            const user = await this.userService.getUserById(id);
            res.status(200).json(user);
        } catch (error) {
            logger.error('Error getting user by id', error);
            throw new NotFoundException('User not found');
        }
    }

    // Get all users
    public async getAllUsers(req: Request, res: Response) : Promise<void>{
        try {
            const users = await this.userService.getAllUsers();
            res.status(200).json(users);
        } catch (error) {
            throw new ServiceException('Error fetching users');
        }
    }

    // Update user
    public async updateUser(req: Request, res: Response) : Promise<void>{
        try {
            const id = req.params.id;
            const {username, email, fullName, avatarUrl, bio} = req.body;
            
            if(!id){
                throw new BadRequestException('User ID is required in the path');
            }
            
            if(!username && !email && !fullName && !avatarUrl && !bio){
                throw new BadRequestException('At least one field is required to', 
                    {
                        username: !username,
                        email: !email,
                        fullName: !fullName,
                        avatarUrl: !avatarUrl,
                        bio: !bio
                    });
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
            );
            
            await this.userService.updateUser(updatedUser);
            const updatedUserDetails = await this.userService.getUserById(id);
            res.status(200).json(updatedUserDetails);
        } catch (error) {
            logger.error('Error updating user', error);
            
            if ( error instanceof BadRequestException ) {
            throw error;
            }
            
            if((error as Error).message === 'User not found') {
                throw new Error('User not found');
            }
            
            if ((error as any).code === '23505') { 
                throw new NotFoundException('Username or email already exists');
            }
            
            throw new ServiceException('Internal server error while updating user');
        }
    }

    // Delete user
    public async deleteUser(req: Request, res: Response) : Promise<void>{
        const id = req.params.id;
        
        if(!id){
            throw new BadRequestException('User ID is required in the path');
        }
        
        try {
            await this.userService.deleteUser(id);
            res.status(204).send();
        } catch (error) {
            logger.error('Error deleting user', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            if((error as Error).message === 'User not found') {
                    throw new NotFoundException('User not found');
                }
            throw new ServiceException('Error deleting user');
        }
    }
}
