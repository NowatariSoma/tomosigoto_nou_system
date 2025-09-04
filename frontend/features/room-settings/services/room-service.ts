import { apiClient } from './api-client';
import { Room, CreateRoomRequest, UpdateRoomRequest, RoomListResponse } from '../types';
import { mapVenueToRoom, mapRoomToVenue } from '../mappers';
import { API_ENDPOINTS } from '../constants';

export class RoomService {
  private readonly basePath = API_ENDPOINTS.VENUES;

  async getRooms(): Promise<Room[]> {
    try {
      const response = await apiClient.get<any>(this.basePath);
      
      // レスポンスのログ出力（デバッグ用）
      console.log('API Response:', response);
      
      // レスポンスが配列の場合
      if (Array.isArray(response)) {
        return response.map(mapVenueToRoom);
      }
      
      // レスポンスがオブジェクトでvenuesプロパティを持つ場合
      if (response && response.venues && Array.isArray(response.venues)) {
        return response.venues.map(mapVenueToRoom);
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
    return mapVenueToRoom(venue);
  }

  async createRoom(data: CreateRoomRequest): Promise<Room> {
    const venueData = mapRoomToVenue(data);
    const venue = await apiClient.post<any>(this.basePath, venueData);
    return mapVenueToRoom(venue);
  }

  async updateRoom(id: string, data: UpdateRoomRequest): Promise<Room> {
    const venueData = mapRoomToVenue(data);
    const venue = await apiClient.patch<any>(`${this.basePath}${id}/`, venueData);
    return mapVenueToRoom(venue);
  }

  async deleteRoom(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }
}

export const roomService = new RoomService();