export class VideoSession {
    private id: string;
    private roomId: string;
    private sessionName: string;
    private startedBy: string;
    private startedAt: Date;
    private endedAt?: Date;
    private isActive: boolean;
    private maxParticipants: number;

    constructor(
        id: string,
        roomId: string,
        sessionName: string,
        startedBy: string,
        startedAt?: Date,
        endedAt?: Date,
        isActive: boolean = true,
        maxParticipants: number = 20
    ) {
        this.id = id;
        this.roomId = roomId;
        this.sessionName = sessionName;
        this.startedBy = startedBy;
        this.startedAt = startedAt || new Date();
        this.endedAt = endedAt;
        this.isActive = isActive;
        this.maxParticipants = maxParticipants;
    }

    // Getters
    getId(): string {
        return this.id;
    }

    getRoomId(): string {
        return this.roomId;
    }

    getSessionName(): string {
        return this.sessionName;
    }

    getStartedBy(): string {
        return this.startedBy;
    }

    getStartedAt(): Date {
        return this.startedAt;
    }

    getEndedAt(): Date | undefined {
        return this.endedAt;
    }

    getIsActive(): boolean {
        return this.isActive;
    }

    getMaxParticipants(): number {
        return this.maxParticipants;
    }

    // Setters
    setSessionName(sessionName: string): void {
        this.sessionName = sessionName;
    }

    setEndedAt(endedAt: Date): void {
        this.endedAt = endedAt;
        this.isActive = false;
    }

    setIsActive(isActive: boolean): void {
        this.isActive = isActive;
        if (!isActive && !this.endedAt) {
            this.endedAt = new Date();
        }
    }

    setMaxParticipants(maxParticipants: number): void {
        this.maxParticipants = maxParticipants;
    }

    // Business logic methods
    isOngoing(): boolean {
        return this.isActive && !this.endedAt;
    }

    hasEnded(): boolean {
        return !this.isActive || !!this.endedAt;
    }

    getDuration(): number | null {
        if (!this.endedAt) {
            return null;
        }
        return this.endedAt.getTime() - this.startedAt.getTime();
    }

    canJoin(): boolean {
        return this.isActive && !this.endedAt;
    }

    // Note: Participant count will be managed through Socket.io connections
    // This method can be used to check against maxParticipants
    canAcceptMoreParticipants(currentParticipantCount: number): boolean {
        return this.canJoin() && currentParticipantCount < this.maxParticipants;
    }
} 