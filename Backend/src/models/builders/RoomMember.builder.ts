import { RoomMember } from "../RoomMember.model";
import logger from "../../utils/logger";

export class RoomMemberBuilder {
    private id!: string;
    private roomId!: string;
    private userId!: string;
    private role: 'instructor' | 'student' | 'moderator' = 'student';
    private joinedAt?: Date;
    private isActive: boolean = true;

    setId(id: string): RoomMemberBuilder {
        this.id = id;
        return this;
    }

    setRoomId(roomId: string): RoomMemberBuilder {
        this.roomId = roomId;
        return this;
    }

    setUserId(userId: string): RoomMemberBuilder {
        this.userId = userId;
        return this;
    }

    setRole(role: 'instructor' | 'student' | 'moderator'): RoomMemberBuilder {
        this.role = role;
        return this;
    }

    setJoinedAt(joinedAt: Date): RoomMemberBuilder {
        this.joinedAt = joinedAt;
        return this;
    }

    setIsActive(isActive: boolean): RoomMemberBuilder {
        this.isActive = isActive;
        return this;
    }

    build(): RoomMember {
        const requiredProps = [
            this.id,
            this.roomId,
            this.userId
        ];

        for (const property of requiredProps) {
            if (property === null || property === undefined) {
                logger.error("Missing required properties, could not build a RoomMember");
                throw Error("Missing Required Properties");
            }
        }

        return new RoomMember(
            this.id,
            this.roomId,
            this.userId,
            this.role,
            this.joinedAt,
            this.isActive
        );
    }
} 