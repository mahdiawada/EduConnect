import { Request, Response, NextFunction } from "express";
import { AuthenticationService } from "../services/Authentication.service";
import { AuthenticationFailedException } from "../utils/exceptions/http/AuthenticationException";

const authService = new AuthenticationService();

export function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
    
    const token = req.headers['authorization']?.split(' ')[1];

    
    if (!token) {
        throw new AuthenticationFailedException();
    }

    
        const payload = authService.verifyToken(token);

        
        (req as any).userId = payload.userID;

    
    next();
    } catch (error) {
        
        throw new AuthenticationFailedException();
    }
}