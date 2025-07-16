import { Room } from "../../models/Room.model";
import { id, Initializable, IRepository } from "../IRepository";
import { ConnectionManager } from "./ConnectionManager";
import logger from "../../utils/logger";
import { PostgresRoom, RoomMapper } from "../../mappers/Room.mapper";


const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(250) PRIMARY KEY ,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`
const INSERT_ROOM = `
INSERT INTO rooms (
    id,
    name,
    description,
    instructor_id,
    invite_code,
    is_active
) VALUES (
    $1, $2, $3, $4, $5, $6
)
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
    is_active = $5,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $6;
`;

const DELETE_ROOM = `
DELETE FROM rooms WHERE id = $1;
`;


const GET_ROOM_BY_INVITE_CODE = `
SELECT * FROM rooms WHERE invite_code = $1;
`;

const GET_ROOMS_BY_INSTRUCTOR = `
SELECT * FROM rooms WHERE instructor_id = $1 ORDER BY created_at DESC;
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
            await pool.query(INSERT_ROOM, [
                room.getId(),
                room.getName(),
                room.getDescription(),
                room.getInstructorId(),
                room.getInviteCode(),
                room.getIsActive()
            ]);
            logger.info("Room Inserted");
            return room.getId();
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

    async getRoomsByInstructorId(instructorId: string): Promise<Room[]> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_ROOMS_BY_INSTRUCTOR, [instructorId]);
            if (result.rows.length === 0) {
                logger.info(`No rooms found for instructor ${instructorId}`);
                return [];
            }
            const mapper = new RoomMapper();
            return result.rows.map((room: PostgresRoom) => mapper.map(room));
        } catch (error) {
            logger.error(`Failed to get rooms for instructor ${instructorId}:`, error);
            throw new Error(`Failed to get rooms for instructor ${instructorId}`);
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
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw new Error(`Failed to delete room with id ${id}`);   
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

export async function createRoomRepository(): Promise<RoomRepository> {
    const userRepository = new RoomRepository();
    await userRepository.init();
    return userRepository;
}