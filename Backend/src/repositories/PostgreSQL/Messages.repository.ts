import { Message } from "../../models/Messages.model";
import { id, Initializable, IRepository } from "../IRepository";
import logger from "../../utils/logger";
import { ConnectionManager } from "./ConnectionManager";
import { PostgresMessage, MessageMapper } from "../../mappers/Messages.mapper";

const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(10) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);`;

const INSERT_MESSAGE = `
INSERT INTO messages (chat_id, sender_id, content, message_type)
VALUES ($1, $2, $3, $4)
RETURNING id;
`;

const GET_ALL_MESSAGES = `SELECT * FROM messages ORDER BY created_at ASC`;

const GET_MESSAGE = `SELECT * FROM messages WHERE id = $1`;

const UPDATE_MESSAGE = `
UPDATE messages
SET 
    content = $2,
    message_type = $3
WHERE id = $1
RETURNING id;
`;

const DELETE_MESSAGE = `
DELETE FROM messages WHERE id = $1;
`;

const GET_MESSAGES_BY_CHAT = `
SELECT * FROM messages 
WHERE chat_id = $1 
ORDER BY created_at ASC
LIMIT $2 OFFSET $3;
`;

const GET_MESSAGES_BY_SENDER = `
SELECT * FROM messages 
WHERE sender_id = $1 
ORDER BY created_at DESC;
`;

const GET_RECENT_MESSAGES = `
SELECT * FROM messages 
WHERE chat_id = $1 
AND created_at > $2
ORDER BY created_at ASC;
`;

const GET_MESSAGE_COUNT_BY_CHAT = `
SELECT COUNT(*) as count FROM messages WHERE chat_id = $1;
`;

export class MessagesRepository implements IRepository<Message>, Initializable {
    
    async init() {
        try {
            const pool = await ConnectionManager.getConnection();
            await pool.query(CREATE_TABLE);
            logger.info("Messages table initialized");
        } catch (error) {
            logger.error("Failed to initialize Messages table", error);
            throw new Error("Failed to initialize Messages table");
        }
    }    

    async create(message: Message): Promise<id> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(INSERT_MESSAGE, [
                message.getChatId(),
                message.getSenderId(),
                message.getContent(),
                message.getMessageType()
            ]);
            logger.info("Message Inserted");
            return result.rows[0].id;
        } catch (error) {
            logger.error('Error creating message:', error);
            throw new Error('Failed to create message.');
        }
    }

    async get(id: id): Promise<Message> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_MESSAGE, [id]);
            
            if (result.rows.length === 0) {
                throw new Error(`Message with id ${id} not found`);
            }
            
            return new MessageMapper().map(result.rows[0]);
        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            
            logger.error(`Failed to get message of id ${id}:`, error);
            throw new Error(`Failed to get message of id ${id}`);
        }
    }

    async getAll(): Promise<Message[]> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_ALL_MESSAGES);
            if (result.rows.length === 0) {
                throw new Error(`No Messages found`);
            }
            const mapper = new MessageMapper();
            return result.rows.map((message: PostgresMessage) => mapper.map(message)); 
        } catch (error) {
            logger.error("Failed to get all messages");
            throw new Error("Failed to get all messages: " + error);
        }
    }

    async update(message: Message): Promise<void> {
        try {
            const pool = await ConnectionManager.getConnection();
            await pool.query(UPDATE_MESSAGE, [
                message.getId(),
                message.getContent(),
                message.getMessageType()
            ]);
            logger.info("Message Updated");
        } catch (error) {
            logger.error("Couldn't update message of id " + message.getId());
            throw new Error(`Couldn't update message of id ${message.getId()}: ${error}`)
        }
    }

    async delete(id: id): Promise<void> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(DELETE_MESSAGE, [id]);
            if (result.rowCount === 0) {
                throw new Error(`Message with id ${id} not found`);
            }
            logger.info(`Message with id ${id} deleted`);
        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            
            logger.error(`Failed to delete message with id ${id}:`, error);
            throw new Error(`Failed to delete message with id ${id}`);
        }
    }

    async getByChatId(chatId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_MESSAGES_BY_CHAT, [chatId, limit, offset]);
            
            if (result.rows.length === 0) {
                return [];
            }
            
            const mapper = new MessageMapper();
            return result.rows.map((message: PostgresMessage) => mapper.map(message));
        } catch (error) {
            logger.error(`Failed to get messages by chat id ${chatId}:`, error);
            throw new Error(`Failed to get messages by chat id ${chatId}`);
        }
    }

    async getBySenderId(senderId: string): Promise<Message[]> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_MESSAGES_BY_SENDER, [senderId]);
            
            if (result.rows.length === 0) {
                return [];
            }
            
            const mapper = new MessageMapper();
            return result.rows.map((message: PostgresMessage) => mapper.map(message));
        } catch (error) {
            logger.error(`Failed to get messages by sender id ${senderId}:`, error);
            throw new Error(`Failed to get messages by sender id ${senderId}`);
        }
    }

    async getRecentMessages(chatId: string, since: Date): Promise<Message[]> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_RECENT_MESSAGES, [chatId, since]);
            
            if (result.rows.length === 0) {
                return [];
            }
            
            const mapper = new MessageMapper();
            return result.rows.map((message: PostgresMessage) => mapper.map(message));
        } catch (error) {
            logger.error(`Failed to get recent messages for chat id ${chatId}:`, error);
            throw new Error(`Failed to get recent messages for chat id ${chatId}`);
        }
    }

    async getMessageCountByChat(chatId: string): Promise<number> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_MESSAGE_COUNT_BY_CHAT, [chatId]);
            return parseInt(result.rows[0].count);
        } catch (error) {
            logger.error(`Failed to get message count for chat id ${chatId}:`, error);
            throw new Error(`Failed to get message count for chat id ${chatId}`);
        }
    }
} 