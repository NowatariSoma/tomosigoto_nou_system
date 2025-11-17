export interface Room {
  id: string;
  name: string;
  campus: '今出川' | '京田辺';
  capacity: number;
  danceAllowed: boolean;
  description?: string;
}

export interface CreateRoomRequest {
  name: string;
  campus: string;
  capacity: number;
  danceAllowed: boolean;
  description?: string;
}

export interface UpdateRoomRequest extends Partial<CreateRoomRequest> {}

export interface RoomListResponse {
  venues: Room[];
  total: number;
  page: number;
  pageSize: number;
} 