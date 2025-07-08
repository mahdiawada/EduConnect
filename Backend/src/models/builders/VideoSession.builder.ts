import { VideoSession } from "../VideoSession.model";
import logger from "../../utils/logger";

export class VideoSessionBuilder {
    private id!: string;
    private roomId!: string;
    private sessionName!: string;
    private startedBy!: string;
    private startedAt?: Date;
    private endedAt?: Date;
    private isActive: boolean = true;
    private maxParticipants: number = 20;

    setId(id: string): VideoSessionBuilder {
        this.id = id;
        return this;
    }

    setRoomId(roomId: string): VideoSessionBuilder {
        this.roomId = roomId;
        return this;
    }

    setSessionName(sessionName: string): VideoSessionBuilder {
        this.sessionName = sessionName;
        return this;
    }

    setStartedBy(startedBy: string): VideoSessionBuilder {
        this.startedBy = startedBy;
        return this;
    }

    setStartedAt(startedAt: Date): VideoSessionBuilder {
        this.startedAt = startedAt;
        return this;
    }

    setEndedAt(endedAt: Date): VideoSessionBuilder {
        this.endedAt = endedAt;
        return this;
    }

    setIsActive(isActive: boolean): VideoSessionBuilder {
        this.isActive = isActive;
        return this;
    }

    setMaxParticipants(maxParticipants: number): VideoSessionBuilder {
        this.maxParticipants = maxParticipants;
        return this;
    }

    build(): VideoSession {
        const requiredProps = [
            this.id,
            this.roomId,
            this.sessionName,
            this.startedBy
        ];

        for (const property of requiredProps) {
            if (property === null || property === undefined) {
                logger.error("Missing required properties, could not build a VideoSession");
                throw Error("Missing Required Properties");
            }
        }

        return new VideoSession(
            this.id,
            this.roomId,
            this.sessionName,
            this.startedBy,
            this.startedAt,
            this.endedAt,
            this.isActive,
            this.maxParticipants
        );
    }
} 