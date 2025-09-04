import { Room, CreateRoomRequest } from '../types';
import { CAMPUS, DEFAULTS, UI_TEXT } from '../constants';

// バックエンドのVenue型の定義（推測）
interface VenueResponse {
  id?: string;
  name?: string;
  address?: string;
  capacity?: number;
  description?: string;
  location?: string;
  isActive?: boolean;
}

// バックエンドのVenue型をフロントエンドのRoom型にマッピング
export const mapVenueToRoom = (venue: VenueResponse | null | undefined): Room => {
  if (!venue) {
    return {
      id: '',
      name: '',
      campus: DEFAULTS.CAMPUS,
      capacity: DEFAULTS.CAPACITY,
      danceAllowed: DEFAULTS.DANCE_ALLOWED,
      description: '',
      location: ''
    };
  }
  
  return {
    id: venue.id || '',
    name: venue.name || '',
    campus: venue.address?.includes(CAMPUS.IMADEGAWA) ? CAMPUS.IMADEGAWA : CAMPUS.KYOTANABE,
    capacity: venue.capacity || DEFAULTS.CAPACITY,
    danceAllowed: venue.description?.includes(UI_TEXT.DANCE_KEYWORD) || DEFAULTS.DANCE_ALLOWED,
    description: venue.description || '',
    location: venue.location || ''
  };
};

// フロントエンドのRoom型をバックエンドのVenue型にマッピング
export const mapRoomToVenue = (room: Partial<CreateRoomRequest>) => {
  return {
    name: room.name,
    address: room.campus ? `${room.campus}${UI_TEXT.CAMPUS_SUFFIX}` : undefined,
    capacity: room.capacity,
    description: room.description || (room.danceAllowed ? UI_TEXT.DANCE_KEYWORD + '可能' : ''),
    location: room.location,
    isActive: true
  };
};