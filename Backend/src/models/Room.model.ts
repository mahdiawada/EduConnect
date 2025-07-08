export class Room {
    private id: string;
    private name: string;
    private description?: string;
    private instructorId: string;
    private inviteCode: string;
    private isPublic: boolean;
    private maxParticipants: number;
    private isActive: boolean;
    private createdAt: Date;
    private updatedAt: Date;

    constructor(
        id: string,
        name: string,
        instructorId: string,
        inviteCode: string,
        description?: string,
        isPublic: boolean = false,
        maxParticipants: number = 50,
        isActive: boolean = true,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.instructorId = instructorId;
        this.inviteCode = inviteCode;
        this.isPublic = isPublic;
        this.maxParticipants = maxParticipants;
        this.isActive = isActive;
        this.createdAt = createdAt || new Date();
        this.updatedAt = updatedAt || new Date();
    }

    // Getters
    getId(): string {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getDescription(): string | undefined {
        return this.description;
    }

    getInstructorId(): string {
        return this.instructorId;
    }

    getInviteCode(): string {
        return this.inviteCode;
    }

    getIsPublic(): boolean {
        return this.isPublic;
    }

    getMaxParticipants(): number {
        return this.maxParticipants;
    }

    getIsActive(): boolean {
        return this.isActive;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    getUpdatedAt(): Date {
        return this.updatedAt;
    }

    // Setters
    setName(name: string): void {
        this.name = name;
        this.updatedAt = new Date();
    }

    setDescription(description: string): void {
        this.description = description;
        this.updatedAt = new Date();
    }

    setInstructorId(instructorId: string): void {
        this.instructorId = instructorId;
        this.updatedAt = new Date();
    }

    setInviteCode(inviteCode: string): void {
        this.inviteCode = inviteCode;
        this.updatedAt = new Date();
    }

    setIsPublic(isPublic: boolean): void {
        this.isPublic = isPublic;
        this.updatedAt = new Date();
    }

    setMaxParticipants(maxParticipants: number): void {
        this.maxParticipants = maxParticipants;
        this.updatedAt = new Date();
    }

    setIsActive(isActive: boolean): void {
        this.isActive = isActive;
        this.updatedAt = new Date();
    }

    // Business logic methods
    canJoin(): boolean {
        return this.isActive;
    }

    isFull(currentParticipants: number): boolean {
        return currentParticipants >= this.maxParticipants;
    }

    canBeJoinedByInvite(): boolean {
        return this.isActive && !this.isPublic;
    }

    canBeJoinedPublicly(): boolean {
        return this.isActive && this.isPublic;
    }

    // For backward compatibility
    getOwnerId(): string {
        return this.instructorId;
    }
}