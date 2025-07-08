import { Room } from "../models/Room.model";
import { IMapper } from "./IMapper";
import { RoomBuilder } from "../models/builders/Room.builder";

export interface PostgresRoom {
    id: string;
    name: string;
    description: string;
    instructor_id: string;
    invite_code: string;
    is_public: boolean;
    max_participants: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export class RoomMapper implements IMapper< PostgresRoom, Room> {
    map(data: PostgresRoom): Room {
        return new RoomBuilder()
            .setId(data.id)
            .setName(data.name)
            .setDescription(data.description)
            .setInstructorId(data.instructor_id)
            .setInviteCode(data.invite_code)
            .setIsPublic(data.is_public)
            .setMaxParticipants(data.max_participants)
            .setIsActive(data.is_active)
            .setCreatedAt(new Date(data.created_at))
            .setUpdatedAt(new Date(data.updated_at))
            .build();
    }
    reverseMap(data: Room): PostgresRoom {
        return {
            id: data.getId(),
            name: data.getName(),
            description: data.getDescription() ?? '',
            instructor_id: data.getInstructorId(),
            invite_code: data.getInviteCode(),
            is_public: data.getIsPublic(),
            max_participants: data.getMaxParticipants(),
            is_active: data.getIsActive(),
            created_at: data.getCreatedAt(),
            updated_at: data.getUpdatedAt()
        }
    }
}