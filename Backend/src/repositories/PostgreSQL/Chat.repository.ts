import logger from "../../utils/logger";
import { Chat } from "../../models/Chat.model";
import { id, Initializable, IRepository } from "../IRepository";
import { ConnectionManager } from "./ConnectionManager";
import { PostgresChat, ChatMapper } from "../../mappers/Chat.mapper";

const CREATE_TABLE = `
    CREATE TABLE IF NOT EXISTS chats (
        id VARCHAR(250) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        room_id VARCHAR(250) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

const INSERT_CHAT = `
    INSERT INTO chats (id, name, room_id, created_by)
    VALUES ($1, $2, $3, $4)
    RETURNING id;
`;

const GET_CHAT = `
    SELECT * FROM chats
    WHERE id = $1;
`;

const GET_ALL_CHATS = `
    SELECT * FROM chats;
`;

const UPDATE_CHAT = `
    UPDATE chats
    SET name = $1, room_id = $2, created_by = $3
    WHERE id = $4;
`;

const DELETE_CHAT = `
    DELETE FROM chats
    WHERE id = $1;
`;

const GET_CHATS_BY_ROOM = `
    SELECT * FROM chats
    WHERE room_id = $1;
`;



export class ChatRepository implements IRepository<Chat>, Initializable {
    async init(): Promise<void> {
        try {
            const pool = await ConnectionManager.getConnection();
            await pool.query(CREATE_TABLE);
            logger.info("Chat table initialized.");
        } catch (error) {
            logger.error('Error creating chat table:', error);
            throw new Error('Failed to create chat table.');
        }
    }

    async create(chat: Chat): Promise<id> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(INSERT_CHAT, [
                chat.getId(),
                chat.getName(),
                chat.getRoomId(),
                chat.getCreatedBy(),
            ]);
            logger.info("Chat inserted");
            return result.rows[0].id;
        } catch (error) {
            logger.error("Failed to insert chat", error);
            throw new Error("Failed to insert chat");
        }
    }

    async get(id: id): Promise<Chat> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_CHAT, [id]);
            if (result.rows.length === 0) {
                throw new Error(`Chat with id ${id} not found`);
            }
            return new ChatMapper().map(result.rows[0]);
        } catch (error) {
            logger.error("Failed to get chat", error);
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw new Error("Failed to get chat");
        }
    }

    async getAll(): Promise<Chat[]> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_ALL_CHATS);
            if (result.rows.length === 0) {
                throw new Error(`Chats not found`);
            }
            const mapper = new ChatMapper();
            return result.rows.map((postgresChat: PostgresChat) => mapper.map(postgresChat));
        } catch (error) {
            logger.error("Failed to get all chats", error);
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw new Error("Failed to get all chats");
        }
    }

    async update(chat: Chat): Promise<void> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(UPDATE_CHAT, [
                chat.getName(),
                chat.getRoomId(),
                chat.getCreatedBy(),
                chat.getId()
            ]);
            if (result.rowCount === 0) {
                throw new Error(`Chat with id ${chat.getId()} not found`);
            }
            logger.info("Chat updated");
        } catch (error) {
            logger.error("Failed to update chat of id ", chat.getId(), error);
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw new Error(`Failed to update chat of id ${chat.getId()}`);
        }
    }

    async delete(id: id): Promise<void> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(DELETE_CHAT, [id]);
            if (result.rowCount === 0) {
                throw new Error(`Chat of id ${id} not found`);
            }
            logger.info(`Chat of id ${id} is deleted successfully`);
        } catch (error) {
            logger.error(`Failed to delete chat with id ${id}:`, error);
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw new Error(`Failed to delete chat with id ${id}`);
        }
    }

    // Additional methods specific to Chat functionality

    async getChatsByRoom(roomId: string): Promise<Chat[]> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_CHATS_BY_ROOM, [roomId]);
            if (result.rows.length === 0) {
                return []; // Return empty array instead of throwing error for room chats
            }
            const mapper = new ChatMapper();
            return result.rows.map((postgresChat: PostgresChat) => mapper.map(postgresChat));
        } catch (error) {
            logger.error(`Failed to get chats for room ${roomId}:`, error);
            throw new Error(`Failed to get chats for room ${roomId}`);
        }
    }

    
}

export async function createChatRepository(): Promise<ChatRepository> {
    const chatRepository = new ChatRepository();
    await chatRepository.init();
    return chatRepository;
}