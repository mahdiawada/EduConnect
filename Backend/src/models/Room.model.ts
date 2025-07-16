export class Room {
    private id: string;
    private name: string;
    private description?: string;
    private instructorId: string;
    private inviteCode: string;
    private isActive: boolean;
    private createdAt: Date;
    private updatedAt: Date;

    constructor(
        id: string,
        name: string,
        instructorId: string,
        inviteCode: string,
        description?: string,
        isActive: boolean = true,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.instructorId = instructorId;
        this.inviteCode = inviteCode;
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


    setIsActive(isActive: boolean): void {
        this.isActive = isActive;
        this.updatedAt = new Date();
    }

    // Business logic methods
    canJoin(): boolean {
        return this.isActive;
    }

    canBeJoinedByInvite(): boolean {
        return this.isActive;
    }

    // For backward compatibility
    getOwnerId(): string {
        return this.instructorId;
    }

    // Convert to plain object for JSON serialization
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            instructorId: this.instructorId,
            inviteCode: this.inviteCode,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}