import { User } from "../../models/User.model";
import { id, Initializable, IRepository } from "../IRepository";
import logger from "../../utils/logger";
import { ConnectionManager } from "./ConnectionManager";
import { PostgresUser, UserMapper } from "../../mappers/User.mapper";

const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const INSERT_USER = `
INSERT INTO users (username, email, password_hash, full_name, avatar_url, bio, is_active)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id;
`;

const GET_ALL_USERS = `SELECT * FROM users`;

const GET_USER = `SELECT * FROM users WHERE id = $1`;

const UPDATE_USER = `
UPDATE users
SET 
    username = $2,
    email = $3,
    password_hash = $4,
    full_name = $5,
    avatar_url = $6,
    bio = $7,
    is_active = $8,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING id;
`;

const DELETE_USER = `
DELETE FROM users WHERE id = $1;
`;

const GET_USER_BY_EMAIL = `SELECT * FROM users WHERE email = $1`;

const GET_USER_BY_USERNAME = `SELECT * FROM users WHERE username = $1`;

export class UserRepository implements IRepository<User>, Initializable {
    
    async init() {
        try {
            // connect to db 
        const pool = await ConnectionManager.getConnection();
        await pool.query(CREATE_TABLE);
        logger.info("User table initialized");
        } catch (error) {
            logger.error("Failed to initialize User table", error);
            throw new Error("Failed to initialize User table");
        }
    }    

    async create(user: User): Promise<id> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(INSERT_USER, [
                user.getUsername(), 
                user.getEmail(), 
                user.getPasswordHash(), 
                user.getFullName(), 
                user.getAvatarUrl(), 
                user.getBio(), 
                user.getIsActive()
            ]);
            logger.info("User Inserted");
            // Return the database-generated ID, not the User object ID
            return result.rows[0].id;
        } catch (error) {
            logger.error('Error creating user:', error);
            throw new Error('Failed to create user.');
        }
    }
    async get(id: id): Promise<User> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_USER, [id]);
            
            if (result.rows.length === 0) {
                throw new Error(`User with id ${id} not found`);
            }
            
            return new UserMapper().map(result.rows[0]);
        } catch (error) {
            // Check if this is a "not found" error we threw ourselves
            if (error instanceof Error && error.message.includes('not found')) {
                throw error; // Re-throw the original "not found" error
            }
            
            logger.error(`Failed to get user of id ${id}:`, error);
            throw new Error(`Failed to get user of id ${id}`);
        }
    }
    async getAll(): Promise<User[]> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_ALL_USERS);
            if (result.rows.length === 0) {
                throw new Error(`No Users found`);
            }
            const mapper = new UserMapper();
            return result.rows.map((user: PostgresUser) => mapper.map(user)); 
        } catch (error) {
            logger.error("Failed to get all users ");
            throw new Error("Failed to get all users"+ error );
        }
    }
    async update(user: User): Promise<void> {
        try {
            const pool = await ConnectionManager.getConnection();
            await pool.query(UPDATE_USER, [
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getFullName(),
                user.getAvatarUrl(),
                user.getBio(),
                user.getIsActive()
            ]);
            logger.info("User Updated");
        } catch (error) {
            logger.error("Couldn't update user of id"+ user.getId());
            throw new Error(`Couldn't update user of id ${user.getId()}`+ error)
        }
    }
    async delete(id: id): Promise<void> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(DELETE_USER, [id]);
            if (result.rowCount === 0) {
                throw new Error(`User with id ${id} not found`);
            }
            logger.info(`User with id ${id} deleted`);
        } catch (error) {
            // Check if this is a "not found" error we threw ourselves
            if (error instanceof Error && error.message.includes('not found')) {
                throw error; // Re-throw the original "not found" error
            }
            
            logger.error(`Failed to delete user with id ${id}:`, error);
            throw new Error(`Failed to delete user with id ${id}`);
        }
    }

    async getByEmail(email: string): Promise<User | null> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_USER_BY_EMAIL, [email]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new UserMapper().map(result.rows[0]);
        } catch (error) {
            logger.error(`Failed to find user by email ${email}:`, error);
            throw new Error(`Failed to find user by email ${email}`);
        }
    }

    async getByUsername(username: string): Promise<User | null> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_USER_BY_USERNAME, [username]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new UserMapper().map(result.rows[0]);
        } catch (error) {
            logger.error(`Failed to find user by username ${username}:`, error);
            throw new Error(`Failed to find user by username ${username}`);
        }
    }
}

export async function createUserRepository(): Promise<UserRepository>{
    const userRepo = new UserRepository();
    await userRepo.init();
    return userRepo;
}
