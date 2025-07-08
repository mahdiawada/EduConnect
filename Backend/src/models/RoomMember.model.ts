export class RoomMember {
    private id: string;
    private roomId: string;
    private userId: string;
    private role: 'instructor' | 'student' | 'moderator';
    private joinedAt: Date;
    private isActive: boolean;

    constructor(
        id: string,
        roomId: string,
        userId: string,
        role: 'instructor' | 'student' | 'moderator' = 'student',
        joinedAt?: Date,
        isActive: boolean = true
    ) {
        this.id = id;
        this.roomId = roomId;
        this.userId = userId;
        this.role = role;
        this.joinedAt = joinedAt || new Date();
        this.isActive = isActive;
    }

    // Getters
    getId(): string {
        return this.id;
    }

    getRoomId(): string {
        return this.roomId;
    }

    getUserId(): string {
        return this.userId;
    }

    getRole(): 'instructor' | 'student' | 'moderator' {
        return this.role;
    }

    getJoinedAt(): Date {
        return this.joinedAt;
    }

    getIsActive(): boolean {
        return this.isActive;
    }

    // Setters
    setRole(role: 'instructor' | 'student' | 'moderator'): void {
        this.role = role;
    }

    setIsActive(isActive: boolean): void {
        this.isActive = isActive;
    }

    // Business logic methods
    isInstructor(): boolean {
        return this.role === 'instructor';
    }

    isStudent(): boolean {
        return this.role === 'student';
    }

    isModerator(): boolean {
        return this.role === 'moderator';
    }

    canModerate(): boolean {
        return this.isInstructor() || this.isModerator();
    }

    canInviteUsers(): boolean {
        return this.isInstructor();
    }
} 