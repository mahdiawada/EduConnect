import logger from "../../utils/logger";
import { RoomMember } from "../../models/RoomMember.model";
import { id, Initializable, IRepository } from "../IRepository";
import { ConnectionManager } from "./ConnectionManager";
import { PostgresRoomMember, RoomMemberMapper } from "../../mappers/RoomMember.mapper";

const CREATE_TABLE = `
    CREATE TABLE IF NOT EXISTS room_members (
        id VARCHAR(250) PRIMARY KEY,
        room_id VARCHAR(250) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('instructor', 'student', 'moderator')),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        UNIQUE(room_id, user_id)
    );
`;

const INSERT_ROOM_MEMBER = `
    INSERT INTO room_members (id,room_id, user_id, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id;
`;

const GET_ROOM_MEMBER = `
    SELECT * FROM room_members
    WHERE id = $1;
`;

const GET_ALL_ROOM_MEMBERS = `
    SELECT * FROM room_members;
`;

const UPDATE_ROOM_MEMBER = `
    UPDATE room_members
    SET room_id = $1, user_id = $2, role = $3
    WHERE id = $4;
`;

const DELETE_ROOM_MEMBER = `
    DELETE FROM room_members
    WHERE id = $1;
`;

const GET_ROOM_MEMBERS_BY_ROOM = `
    SELECT * FROM room_members
    WHERE room_id = $1;
`;

const GET_ROOM_MEMBER_BY_ROOM_AND_USER = `
    SELECT * FROM room_members
    WHERE room_id = $1 AND user_id = $2;
`;

const GET_ROOM_MEMBERS_BY_ROOM_AND_ROLE = `
    SELECT * FROM room_members
    WHERE room_id = $1 AND role = $2;
`;

const GET_ROOMS_BY_USER = `
    SELECT r.* FROM rooms r
    INNER JOIN room_members rm ON r.id = rm.room_id
    WHERE rm.user_id = $1;
`;

const GET_MEMBER_COUNT = `
    SELECT COUNT(*) as count FROM room_members
    WHERE room_id = $1;
`;

const DELETE_ROOM_MEMBER_BY_ROOM_AND_USER = `
    DELETE FROM room_members
    WHERE room_id = $1 AND user_id = $2;
`;

