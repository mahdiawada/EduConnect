import { Room } from "../../models/Room.model";
import { id, Initializable, IRepository } from "../IRepository";
import { ConnectionManager } from "./ConnectionManager";
import logger from "../../utils/logger";
import { PostgresRoom, RoomMapper } from "../../mappers/Room.mapper";


const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    is_public BOOLEAN DEFAULT false,
    max_participants INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`
const INSERT_ROOM = `
INSERT INTO rooms (
    name,
    description,
    instructor_id,
    invite_code,
    is_public,
    max_participants,
    is_active
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING id;
`;

const GET_ROOM = `
SELECT * FROM rooms WHERE id = $1;
`;

const GET_ALL_ROOMS = `
SELECT * FROM rooms;
`;

const UPDATE_ROOM = `
UPDATE rooms
SET
    name = $1,
    description = $2,
    instructor_id = $3,
    invite_code = $4,
    is_public = $5,
    max_participants = $6,
    is_active = $7,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $8;
`;

const DELETE_ROOM = `
DELETE FROM rooms WHERE id = $1;
`;

const GET_PUBLIC_ROOMS = `
SELECT * FROM rooms WHERE is_public = true AND is_active = true;
`;

const GET_ROOM_BY_INVITE_CODE = `
SELECT * FROM rooms WHERE invite_code = $1;
`;

export class RoomRepository implements IRepository<Room>, Initializable {
    async init(): Promise<void> {
        try {
            const pool = await ConnectionManager.getConnection();
            await pool.query(CREATE_TABLE);
            logger.info("Room table initialized.");
        } catch (error) {
            logger.error("Failed to initialize Room table", error);
            throw new Error("Failed to initialize Room table")
        }
        
    }
    async create(room: Room): Promise<id> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(INSERT_ROOM, [
                room.getName(),
                room.getDescription(),
                room.getInstructorId(),
                room.getInviteCode(),
                room.getIsPublic(),
                room.getMaxParticipants(),
                room.getIsActive()
            ]);
            logger.info("Room Inserted");
            return result.rows[0].id;
        } catch (error) {
            logger.error("Error creating room:", error);
            throw new Error("Failed to create room.");
        }
    }
    async get(id: id): Promise<Room> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_ROOM, [id]);
            if (result.rows.length === 0) {
                throw new Error(`Room with id ${id} not found`);
            }
            return new RoomMapper().map(result.rows[0]);
        } catch (error) {
            logger.error(`Failed to get room of id ${id}:`, error);
            // Re-throw the original error if it's a "not found" error
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw new Error(`Failed to get room of id ${id}`);
        }
    }
    async getAll(): Promise<Room[]> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_ALL_ROOMS);
            if( result.rows.length === 0 ) {
                logger.warn("No rooms found");
                return [];
            }
            const mapper = new RoomMapper();
            return result.rows.map((room: PostgresRoom) => mapper.map(room));
        } catch (error) {
            logger.error("Failed to get all rooms:", error);
            throw new Error("Failed to get all rooms");
        }
    }
    async update(room: Room): Promise<void> {
        try {
            const pool = await ConnectionManager.getConnection();
            await pool.query(UPDATE_ROOM,[
                room.getName(),
                room.getDescription(),
                room.getInstructorId(),
                room.getInviteCode(),
                room.getIsPublic(),
                room.getMaxParticipants(),
                room.getIsActive(),
                room.getId()
            ]);
            logger.info("Room updated");
        } catch (error) {
            logger.error("Failed to update room:", error);
            throw new Error("Failed to update room");
        }
    }
    async delete(id: id): Promise<void> {
        try {
           const pool = await ConnectionManager.getConnection();
            const result = await pool.query(DELETE_ROOM, [id]);
            if(result.rowCount === 0){
                throw new Error(`Room with id ${id} not found`);
            } 
            logger.info(`Room of id ${id} is deleted successfully`); 
        } catch (error) {
            logger.error(`Failed to delete room with id ${id}:`, error);
            // Re-throw the original error if it's a "not found" error
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw new Error(`Failed to delete room with id ${id}`);   
        }
    }

    async getPublicRooms(): Promise<Room[]> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_PUBLIC_ROOMS);
            if (result.rows.length === 0) {
                return [];
            }
            const mapper = new RoomMapper();
            return result.rows.map((room: PostgresRoom) => mapper.map(room));
        } catch (error) {
            logger.error("Failed to get public rooms:", error);
            throw new Error("Failed to get public rooms");
        }
    }

    async getByInviteCode(inviteCode: string): Promise<Room> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_ROOM_BY_INVITE_CODE, [inviteCode]);
            if (result.rows.length === 0) {
                throw new Error(`Room with invite code ${inviteCode} not found`);
            }
            return new RoomMapper().map(result.rows[0]);
        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            logger.error(`Failed to get room by invite code ${inviteCode}:`, error);
            throw new Error(`Failed to get room by invite code ${inviteCode}`);
        }
    }
}