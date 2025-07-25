import config from "../config";
import { TokenPayload } from "../config/types";
import jwt from "jsonwebtoken";

const tokenBlacklist = new Set<string>();

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
            
            if (tokenBlacklist.has(token)) {
                throw new Error("Token has been invalidated");
            }
            
            return jwt.verify(token, this.secretKey) as TokenPayload;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error("Token Expired");
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new Error("Invalid token");
            }
            throw new Error("Invalid token");
        }
    }
    
    blacklistToken(token: string): void {
        // Add token to blacklist
        tokenBlacklist.add(token);
        this.cleanupExpiredTokens();
    }
    
    isTokenBlacklisted(token: string): boolean {
        return tokenBlacklist.has(token);
    }
    
    private cleanupExpiredTokens(): void {
        // Clean up expired tokens from blacklist (optional optimization)
        for (const blacklistedToken of tokenBlacklist) {
            try {
                jwt.verify(blacklistedToken, this.secretKey);
            } catch (error) {
                if (error instanceof jwt.TokenExpiredError) {
                    tokenBlacklist.delete(blacklistedToken);
                }
            }
        }
    }
    
    clear() {
        // Clear all blacklisted tokens (useful for testing)
        tokenBlacklist.clear();
    }
}