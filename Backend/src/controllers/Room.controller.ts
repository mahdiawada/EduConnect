import { Request, Response } from 'express';
import { RoomService } from '../services/Room.service';
import { BadRequestException } from '../utils/exceptions/http/BadRequestException';
import config from '../config';

export class RoomController {
    private roomService: RoomService;

    constructor(roomService: RoomService) {
        this.roomService = roomService;
    }

    public async createRoom(req: Request, res: Response) {
        const { name, description } = req.body;
        const instructorId = (req as any).userId; 
        
        if (!instructorId) {
            throw new BadRequestException('User authentication required');
        }
        
        const roomId = await this.roomService.createRoom(name, instructorId, description);
        res.status(201).json({ id: roomId });
    }

    public async getRoomById(req: Request, res: Response) {
        const id = req.params.id;

        if(!id){
            throw new BadRequestException('Room ID is required in the path');
        }
                
        const room = await this.roomService.getRoomById(id);
        res.status(200).json(room);
    }


    public async getAllRooms (req: Request, res: Response): Promise<void> {
        const rooms = await this.roomService.getAllRooms();
        res.status(200).json(rooms);
    };
    
    public async getUserRooms (req: Request, res: Response): Promise<void> {
        const userId = (req as any).userId;
        
        if (!userId) {
            throw new BadRequestException('User ID not found in request');
        }
        
        const rooms = await this.roomService.getRoomsByInstructorId(userId);
        res.status(200).json(rooms);
    };

    public async getJoinedRooms(req: Request, res: Response): Promise<void> {
        const userId = (req as any).userId;
        if (!userId) {
            throw new BadRequestException('User ID not found in request');
        }
        const rooms = await this.roomService.getJoinedRooms(userId);
        res.status(200).json(rooms);
    }

    public async updateRoom (req: Request, res: Response): Promise<void> {
        const id = req.params.id;
        const { name, description } = req.body;
        const userId = (req as any).userId; // Get from authenticated user

        if(!id){
            throw new BadRequestException('Room ID is required in the path');
        }

        if(!userId){
            throw new BadRequestException('User authentication required');
        }

        if(!name && !description){
            throw new BadRequestException('At least one field (name or description) is required to update', 
                {
                    name: !name,
                    description: !description,
                });
        }

        await this.roomService.updateRoom(id, { name, description }, userId);
        res.status(200).json({ message: 'Room updated successfully' });
    };

    public async deleteRoom (req: Request, res: Response): Promise<void> {
        const id = req.params.id;
        const userId = (req as any).userId; // Get from authenticated user

        if(!id){
            throw new BadRequestException('Room ID is required in the path');
        }

        if(!userId){
            throw new BadRequestException('User authentication required');
        }
        
        await this.roomService.deleteRoom(id, userId);
        res.status(200).json({ message: 'Room deleted successfully' });
    };

    public async joinRoom(req: Request, res: Response): Promise<void> {
        const { inviteCode } = req.body;
        const userId = (req as any).userId;

        if (!inviteCode) {
            throw new BadRequestException('Invite code is required');
        }

        if (!userId) {
            throw new BadRequestException('User authentication required');
        }

        const room = await this.roomService.joinRoom(inviteCode, userId);
        res.status(200).json(room);
    }

    public async getRoomMembers(req: Request, res: Response): Promise<void> {
        const roomId = req.params.roomId;
        
        if (!roomId) {
            throw new BadRequestException('Room ID is required in the path');
        }
        
        const members = await this.roomService.getRoomMembers(roomId);
        res.status(200).json(members);
    }

    public async removeMember(req: Request, res: Response): Promise<void> {
        const roomId = req.params.roomId;
        const memberIdToRemove = req.params.memberId;
        const requesterId = (req as any).userId;

        if (!roomId) {
            throw new BadRequestException('Room ID is required in the path');
        }

        if (!memberIdToRemove) {
            throw new BadRequestException('Member ID is required in the path');
        }

        if (!requesterId) {
            throw new BadRequestException('User authentication required');
        }

        await this.roomService.removeMember(roomId, memberIdToRemove, requesterId);
        res.status(200).json({ message: 'Member removed successfully' });
    }

    public async emailInvite (req: Request, res: Response) {
        const { to } = req.body;
        const { roomId } = req.params;
        const userId = (req as any).userId; // From auth middleware

        try {
            // Get room details to fetch the invite code
            const room = await this.roomService.getRoomById(roomId);
            if (!room) {
                return res.status(404).json({ message: 'Room not found' });
            }
            
            if (room.getInstructorId() !== userId) {
                return res.status(403).json({ message: 'Only room instructors can send invitations' });
            }

            // Send email with room invite code
            await this.roomService.nodeMailerTransporter().sendMail({
                from: config.nodemailer.gmail_account,
                to: to,
                subject: `Invitation to join "${room.getName()}" room`,
                text: `You have been invited to join the room "${room.getName()}".
                
Room Details:
- Room Name: ${room.getName()}
- Description: ${room.getDescription() || 'No description provided'}
- Room Code: ${room.getInviteCode()}

To join the room, please use the room code: ${room.getInviteCode()}

Best regards,
Mentor Platform Team`,
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">You're Invited to Join a Room!</h2>
                    <p>You have been invited to join the room <strong>"${room.getName()}"</strong>.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #555;">Room Details:</h3>
                        <p><strong>Room Name:</strong> ${room.getName()}</p>
                        <p><strong>Description:</strong> ${room.getDescription() || 'No description provided'}</p>
                        <p><strong>Room Code:</strong> <span style="font-size: 18px; font-weight: bold; color: #007bff;">${room.getInviteCode()}</span></p>
                    </div>
                    
                    <p>To join the room, please use the room code above on our platform.</p>
                    
                    <p style="color: #666; font-size: 14px;">Best regards,<br>Mentor Platform Team</p>
                </div>
                `
            });

            res.status(200).json({ message: 'Invitation sent successfully' });
        } catch (error) {
            console.error('Error sending email invitation:', error);
            res.status(500).json({ message: 'Failed to send invitation email' });
        }
    }

    public async checkUserRole(req: Request, res: Response): Promise<void> {
        const roomId = req.params.roomId;
        const userId = (req as any).userId;

        if (!roomId) {
            throw new BadRequestException('Room ID is required in the path');
        }

        if (!userId) {
            throw new BadRequestException('User authentication required');
        }

        try {
            const isInstructor = await this.roomService.isUserInstructorInRoom(userId, roomId);
            res.status(200).json({ 
                isInstructor,
                role: isInstructor ? 'instructor' : 'student'
            });
        } catch (error) {
            res.status(404).json({ 
                isInstructor: false,
                role: 'student',
                message: 'User is not a member of this room'
            });
        }
    }

} 