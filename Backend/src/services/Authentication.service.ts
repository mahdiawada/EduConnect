import config from "../config";
import { TokenPayload } from "../config/types";
import jwt from "jsonwebtoken";

export class AuthenticationService {
    constructor (
        private secretKey = config.auth.secretKey, 
        private tokenExpiration = config.auth.tokenExpiration
    ) { }

    generateToken(userID: string): string {
        return jwt.sign(
            { userID },
            this.secretKey,
            { expiresIn: this.tokenExpiration }
        );
    }

    verifyToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, this.secretKey) as TokenPayload;
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                throw new Error("Token Expired");
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new Error("Invalid token");
            }
            throw new Error("Invalid token");
        }

        
    }
    
    clear() {
        // TODO: Implement clear method
    }
}