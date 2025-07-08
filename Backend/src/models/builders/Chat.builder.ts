import { Chat } from "../Chat.model";
import logger from "../../utils/logger";

export class ChatBuilder {
    private id!: string;
    private name!: string;
    private roomId!: string;
    private createdBy!: string;
    private isPrivate: boolean = false;
    private createdAt?: Date;
    private updatedAt?: Date;

    setId(id: string): ChatBuilder {
        this.id = id;
        return this;
    }

    setName(name: string): ChatBuilder {
        this.name = name;
        return this;
    }

    setRoomId(roomId: string): ChatBuilder {
        this.roomId = roomId;
        return this;
    }

    setCreatedBy(createdBy: string): ChatBuilder {
        this.createdBy = createdBy;
        return this;
    }

    setIsPrivate(isPrivate: boolean): ChatBuilder {
        this.isPrivate = isPrivate;
        return this;
    }

    setCreatedAt(createdAt: Date): ChatBuilder {
        this.createdAt = createdAt;
        return this;
    }

    setUpdatedAt(updatedAt: Date): ChatBuilder {
        this.updatedAt = updatedAt;
        return this;
    }

    build(): Chat {
        const requiredProps = [
            this.id,
            this.name,
            this.roomId,
            this.createdBy
        ];

        for (const property of requiredProps) {
            if (property === null || property === undefined) {
                logger.error("Missing required properties, could not build a Chat");
                throw Error("Missing Required Properties");
            }
        }

        return new Chat(
            this.id,
            this.name,
            this.roomId,
            this.createdBy,
            this.isPrivate,
            this.createdAt,
            this.updatedAt
        );
    }
}