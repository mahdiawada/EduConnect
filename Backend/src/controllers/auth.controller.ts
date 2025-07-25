import { AuthenticationService } from "../services/Authentication.service";
import { UserService } from "../services/User.service";
import { Request, Response } from "express";
import logger from "../utils/logger";

export class AuthenticationController {
    constructor(
        private authService: AuthenticationService,
        private userService: UserService
    ) { }

    async login(req: Request, res: Response) {
        try {
            const {email, password} = req.body || {};
            if (!email || !password) {
                return res.status(400).json({ error: "Email and password are required" });
            }
    
            const userId = await this.userService.validateUser(email, password);

            const token = this.authService.generateToken(userId);
            
            // Get user data to return with token
            const user = await this.userService.getUserById(userId);

            return res.status(200).json({ 
                message: "Login successful",
                token: token,
                user: {
                    id: user.getId(),
                    username: user.getUsername(),
                    email: user.getEmail(),
                    fullName: user.getFullName(),
                    avatarUrl: user.getAvatarUrl(),
                    bio: user.getBio(),
                    isActive: user.getIsActive(),
                    createdAt: user.getCreatedAt(),
                    updatedAt: user.getUpdatedAt()
                }
            });

        } catch (error) {
            logger.error('Login failed', error);
            // Check for specific error messages from the service
            if (error instanceof Error && (error.message === 'User not found' || error.message === 'Invalid credentials')) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
            // Generic server error
            return res.status(500).json({ error: 'Internal server error during login' });
        }
    }

    async logout(req: Request, res: Response) {
        try {
            // Extract token from Authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(400).json({ error: 'No token provided' });
            }
            
            const token = authHeader.substring(7); // Remove 'Bearer ' prefix
            
            // Verify token is valid before blacklisting (optional security check)
            try {
                this.authService.verifyToken(token);
            } catch (error) {
                return res.status(400).json({ error: 'Invalid token' });
            }
            
            // Blacklist the token
            this.authService.blacklistToken(token);
            
            logger.info('User logged out successfully');
            return res.status(200).json({ 
                message: "Logout successful" 
            });
            
        } catch (error) {
            logger.error('Logout failed', error);
            return res.status(500).json({ error: 'Internal server error during logout' });
        }
    }
}