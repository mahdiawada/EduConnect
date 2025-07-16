import { ChatBuilder } from "../models/builders/Chat.builder";
import { Chat } from "../models/Chat.model";
import { IMapper } from "./IMapper";

export interface PostgresChat {
    id: string;
    name: string;
    room_id: string;
    created_by: string;
    created_at: Date;
    updated_at: Date;
}

export class ChatMapper implements IMapper<PostgresChat, Chat> {
    
    map(data: PostgresChat): Chat {
        return new ChatBuilder()
            .setId(data.id)
            .setName(data.name)
            .setRoomId(data.room_id)
            .setCreatedBy(data.created_by)
            .setCreatedAt(data.created_at)
            .setUpdatedAt(data.updated_at)
            .build();
    }
    reverseMap(data: Chat): PostgresChat {
        return {
        id: data.getId(),
        name: data.getName(),
        room_id: data.getRoomId(),
        created_by: data.getCreatedBy(),
        created_at: data.getCreatedAt(),
        updated_at: data.getUpdatedAt()
}
    } 
}