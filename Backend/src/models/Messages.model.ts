export class Message {
    private id: string;
    private chatId: string;
    private senderId: string;
    private content: string;
    private messageType: 'text' | 'image' | 'file' | 'system';
    private replyToId?: string;
    private createdAt: Date;

    constructor(
        id: string,
        chatId: string,
        senderId: string,
        content: string,
        messageType: 'text' | 'image' | 'file' | 'system' = 'text',
        replyToId?: string,
        createdAt?: Date
    ) {
        this.id = id;
        this.chatId = chatId;
        this.senderId = senderId;
        this.content = content;
        this.messageType = messageType;
        this.replyToId = replyToId;
        this.createdAt = createdAt || new Date();
    }

    // Getters
    getId(): string {
        return this.id;
    }

    getChatId(): string {
        return this.chatId;
    }

    getSenderId(): string {
        return this.senderId;
    }

    getContent(): string {
        return this.content;
    }

    getMessageType(): 'text' | 'image' | 'file' | 'system' {
        return this.messageType;
    }

    getReplyToId(): string | undefined {
        return this.replyToId;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    // Setters
    setContent(content: string): void {
        this.content = content;
    }

    setMessageType(messageType: 'text' | 'image' | 'file' | 'system'): void {
        this.messageType = messageType;
    }

    setReplyToId(replyToId: string): void {
        this.replyToId = replyToId;
    }

    // Business logic methods
    isTextMessage(): boolean {
        return this.messageType === 'text';
    }

    isImageMessage(): boolean {
        return this.messageType === 'image';
    }

    isFileMessage(): boolean {
        return this.messageType === 'file';
    }

    isSystemMessage(): boolean {
        return this.messageType === 'system';
    }

    isReply(): boolean {
        return !!this.replyToId;
    }

    getAgeInMinutes(): number {
        const now = new Date();
        const diffTime = now.getTime() - this.createdAt.getTime();
        return Math.floor(diffTime / (1000 * 60));
    }

    getAgeInHours(): number {
        return Math.floor(this.getAgeInMinutes() / 60);
    }

    getAgeInDays(): number {
        return Math.floor(this.getAgeInHours() / 24);
    }

    isRecent(): boolean {
        return this.getAgeInMinutes() < 60;
    }

    // For backward compatibility
    getTimestamp(): Date {
        return this.createdAt;
    }
}