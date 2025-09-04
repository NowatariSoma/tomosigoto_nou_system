import { apiClient } from './api-client';
import { Room } from '../types/room';

export interface CreateRoomRequest {
  name: string;
  campus: string;
  capacity: number;
  danceAllowed: boolean;
  description?: string;
  location?: string;
}

export interface UpdateRoomRequest extends Partial<CreateRoomRequest> {}

export interface RoomListResponse {
  venues: Room[];
  total: number;
  page: number;
  pageSize: number;
}

export class RoomService {
  private readonly basePath = '/api/venues/';

  async getRooms(): Promise<Room[]> {
    try {
      const response = await apiClient.get<any>(this.basePath);
      
      // レスポンスのログ出力（デバッグ用）
      console.log('API Response:', response);
      
      // レスポンスが配列の場合
      if (Array.isArray(response)) {
        return response.map((venue) => this.mapVenueToRoom(venue));
      }
      
      // レスポンスがオブジェクトでvenuesプロパティを持つ場合
      if (response && response.venues && Array.isArray(response.venues)) {
        return response.venues.map((venue) => this.mapVenueToRoom(venue));
      }
      
      // それ以外の場合は空配列を返す
      console.warn('Unexpected API response format:', response);
      return [];
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      return [];
    }
  }

  async getRoom(id: string): Promise<Room> {
    const venue = await apiClient.get<any>(`${this.basePath}/${id}`);
    return this.mapVenueToRoom(venue);
  }

  async createRoom(data: CreateRoomRequest): Promise<Room> {
    const venueData = this.mapRoomToVenue(data);
    const venue = await apiClient.post<any>(this.basePath, venueData);
    return this.mapVenueToRoom(venue);
  }

  async updateRoom(id: string, data: UpdateRoomRequest): Promise<Room> {
    const venueData = this.mapRoomToVenue(data);
    const venue = await apiClient.patch<any>(`${this.basePath}${id}/`, venueData);
    return this.mapVenueToRoom(venue);
  }

  async deleteRoom(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }

  // バックエンドのVenue型をフロントエンドのRoom型にマッピング
  private mapVenueToRoom(venue: any): Room {
    if (!venue) {
      return {
        id: '',
        name: '',
        campus: '京田辺',
        capacity: 0,
        danceAllowed: false,
        description: '',
        location: ''
      };
    }
    
    return {
      id: venue.id || '',
      name: venue.name || '',
      campus: venue.address?.includes('今出川') ? '今出川' : '京田辺',
      capacity: venue.capacity || 0,
      danceAllowed: venue.description?.includes('舞') || false,
      description: venue.description || '',
      location: venue.location || ''
    };
  }

  // フロントエンドのRoom型をバックエンドのVenue型にマッピング
  private mapRoomToVenue(room: Partial<CreateRoomRequest>) {
    return {
      name: room.name,
      address: room.campus ? `${room.campus}キャンパス` : undefined,
      capacity: room.capacity,
      description: room.description || (room.danceAllowed ? '舞可能' : ''),
      location: room.location,
      isActive: true
    };
  }
}

export const roomService = new RoomService();