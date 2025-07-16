import { Room } from "../Room.model";
import logger from "../../utils/logger";

export class RoomBuilder {
    private id!: string;
    private name!: string;
    private instructorId!: string;
    private inviteCode!: string;
    private description?: string;
    private isActive: boolean = true;
    private createdAt?: Date;
    private updatedAt?: Date;

    setId(id: string): RoomBuilder {
        this.id = id;
        return this;
    }

    setName(name: string): RoomBuilder {
        this.name = name;
        return this;
    }

    setInstructorId(instructorId: string): RoomBuilder {
        this.instructorId = instructorId;
        return this;
    }

    setInviteCode(inviteCode: string): RoomBuilder {
        this.inviteCode = inviteCode;
        return this;
    }

    setDescription(description: string): RoomBuilder {
        this.description = description;
        return this;
    }

    setIsActive(isActive: boolean): RoomBuilder {
        this.isActive = isActive;
        return this;
    }

    setCreatedAt(createdAt: Date): RoomBuilder {
        this.createdAt = createdAt;
        return this;
    }

    setUpdatedAt(updatedAt: Date): RoomBuilder {
        this.updatedAt = updatedAt;
        return this;
    }

    // For backward compatibility
    setOwnerId(ownerId: string): RoomBuilder {
        this.instructorId = ownerId;
        return this;
    }

    build(): Room {
        const requiredProps = [
            this.id,
            this.name,
            this.instructorId,
            this.inviteCode
        ];

        for (const property of requiredProps) {
            if (property === null || property === undefined) {
                logger.error("Missing required properties, could not build a Room");
                throw Error("Missing Required Properties");
            }
        }

        return new Room(
            this.id,
            this.name,
            this.instructorId,
            this.inviteCode,
            this.description,
            this.isActive,
            this.createdAt,
            this.updatedAt
        );
    }
}