export class RoomMemberRepository implements IRepository<RoomMember>, Initializable {
    async init(): Promise<void> {
        try {
            const pool = await ConnectionManager.getConnection();
            await pool.query(CREATE_TABLE);  
            logger.info("Room member table initialized.");
        } catch (error) {
            logger.error('Error creating room member table:', error);
            throw new Error('Failed to create room member table.');
        }
        
    }
    async create(roomMember: RoomMember): Promise<id> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(INSERT_ROOM_MEMBER, [
            roomMember.getId(),
            roomMember.getRoomId(),
            roomMember.getUserId(),
            roomMember.getRole()
        ]);
        logger.info("Room Member inserted");
        return result.rows[0].id;
        } catch (error) {
            logger.error("Failed to insert room member", error);
            throw new Error("Failed to insert room member");
        }
    }
    async get(id: id): Promise<RoomMember> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_ROOM_MEMBER, [id]);
             if (result.rows.length === 0) {
                throw new Error(`Room Member with id ${id} not found`);
                }
            return new RoomMemberMapper().map(result.rows[0]);
        } catch (error) {
            logger.error("Failed to get room member", error);
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw new Error("Failed to get room member");
        }
    }
    async getAll(): Promise<RoomMember[]> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_ALL_ROOM_MEMBERS);
            if (result.rows.length === 0) {
                throw new Error(`Room members not found`);
                }
            const mapper = new RoomMemberMapper();
            return result.rows.map((postgreRoomMember: PostgresRoomMember) => mapper.map(postgreRoomMember));
        } catch (error) {
            logger.error("Failed to get all room members", error);
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw new Error("Failed to get all room members");
        }
    }
    async update(roomMember: RoomMember): Promise<void> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(UPDATE_ROOM_MEMBER, [
                roomMember.getRoomId(),
                roomMember.getUserId(),
                roomMember.getRole(),
                roomMember.getId()
            ]);
            if(result.rowCount === 0){
                throw new Error(`Room member with id ${roomMember.getId()} not found`);
            } 
            logger.info("Room member updated");
        } catch (error) {
            logger.error("Failed to update room member of id ",roomMember.getId() , error);
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw new Error(`Failed to update room member of id ${roomMember.getId()}`);
        }
    }
    async delete(id: id): Promise<void> {
        try {
           const pool = await ConnectionManager.getConnection();
            const result = await pool.query(DELETE_ROOM_MEMBER, [id]);
            if(result.rowCount === 0){
                throw new Error(`Room Member of id ${id} not found`);
            } 
            logger.info(`Room of id ${id} is deleted successfully`); 
        } catch (error) {
            logger.error(`Failed to delete room member with id ${id}:`, error);
            // Re-throw the original error if it's a "not found" error
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw new Error(`Failed to delete room member with id ${id}`);   
        }        
    }
    async getByRoomId(roomId: string): Promise<RoomMember[]> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_ROOM_MEMBERS_BY_ROOM, [roomId]);
            if (result.rows.length === 0) {
                return [];
            }
            const mapper = new RoomMemberMapper();
            return result.rows.map((member: PostgresRoomMember) => mapper.map(member));
        } catch (error) {
            logger.error(`Failed to get room members for room ${roomId}:`, error);
            throw new Error(`Failed to get room members for room ${roomId}`);
        }
    }

    async getByRoomAndUser(roomId: string, userId: string): Promise<RoomMember | null> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_ROOM_MEMBER_BY_ROOM_AND_USER, [roomId, userId]);
            if (result.rows.length === 0) {
                return null;
            }
            return new RoomMemberMapper().map(result.rows[0]);
        } catch (error) {
            logger.error(`Failed to get room member for room ${roomId} and user ${userId}:`, error);
            throw new Error(`Failed to get room member for room ${roomId} and user ${userId}`);
        }
    }

    async getByRoomIdAndRole(roomId: string, role: string): Promise<RoomMember[]> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_ROOM_MEMBERS_BY_ROOM_AND_ROLE, [roomId, role]);
            if (result.rows.length === 0) {
                return [];
            }
            const mapper = new RoomMemberMapper();
            return result.rows.map((member: PostgresRoomMember) => mapper.map(member));
        } catch (error) {
            logger.error(`Failed to get room members for room ${roomId} with role ${role}:`, error);
            throw new Error(`Failed to get room members for room ${roomId} with role ${role}`);
        }
    }

    async getRoomsByUserId(userId: string): Promise<any[]> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_ROOMS_BY_USER, [userId]);
            if (result.rows.length === 0) {
                return [];
            }
            return result.rows;
        } catch (error) {
            logger.error(`Failed to get rooms for user ${userId}:`, error);
            throw new Error(`Failed to get rooms for user ${userId}`);
        }
    }

    async getMemberCount(roomId: string): Promise<number> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(GET_MEMBER_COUNT, [roomId]);
            return parseInt(result.rows[0].count);
        } catch (error) {
            logger.error(`Failed to get member count for room ${roomId}:`, error);
            throw new Error(`Failed to get member count for room ${roomId}`);
        }
    }

    async deleteByRoomAndUser(roomId: string, userId: string): Promise<void> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query(DELETE_ROOM_MEMBER_BY_ROOM_AND_USER, [roomId, userId]);
            if (result.rowCount === 0) {
                throw new Error(`Room member not found for room ${roomId} and user ${userId}`);
            }
            logger.info(`Room member removed from room ${roomId} for user ${userId}`);
        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            logger.error(`Failed to delete room member for room ${roomId} and user ${userId}:`, error);
            throw new Error(`Failed to delete room member for room ${roomId} and user ${userId}`);
        }
    }

    async getMembershipsByUserId(userId: string): Promise<RoomMember[]> {
        try {
            const pool = await ConnectionManager.getConnection();
            const result = await pool.query("SELECT * FROM room_members WHERE user_id = $1", [userId]);
            if (result.rows.length === 0) {
                return [];
            }
            const mapper = new RoomMemberMapper();
            return result.rows.map((member: PostgresRoomMember) => mapper.map(member));
        } catch (error) {
            logger.error(`Failed to get memberships for user ${userId}:`, error);
            throw new Error(`Failed to get memberships for user ${userId}`);
        }
    }
}

export async function createRoomMemberRepository(): Promise<RoomMemberRepository> {
    const userRepository = new RoomMemberRepository();
    return userRepository;
}