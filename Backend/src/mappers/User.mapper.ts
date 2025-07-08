import { UserBuilder } from "../models/builders/User.builder";
import { IMapper } from "./IMapper";
import { User } from "../models/User.model";

export interface PostgresUser {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    full_name: string;
    avatar_url?: string;
    bio?: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export class UserMapper implements IMapper<PostgresUser, User> {

    map(data: PostgresUser): User {
        return new UserBuilder()
            .setId(data.id)
            .setUsername(data.username)
            .setEmail(data.email)
            .setPassword(data.password_hash)
            .setFullName(data.full_name)
            .setAvatarUrl(data.avatar_url || '')
            .setBio(data.bio || '')
            .setIsActive(data.is_active)
            .setCreatedAt(new Date(data.created_at))
            .setUpdatedAt(new Date(data.updated_at))
            .build();
    }

    reverseMap(data: User): PostgresUser {
        return {
            id: data.getId(),
            username: data.getUsername(),
            email: data.getEmail(),
            password_hash: data.getPasswordHash(),
            full_name: data.getFullName(),
            avatar_url: data.getAvatarUrl(),
            bio: data.getBio(),
            is_active: data.getIsActive(),
            created_at: data.getCreatedAt(),
            updated_at: data.getUpdatedAt()
        };
    }
}

