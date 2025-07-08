export class User {
    private id: string;
    private username: string;
    private email: string;
    private passwordHash: string;
    private fullName: string;
    private avatarUrl?: string;
    private bio?: string;
    private isActive: boolean;
    private createdAt: Date;
    private updatedAt: Date;

    constructor(
        id: string,
        username: string,
        email: string,
        passwordHash: string,
        fullName: string,
        avatarUrl?: string,
        bio?: string,
        isActive: boolean = true,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.avatarUrl = avatarUrl;
        this.bio = bio;
        this.isActive = isActive;
        this.createdAt = createdAt || new Date();
        this.updatedAt = updatedAt || new Date();
    }

    // Getters
    getId(): string {
        return this.id;
    }

    getUsername(): string {
        return this.username;
    }

    getEmail(): string {
        return this.email;
    }

    getPasswordHash(): string {
        return this.passwordHash;
    }

    getFullName(): string {
        return this.fullName;
    }

    getAvatarUrl(): string | undefined {
        return this.avatarUrl;
    }

    getBio(): string | undefined {
        return this.bio;
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
    setUsername(username: string): void {
        this.username = username;
        this.updatedAt = new Date();
    }

    setEmail(email: string): void {
        this.email = email;
        this.updatedAt = new Date();
    }

    setPasswordHash(passwordHash: string): void {
        this.passwordHash = passwordHash;
        this.updatedAt = new Date();
    }

    setFullName(fullName: string): void {
        this.fullName = fullName;
        this.updatedAt = new Date();
    }

    setAvatarUrl(avatarUrl: string): void {
        this.avatarUrl = avatarUrl;
        this.updatedAt = new Date();
    }

    setBio(bio: string): void {
        this.bio = bio;
        this.updatedAt = new Date();
    }

    setIsActive(isActive: boolean): void {
        this.isActive = isActive;
        this.updatedAt = new Date();
    }

    // Business logic methods
    canCreateRooms(): boolean {
        return this.isActive;
    }

    // For backward compatibility (keeping your existing method names)
    getName(): string {
        return this.fullName;
    }

    getPassword(): string {
        return this.passwordHash;
    }
}