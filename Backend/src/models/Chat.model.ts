export class Chat {
    private id: string;
    private name: string;
    private roomId: string;
    private createdBy: string;
    private isPrivate: boolean;
    private createdAt: Date;
    private updatedAt: Date;

    constructor(
        id: string,
        name: string,
        roomId: string,
        createdBy: string,
        isPrivate: boolean = false,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        this.id = id;
        this.name = name;
        this.roomId = roomId;
        this.createdBy = createdBy;
        this.isPrivate = isPrivate;
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

    getRoomId(): string {
        return this.roomId;
    }

    getCreatedBy(): string {
        return this.createdBy;
    }

    getIsPrivate(): boolean {
        return this.isPrivate;
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

    setRoomId(roomId: string): void {
        this.roomId = roomId;
        this.updatedAt = new Date();
    }

    setIsPrivate(isPrivate: boolean): void {
        this.isPrivate = isPrivate;
        this.updatedAt = new Date();
    }


    // Business logic methods
    canBeAccessedBy(userId: string, isInstructor: boolean): boolean {
        
        if (!this.isPrivate) return true;
        // For private chats, only the creator and instructors can access
        return this.createdBy === userId || isInstructor;
    }

    isPublicChat(): boolean {
        return !this.isPrivate;
    }

    isPrivateChat(): boolean {
        return this.isPrivate;
    }

}