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
            // const user = await this.userService.getUserById(userId);

            return res.status(200).json({ 
                message: "Login successful",
                token: token,
                // user: user
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

    logout() {
        // TODO: Implement logout method
    }
}