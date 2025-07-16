import { Request, Response, NextFunction } from "express";
import { AuthenticationService } from "../services/Authentication.service";
import { AuthenticationFailedException } from "../utils/exceptions/http/AuthenticationException";

const authService = new AuthenticationService();

export function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
    // get token from header
    const token = req.headers['authorization']?.split(' ')[1];

    // if no token then throw auth error
    if (!token) {
        throw new AuthenticationFailedException();
    }

    // verify token
        const payload = authService.verifyToken(token);

        // add the payload to the request (note: payload uses userID with capital D)
        (req as any).userId = payload.userID;

    // call next
    next();
    } catch (error) {
        // If JWT verification fails or any other auth error
        throw new AuthenticationFailedException();
    }
}