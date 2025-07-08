import { Message } from "../Messages.model";
import logger from "../../utils/logger";

export class MessageBuilder {
    private id!: string;
    private chatId!: string;
    private senderId!: string;
    private content!: string;
    private messageType: 'text' | 'image' | 'file' | 'system' = 'text';
    private replyToId?: string;
    private createdAt?: Date;

    setId(id: string): MessageBuilder {
        this.id = id;
        return this;
    }

    setChatId(chatId: string): MessageBuilder {
        this.chatId = chatId;
        return this;
    }

    setSenderId(senderId: string): MessageBuilder {
        this.senderId = senderId;
        return this;
    }

    setContent(content: string): MessageBuilder {
        this.content = content;
        return this;
    }

    setMessageType(messageType: 'text' | 'image' | 'file' | 'system'): MessageBuilder {
        this.messageType = messageType;
        return this;
    }

    setReplyToId(replyToId: string): MessageBuilder {
        this.replyToId = replyToId;
        return this;
    }

    setCreatedAt(createdAt: Date): MessageBuilder {
        this.createdAt = createdAt;
        return this;
    }

    // For backward compatibility
    setTimestamp(timestamp: Date): MessageBuilder {
        this.createdAt = timestamp;
        return this;
    }

    build(): Message {
        const requiredProps = [
            this.id,
            this.chatId,
            this.senderId,
            this.content
        ];

        for (const property of requiredProps) {
            if (property === null || property === undefined) {
                logger.error("Missing required properties, could not build a Message");
                throw Error("Missing Required Properties");
            }
        }

        return new Message(
            this.id,
            this.chatId,
            this.senderId,
            this.content,
            this.messageType,
            this.replyToId,
            this.createdAt
        );
    }
}