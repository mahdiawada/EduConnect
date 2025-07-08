import { Room } from "../models/Room.model";
import { RoomMember } from "../models/RoomMember.model";
import { RoomRepository } from "../repositories/PostgreSQL/Room.repository";
import { RoomMemberRepository } from "../repositories/PostgreSQL/RoomMember.repository";
import { RoomMapper } from "../mappers/Room.mapper";
import { v4 as uuidv4 } from 'uuid';

export class RoomService {
    private roomRepo: RoomRepository;
    private roomMemberRepo: RoomMemberRepository;

    constructor() {
        this.roomRepo = new RoomRepository();
        this.roomMemberRepo = new RoomMemberRepository();
    }

    // Create a new room
    public async createRoom(name: string, instructorId: string, description?: string, isPublic: boolean = false, maxParticipants: number = 50): Promise<Room> {
        this.validateRoomData(name, instructorId, maxParticipants);
        
        const roomId = uuidv4();
        const inviteCode = this.generateInviteCode();
        const room = new Room(roomId, name, instructorId, inviteCode, description, isPublic, maxParticipants);
        
        await this.roomRepo.create(room);
        
        // Add instructor as room member
        await this.addRoomMember(roomId, instructorId, 'instructor');
        
        return room;
    }

    // Get a specific room
    public async getRoom(roomId: string): Promise<Room> {
        try {
            return await this.roomRepo.get(roomId);
        } catch (error) {
            throw new Error(`Failed to get room ${roomId}: ${error}`);
        }
    }

    // Get all rooms for a user (as instructor or member)
    public async getRoomsByUser(userId: string): Promise<Room[]> {
        try {
            const memberRooms = await this.roomMemberRepo.getRoomsByUserId(userId);
            // Convert raw database rows to Room objects
            const mapper = new RoomMapper();
            return memberRooms.map((roomData: any) => mapper.map(roomData));
        } catch (error) {
            throw new Error(`Failed to get rooms for user ${userId}: ${error}`);
        }
    }

    // Get all public rooms
    public async getPublicRooms(): Promise<Room[]> {
        try {
            return await this.roomRepo.getPublicRooms();
        } catch (error) {
            throw new Error(`Failed to get public rooms: ${error}`);
        }
    }

    // Join a room by invite code
    public async joinRoomByInvite(inviteCode: string, userId: string, role: 'student' | 'instructor' = 'student'): Promise<Room> {
        try {
            const room = await this.roomRepo.getByInviteCode(inviteCode);
            
            if (!room.canJoin()) {
                throw new Error("This room is not active");
            }
            
            // Check if user is already a member
            const existingMember = await this.roomMemberRepo.getByRoomAndUser(room.getId(), userId);
            if (existingMember) {
                throw new Error("You are already a member of this room");
            }
            
            // Check if room is full
            const memberCount = await this.roomMemberRepo.getMemberCount(room.getId());
            if (room.isFull(memberCount)) {
                throw new Error("This room is full");
            }
            
            await this.addRoomMember(room.getId(), userId, role);
            return room;
        } catch (error) {
            throw new Error(`Failed to join room: ${error}`);
        }
    }

    // Join a public room
    public async joinPublicRoom(roomId: string, userId: string, role: 'student' | 'instructor' = 'student'): Promise<void> {
        try {
            const room = await this.getRoom(roomId);
            
            if (!room.canBeJoinedPublicly()) {
                throw new Error("This room is not public or not active");
            }
            
            // Check if user is already a member
            const existingMember = await this.roomMemberRepo.getByRoomAndUser(roomId, userId);
            if (existingMember) {
                throw new Error("You are already a member of this room");
            }
            
            // Check if room is full
            const memberCount = await this.roomMemberRepo.getMemberCount(roomId);
            if (room.isFull(memberCount)) {
                throw new Error("This room is full");
            }
            
            await this.addRoomMember(roomId, userId, role);
        } catch (error) {
            throw new Error(`Failed to join public room: ${error}`);
        }
    }

    // Add a member to a room
    private async addRoomMember(roomId: string, userId: string, role: 'student' | 'instructor'): Promise<void> {
        const memberId = uuidv4();
        const member = new RoomMember(memberId, roomId, userId, role);
        await this.roomMemberRepo.create(member);
    }

    // Get room members
    public async getRoomMembers(roomId: string): Promise<RoomMember[]> {
        try {
            return await this.roomMemberRepo.getByRoomId(roomId);
        } catch (error) {
            throw new Error(`Failed to get room members for room ${roomId}: ${error}`);
        }
    }

    // Remove a member from a room
    public async removeRoomMember(roomId: string, userId: string, removedBy: string): Promise<void> {
        try {
            const room = await this.getRoom(roomId);
            const remover = await this.roomMemberRepo.getByRoomAndUser(roomId, removedBy);
            
            // Only instructor or the user themselves can remove
            if (remover?.getRole() !== 'instructor' && removedBy !== userId) {
                throw new Error("You don't have permission to remove this member");
            }
            
            // Instructor cannot remove themselves if they're the only instructor
            if (remover?.getRole() === 'instructor' && removedBy === userId) {
                const instructors = await this.roomMemberRepo.getByRoomIdAndRole(roomId, 'instructor');
                if (instructors.length <= 1) {
                    throw new Error("Cannot remove the only instructor from the room");
                }
            }
            
            await this.roomMemberRepo.deleteByRoomAndUser(roomId, userId);
        } catch (error) {
            throw new Error(`Failed to remove room member: ${error}`);
        }
    }

    // Update room information
    public async updateRoom(roomId: string, updates: { name?: string; description?: string; isPublic?: boolean; maxParticipants?: number }, userId: string): Promise<void> {
        try {
            const room = await this.getRoom(roomId);
            const member = await this.roomMemberRepo.getByRoomAndUser(roomId, userId);
            
            // Only instructor can update room
            if (member?.getRole() !== 'instructor') {
                throw new Error("Only instructors can update room information");
            }
            
            if (updates.name) {
                this.validateRoomName(updates.name);
                room.setName(updates.name);
            }
            
            if (updates.description !== undefined) {
                room.setDescription(updates.description);
            }
            
            if (updates.isPublic !== undefined) {
                room.setIsPublic(updates.isPublic);
            }
            
            if (updates.maxParticipants) {
                this.validateMaxParticipants(updates.maxParticipants);
                room.setMaxParticipants(updates.maxParticipants);
            }
            
            await this.roomRepo.update(room);
        } catch (error) {
            throw new Error(`Failed to update room: ${error}`);
        }
    }
    
    // Generate invite code
    private generateInviteCode(): string {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // Validation methods
    private validateRoomData(name: string, instructorId: string, maxParticipants: number): void {
        if (!name || name.trim() === "") {
            throw new Error("Room name is required");
        }
        
        if (name.length > 100) {
            throw new Error("Room name must be less than 100 characters");
        }
        
        if (!instructorId || instructorId.trim() === "") {
            throw new Error("Instructor ID is required");
        }
        
        if (maxParticipants < 1 || maxParticipants > 1000) {
            throw new Error("Max participants must be between 1 and 1000");
        }
    }

    private validateRoomName(name: string): void {
        if (!name || name.trim() === "") {
            throw new Error("Room name is required");
        }
        
        if (name.length > 100) {
            throw new Error("Room name must be less than 100 characters");
        }
    }

    private validateMaxParticipants(maxParticipants: number): void {
        if (maxParticipants < 1 || maxParticipants > 1000) {
            throw new Error("Max participants must be between 1 and 1000");
        }
    }
} 