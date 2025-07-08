import { MessageBuilder } from "../models/builders/Messages.builder";
import { IMapper } from "./IMapper";
import { Message } from "../models/Messages.model";

export interface PostgresMessage {
    id: string;
    chat_id: string;
    sender_id: string;
    content: string;
    message_type: 'text' | 'image' | 'file' | 'system';
    created_at: Date;
}

export class MessageMapper implements IMapper<PostgresMessage, Message> {

    map(data: PostgresMessage): Message {
        return new MessageBuilder()
            .setId(data.id)
            .setChatId(data.chat_id)
            .setSenderId(data.sender_id)
            .setContent(data.content)
            .setMessageType(data.message_type)
            .setCreatedAt(new Date(data.created_at))
            .build();
    }

    reverseMap(data: Message): PostgresMessage {
        return {
            id: data.getId(),
            chat_id: data.getChatId(),
            sender_id: data.getSenderId(),
            content: data.getContent(),
            message_type: data.getMessageType(),
            created_at: data.getCreatedAt()
        };
    }
} 