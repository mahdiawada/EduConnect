import { Room } from "../models/Room.model";
import { RoomMember } from "../models/RoomMember.model";
import { createRoomRepository, RoomRepository } from "../repositories/PostgreSQL/Room.repository";
import { createRoomMemberRepository, RoomMemberRepository } from "../repositories/PostgreSQL/RoomMember.repository";
import { createUserRepository, UserRepository } from "../repositories/PostgreSQL/User.repository";
import { generateUUID } from "../utils";
import { id } from "../repositories/IRepository";
import nodemailer from 'nodemailer';
import config from "../config";

export class RoomService {
    private roomRepo: RoomRepository;
    private roomMemberRepo: RoomMemberRepository;
    private userRepo: UserRepository;

    constructor(roomRepo : RoomRepository, roomMemberRepo : RoomMemberRepository, userRepo?: UserRepository) {
        this.roomRepo = roomRepo;
        this.roomMemberRepo = roomMemberRepo;
        this.userRepo = userRepo!;
    }

    // Create a new room
    public async createRoom(name: string, instructorId: string, description?: string): Promise<id> {
        this.validateRoomData(name, instructorId);
        const roomId = generateUUID("room");
        const inviteCode = this.generateInviteCode();
        const room = new Room(roomId, name, instructorId, inviteCode, description);
            
        // Add instructor as room member
        await this.addRoomMember(roomId, instructorId, 'instructor');
        
        return (await this.getRoomRepo()).create(room);
    }

    

    // Get a specific room
    public async getRoomById(roomId: string): Promise<Room> {
        return (await this.getRoomRepo()).get(roomId);
    }

    public async getAllRooms(): Promise<Room[]> {
        return (await this.getRoomRepo()).getAll();
    }

    // Get rooms created by a specific instructor
    public async getRoomsByInstructorId(instructorId: string): Promise<Room[]> {
        if (!instructorId || instructorId.trim() === "") {
            throw new Error("Instructor ID is required");
        }
        return (await this.getRoomRepo()).getRoomsByInstructorId(instructorId);
    }

    public async getJoinedRooms(userId: string): Promise<Room[]> {
        const memberships = await (await this.getRoomMemberRepo()).getMembershipsByUserId(userId);
        const studentMemberships = memberships.filter(m => m.getRole() === 'student' || m.getRole() === 'moderator');

        if (studentMemberships.length === 0) {
            return [];
        }

        const roomPromises = studentMemberships.map(membership => {
            return this.getRoomById(membership.getRoomId());
        });

        return Promise.all(roomPromises);
    }


    // Update room information
    public async updateRoom(roomId: string, updates: { name?: string; description?: string; }, userId: string): Promise<void> {
        try {
            const room = await this.getRoomById(roomId);
            const member = await (await this.getRoomMemberRepo()).getByRoomAndUser(roomId, userId);
            
            // Only instructor can update room
            if (member?.getRole() !== 'instructor') {
                throw new Error("Only instructors can update room information");
            }
            
            if (updates.name) {
                room.setName(updates.name);
            }
            
            if (updates.description !== undefined) {
                room.setDescription(updates.description);
            }
            
            await (await this.getRoomRepo()).update(room);
        } catch (error) {
            throw new Error(`Failed to update room: ${error}`);
        }
    }

    // Delete a room
    public async deleteRoom(roomId: string, userId: string): Promise<void> {
        try {
            const member = await (await this.getRoomMemberRepo()).getByRoomAndUser(roomId, userId);

            // Only instructor can delete room
            if (member?.getRole() !== 'instructor') {
                throw new Error("Only instructors can delete a room");
            }

            await (await this.getRoomRepo()).delete(roomId);
        } catch (error) {
            throw new Error(`Failed to delete room: ${error}`);
        }
    }

