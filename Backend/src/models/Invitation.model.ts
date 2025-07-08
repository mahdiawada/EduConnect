export class Invitation {
    private id: string;
    private roomId: string;
    private invitedBy: string;
    private invitedEmail: string;
    private invitedUserId?: string;
    private status: 'pending' | 'accepted' | 'declined' | 'expired';
    private expiresAt: Date;
    private createdAt: Date;

    constructor(
        id: string,
        roomId: string,
        invitedBy: string,
        invitedEmail: string,
        expiresAt: Date,
        invitedUserId?: string,
        status: 'pending' | 'accepted' | 'declined' | 'expired' = 'pending',
        createdAt?: Date
    ) {
        this.id = id;
        this.roomId = roomId;
        this.invitedBy = invitedBy;
        this.invitedEmail = invitedEmail;
        this.invitedUserId = invitedUserId;
        this.status = status;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt || new Date();
    }

    // Getters
    getId(): string {
        return this.id;
    }

    getRoomId(): string {
        return this.roomId;
    }

    getInvitedBy(): string {
        return this.invitedBy;
    }

    getInvitedEmail(): string {
        return this.invitedEmail;
    }

    getInvitedUserId(): string | undefined {
        return this.invitedUserId;
    }

    getStatus(): 'pending' | 'accepted' | 'declined' | 'expired' {
        return this.status;
    }

    getExpiresAt(): Date {
        return this.expiresAt;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    // Setters
    setInvitedUserId(invitedUserId: string): void {
        this.invitedUserId = invitedUserId;
    }

    setStatus(status: 'pending' | 'accepted' | 'declined' | 'expired'): void {
        this.status = status;
    }

    setExpiresAt(expiresAt: Date): void {
        this.expiresAt = expiresAt;
    }

    // Business logic methods
    isPending(): boolean {
        return this.status === 'pending';
    }

    isAccepted(): boolean {
        return this.status === 'accepted';
    }

    isDeclined(): boolean {
        return this.status === 'declined';
    }

    isExpired(): boolean {
        return this.status === 'expired' || new Date() > this.expiresAt;
    }

    canBeAccepted(): boolean {
        return this.isPending() && !this.isExpired();
    }

    canBeDeclined(): boolean {
        return this.isPending() && !this.isExpired();
    }

    getDaysUntilExpiry(): number {
        const now = new Date();
        const diffTime = this.expiresAt.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    isExpiringSoon(): boolean {
        return this.getDaysUntilExpiry() <= 1;
    }
} 