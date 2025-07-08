import { Invitation } from "../Invitation.model";
import logger from "../../utils/logger";

export class InvitationBuilder {
    private id!: string;
    private roomId!: string;
    private invitedBy!: string;
    private invitedEmail!: string;
    private invitedUserId?: string;
    private status: 'pending' | 'accepted' | 'declined' | 'expired' = 'pending';
    private expiresAt!: Date;
    private createdAt?: Date;

    setId(id: string): InvitationBuilder {
        this.id = id;
        return this;
    }

    setRoomId(roomId: string): InvitationBuilder {
        this.roomId = roomId;
        return this;
    }

    setInvitedBy(invitedBy: string): InvitationBuilder {
        this.invitedBy = invitedBy;
        return this;
    }

    setInvitedEmail(invitedEmail: string): InvitationBuilder {
        this.invitedEmail = invitedEmail;
        return this;
    }

    setInvitedUserId(invitedUserId: string): InvitationBuilder {
        this.invitedUserId = invitedUserId;
        return this;
    }

    setStatus(status: 'pending' | 'accepted' | 'declined' | 'expired'): InvitationBuilder {
        this.status = status;
        return this;
    }

    setExpiresAt(expiresAt: Date): InvitationBuilder {
        this.expiresAt = expiresAt;
        return this;
    }

    setCreatedAt(createdAt: Date): InvitationBuilder {
        this.createdAt = createdAt;
        return this;
    }

    build(): Invitation {
        const requiredProps = [
            this.id,
            this.roomId,
            this.invitedBy,
            this.invitedEmail,
            this.expiresAt
        ];

        for (const property of requiredProps) {
            if (property === null || property === undefined) {
                logger.error("Missing required properties, could not build an Invitation");
                throw Error("Missing Required Properties");
            }
        }

        return new Invitation(
            this.id,
            this.roomId,
            this.invitedBy,
            this.invitedEmail,
            this.expiresAt,
            this.invitedUserId,
            this.status,
            this.createdAt
        );
    }
} 