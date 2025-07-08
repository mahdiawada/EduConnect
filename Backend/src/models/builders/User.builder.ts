import { User } from "../User.model";
import logger from "../../utils/logger";

export class UserBuilder {
    private id!: string;
    private username!: string;
    private email!: string;
    private passwordHash!: string;
    private fullName!: string;
    private avatarUrl?: string;
    private bio?: string;
    private isActive: boolean = true;
    private createdAt?: Date;
    private updatedAt?: Date;

    setId(id: string): UserBuilder {
        this.id = id;
        return this;
    }

    setUsername(username: string): UserBuilder {
        this.username = username;
        return this;
    }

    setEmail(email: string): UserBuilder {
        this.email = email;
        return this;
    }

    setPasswordHash(passwordHash: string): UserBuilder {
        this.passwordHash = passwordHash;
        return this;
    }

    setFullName(fullName: string): UserBuilder {
        this.fullName = fullName;
        return this;
    }

    setAvatarUrl(avatarUrl: string): UserBuilder {
        this.avatarUrl = avatarUrl;
        return this;
    }

    setBio(bio: string): UserBuilder {
        this.bio = bio;
        return this;
    }

    setIsActive(isActive: boolean): UserBuilder {
        this.isActive = isActive;
        return this;
    }

    setCreatedAt(createdAt: Date): UserBuilder {
        this.createdAt = createdAt;
        return this;
    }

    setUpdatedAt(updatedAt: Date): UserBuilder {
        this.updatedAt = updatedAt;
        return this;
    }

    // For backward compatibility
    setName(name: string): UserBuilder {
        this.fullName = name;
        return this;
    }

    setAvatar(avatar: string): UserBuilder {
        this.avatarUrl = avatar;
        return this;
    }

    setPassword(password: string): UserBuilder {
        this.passwordHash = password;
        return this;
    }

    build(): User {
        const requiredProps = [
            this.id,
            this.username,
            this.email,
            this.passwordHash,
            this.fullName
        ];

        for (const property of requiredProps) {
            if (property === null || property === undefined) {
                logger.error("Missing required properties, could not build a User");
                throw Error("Missing Required Properties");
            }
        }

        return new User(
            this.id,
            this.username,
            this.email,
            this.passwordHash,
            this.fullName,
            this.avatarUrl,
            this.bio,
            this.isActive,
            this.createdAt,
            this.updatedAt
        );
    }
}