import { Room, CreateRoomRequest } from '../types';
import { CAMPUS, DEFAULTS, UI_TEXT } from '../constants';

// バックエンドのVenue型の定義
interface VenueResponse {
  id?: string;
  name?: string;
  code?: string;
  address?: string;
  capacity?: number;
  campus?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  can_mai?: boolean;
  desk?: number;
  chair?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
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
      description: ''
    };
  }
  
  return {
    id: venue.id || '',
    name: venue.name || '',
    campus: venue.campus === CAMPUS.IMADEGAWA ? CAMPUS.IMADEGAWA : CAMPUS.KYOTANABE,
    capacity: venue.capacity || DEFAULTS.CAPACITY,
    danceAllowed: venue.can_mai || DEFAULTS.DANCE_ALLOWED,
    description: venue.description || ''
  };
};

// フロントエンドのRoom型をバックエンドのVenue型にマッピング
export const mapRoomToVenue = (room: Partial<CreateRoomRequest>) => {
  return {
    name: room.name,
    code: `ROOM_${Date.now()}`, // 一時的なコード生成
    address: room.campus ? `${room.campus}${UI_TEXT.CAMPUS_SUFFIX}` : '未設定',
    capacity: room.capacity,
    campus: room.campus,
    description: room.description || (room.danceAllowed ? UI_TEXT.DANCE_KEYWORD + '可能' : ''),
    latitude: 35.6762, // デフォルト値（京都）
    longitude: 139.6503, // デフォルト値（京都）
    can_mai: room.danceAllowed || false,
    desk: 0,
    chair: room.capacity || 0,
    is_active: true
  };
};