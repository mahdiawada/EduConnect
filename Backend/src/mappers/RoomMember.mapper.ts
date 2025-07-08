import { RoomMember } from "../models/RoomMember.model";
import { IMapper } from "./IMapper";
import { RoomMemberBuilder } from "../models/builders/RoomMember.builder";

export interface PostgresRoomMember {
    id: string;
    room_id: string;
    user_id: string;
    role: 'instructor' | 'student' | 'moderator';
    joined_at: Date;
    is_active: boolean;
}

export class RoomMemberMapper implements IMapper<PostgresRoomMember, RoomMember> {
    map(data: PostgresRoomMember): RoomMember {
        return new RoomMemberBuilder()
            .setId(data.id)
            .setRoomId(data.room_id)
            .setUserId(data.user_id)
            .setRole(data.role)
            .setJoinedAt(data.joined_at)
            .setIsActive(data.is_active)
            .build();
    }
    reverseMap(data: RoomMember): PostgresRoomMember {
        return {
            id: data.getId(),
            room_id: data.getRoomId(),
            user_id: data.getUserId(),
            role: data.getRole(),
            joined_at: data.getJoinedAt(),
            is_active: data.getIsActive()
        }
    }

}