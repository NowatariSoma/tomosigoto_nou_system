import { Room, CreateRoomRequest, UpdateRoomRequest, RoomListResponse } from '../types';
import { mapVenueToRoom, mapRoomToVenue } from '../mappers';
import { API_ENDPOINTS } from '../constants';
import { fetchApi } from '../../../lib/api';

export class RoomService {
  private readonly basePath = API_ENDPOINTS.VENUES;

  async getRooms(): Promise<Room[]> {
    const response = await fetchApi(this.basePath);
    const venues = await response.json();
    return venues.map(mapVenueToRoom);
  }

  async getRoom(id: string): Promise<Room> {
    const response = await fetchApi(`${this.basePath}${id}`);
    const venue = await response.json();
    return mapVenueToRoom(venue);
  }

  async createRoom(data: CreateRoomRequest): Promise<Room> {
    const venueData = mapRoomToVenue(data);
    const response = await fetchApi(this.basePath, {
      method: 'POST',
      body: JSON.stringify(venueData),
    });
    const venue = await response.json();
    return mapVenueToRoom(venue);
  }

  async updateRoom(id: string, data: UpdateRoomRequest): Promise<Room> {
    const venueData = mapRoomToVenue(data);
    const response = await fetchApi(`${this.basePath}${id}`, {
      method: 'PATCH',
      body: JSON.stringify(venueData),
    });
    const venue = await response.json();
    return mapVenueToRoom(venue);
  }

  async deleteRoom(id: string): Promise<void> {
    await fetchApi(`${this.basePath}${id}`, {
      method: 'DELETE',
    });
  }
}

export const roomService = new RoomService();