    // Join a room with invite code
    public async joinRoom(inviteCode: string, userId: string): Promise<Room> {
        const room = await (await this.getRoomRepo()).getByInviteCode(inviteCode);

        if (!room) {
            throw new Error("Invalid invite code");
        }

        const isMember = await (await this.getRoomMemberRepo()).getByRoomAndUser(room.getId(), userId);

        if (isMember) {
            throw new Error("User is already a member of this room");
        }

        await this.addRoomMember(room.getId(), userId, 'student');

        return room;
    }

    // Remove a member from the room
    public async removeMember(roomId: string, memberIdToRemove: string, requesterId: string): Promise<void> {
        try {
            // Check if requester is an instructor in the room
            const requesterMember = await (await this.getRoomMemberRepo()).getByRoomAndUser(roomId, requesterId);
            if (!requesterMember || requesterMember.getRole() !== 'instructor') {
                throw new Error("Only instructors can remove members from the room");
            }

            // Get the member to be removed
            const memberToRemove = await (await this.getRoomMemberRepo()).get(memberIdToRemove);
            if (!memberToRemove || memberToRemove.getRoomId() !== roomId) {
                throw new Error("Member not found in this room");
            }

            // Prevent removing instructors
            if (memberToRemove.getRole() === 'instructor') {
                throw new Error("Cannot remove instructors from the room");
            }

            // Remove the member
            await (await this.getRoomMemberRepo()).delete(memberIdToRemove);
        } catch (error) {
            throw new Error(`Failed to remove member: ${error}`);
        }
    }

    // Get room members with user details
    public async getRoomMembers(roomId: string): Promise<any[]> {
        try {
            // Get all room members
            const roomMembers = await (await this.getRoomMemberRepo()).getByRoomId(roomId);
            
            // Get user details for each member
            const membersWithDetails = await Promise.all(
                roomMembers.map(async (member) => {
                    const user = await (await this.getUserRepo()).get(member.getUserId());
                    return {
                        id: member.getId(),
                        userId: member.getUserId(),
                        roomId: member.getRoomId(),
                        role: member.getRole(),
                        joinedAt: member.getJoinedAt(),
                        isActive: member.getIsActive(),
                        fullName: user.getFullName(),
                        email: user.getEmail(),
                        username: user.getUsername(),
                        avatarUrl: user.getAvatarUrl()
                    };
                })
            );

            return membersWithDetails;
        } catch (error) {
            throw new Error(`Failed to get room members for room ${roomId}: ${error}`);
        }
    }

    public nodeMailerTransporter() {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: config.nodemailer.gmail_account,
                pass: config.nodemailer.gmail_app_pass
            }
        });
        return transporter;
    }

    private async addRoomMember(roomId: string, userId: string, role: 'instructor' | 'student' | 'moderator'){
        const memberId = generateUUID("member");
        const newMember = new RoomMember(memberId, roomId, userId, role);
        await (await this.getRoomMemberRepo()).create(newMember);
    }

    // Generate invite code
    private generateInviteCode(): string {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // Validation methods
    private validateRoomData(name: string, instructorId: string): void {
        if (!name || name.trim() === "") {
            throw new Error("Room name is required");
        }
        
        if (name.length > 100) {
            throw new Error("Room name must be less than 100 characters");
        }
        
        if (!instructorId || instructorId.trim() === "") {
            throw new Error("Instructor ID is required");
        }
    }

    private async getRoomRepo() {
            if (!this.roomRepo) {
                this.roomRepo = await createRoomRepository();
            }
            return this.roomRepo;
        }
    
    private async getRoomMemberRepo() {
        if (!this.roomMemberRepo) {
                this.roomMemberRepo = await createRoomMemberRepository();
            }
            return this.roomMemberRepo;
    }

    private async getUserRepo() {
        if (!this.userRepo) {
            this.userRepo = await createUserRepository();
        }
        return this.userRepo;
    }

    public async isUserMemberOfRoom(userId: string, roomId: string): Promise<boolean> {
        try {
            const members = await this.roomMemberRepo.getByRoomId(roomId);
            return members.some((member: any) => member.getUserId() === userId);
        } catch (error) {
            console.error('Error checking room membership:', error);
            return false;
        }
    }

} 