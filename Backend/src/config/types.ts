import { JwtPayload } from "jsonwebtoken";

export interface TokenPayload extends JwtPayload {
    userID: string;
}

export interface AuthRequest extends Request {
    userId: string;
}