import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoomService } from '@/features/room-settings/services/room-service';

// fetchApiをモック
const mockFetchApi = vi.fn();
vi.mock('@/lib/api', () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

// mappersをモック
const mockMapVenueToRoom = vi.fn();
const mockMapRoomToVenue = vi.fn();
vi.mock('@/features/room-settings/mappers', () => ({
  mapVenueToRoom: (...args: unknown[]) => mockMapVenueToRoom(...args),
  mapRoomToVenue: (...args: unknown[]) => mockMapRoomToVenue(...args),
}));

describe('RoomService', () => {
  let service: RoomService;

  beforeEach(() => {
    service = new RoomService();
    vi.clearAllMocks();
  });

  // ヘルパー: レスポンスモックを作成
  function mockJsonResponse(data: unknown) {
    return { json: vi.fn().mockResolvedValue(data) };
  }

  describe('getRooms', () => {
    it('部屋一覧を取得しマッピングする', async () => {
      const venueData = [
        {
          id: 'venue-1',
          name: '練習室A',
          campus: '京田辺',
          capacity: 30,
          can_mai: true,
          description: '舞可能',
        },
        {
          id: 'venue-2',
          name: '練習室B',
          campus: '今出川',
          capacity: 20,
          can_mai: false,
          description: '',
        },
      ];
      const mappedRooms = [
        {
          id: 'venue-1',
          name: '練習室A',
          campus: '京田辺',
          capacity: 30,
          danceAllowed: true,
          description: '舞可能',
        },
        {
          id: 'venue-2',
          name: '練習室B',
          campus: '今出川',
          capacity: 20,
          danceAllowed: false,
          description: '',
        },
      ];
      mockFetchApi.mockResolvedValue(mockJsonResponse(venueData));
      mockMapVenueToRoom
        .mockReturnValueOnce(mappedRooms[0])
        .mockReturnValueOnce(mappedRooms[1]);

      const result = await service.getRooms();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('練習室A');
      expect(result[0].danceAllowed).toBe(true);
      expect(result[1].campus).toBe('今出川');
      expect(mockFetchApi).toHaveBeenCalledWith('/venues/');
      expect(mockMapVenueToRoom).toHaveBeenCalledTimes(2);
    });

    it('APIエラー時に例外をスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Network error'));

      await expect(service.getRooms()).rejects.toThrow('Network error');
    });
  });

  describe('getRoom', () => {
    it('単一の部屋を取得しマッピングする', async () => {
      const venueData = {
        id: 'venue-1',
        name: '練習室A',
        campus: '京田辺',
        capacity: 30,
        can_mai: true,
        description: '舞可能',
      };
      const mappedRoom = {
        id: 'venue-1',
        name: '練習室A',
        campus: '京田辺',
        capacity: 30,
        danceAllowed: true,
        description: '舞可能',
      };
      mockFetchApi.mockResolvedValue(mockJsonResponse(venueData));
      mockMapVenueToRoom.mockReturnValue(mappedRoom);

      const result = await service.getRoom('venue-1');
      expect(result.id).toBe('venue-1');
      expect(result.name).toBe('練習室A');
      expect(result.danceAllowed).toBe(true);
      expect(mockFetchApi).toHaveBeenCalledWith('/venues/venue-1');
      expect(mockMapVenueToRoom).toHaveBeenCalledWith(venueData);
    });

    it('APIエラー時に例外をスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Not found'));

      await expect(service.getRoom('invalid-id')).rejects.toThrow('Not found');
    });
  });

  describe('createRoom', () => {
    it('部屋を作成しマッピングされた結果を返す', async () => {
      const createData = {
        name: '新練習室',
        campus: '京田辺',
        capacity: 25,
        danceAllowed: true,
        description: '新しい練習室',
      };
      const venuePayload = {
        name: '新練習室',
        code: 'ROOM_123',
        address: '京田辺キャンパス',
        capacity: 25,
        campus: '京田辺',
        description: '新しい練習室',
        can_mai: true,
      };
      const venueResponse = {
        id: 'venue-new',
        ...venuePayload,
      };
      const mappedRoom = {
        id: 'venue-new',
        name: '新練習室',
        campus: '京田辺',
        capacity: 25,
        danceAllowed: true,
        description: '新しい練習室',
      };
      mockMapRoomToVenue.mockReturnValue(venuePayload);
      mockFetchApi.mockResolvedValue(mockJsonResponse(venueResponse));
      mockMapVenueToRoom.mockReturnValue(mappedRoom);

      const result = await service.createRoom(createData);
      expect(result.id).toBe('venue-new');
      expect(result.name).toBe('新練習室');
      expect(mockMapRoomToVenue).toHaveBeenCalledWith(createData);
      expect(mockFetchApi).toHaveBeenCalledWith('/venues/', {
        method: 'POST',
        body: JSON.stringify(venuePayload),
      });
      expect(mockMapVenueToRoom).toHaveBeenCalledWith(venueResponse);
    });

    it('APIエラー時に例外をスローする', async () => {
      mockMapRoomToVenue.mockReturnValue({});
      mockFetchApi.mockRejectedValue(new Error('Validation error'));

      await expect(
        service.createRoom({
          name: '',
          campus: '京田辺',
          capacity: 0,
          danceAllowed: false,
        })
      ).rejects.toThrow('Validation error');
    });
  });

  describe('updateRoom', () => {
    it('部屋を更新しマッピングされた結果を返す', async () => {
      const updateData = {
        name: '更新済み練習室',
        capacity: 50,
      };
      const venuePayload = {
        name: '更新済み練習室',
        capacity: 50,
      };
      const venueResponse = {
        id: 'venue-1',
        name: '更新済み練習室',
        campus: '京田辺',
        capacity: 50,
        can_mai: true,
      };
      const mappedRoom = {
        id: 'venue-1',
        name: '更新済み練習室',
        campus: '京田辺',
        capacity: 50,
        danceAllowed: true,
        description: '',
      };
      mockMapRoomToVenue.mockReturnValue(venuePayload);
      mockFetchApi.mockResolvedValue(mockJsonResponse(venueResponse));
      mockMapVenueToRoom.mockReturnValue(mappedRoom);

      const result = await service.updateRoom('venue-1', updateData);
      expect(result.id).toBe('venue-1');
      expect(result.name).toBe('更新済み練習室');
      expect(result.capacity).toBe(50);
      expect(mockMapRoomToVenue).toHaveBeenCalledWith(updateData);
      expect(mockFetchApi).toHaveBeenCalledWith('/venues/venue-1', {
        method: 'PATCH',
        body: JSON.stringify(venuePayload),
      });
      expect(mockMapVenueToRoom).toHaveBeenCalledWith(venueResponse);
    });

    it('APIエラー時に例外をスローする', async () => {
      mockMapRoomToVenue.mockReturnValue({});
      mockFetchApi.mockRejectedValue(new Error('Not found'));

      await expect(
        service.updateRoom('invalid-id', { name: 'test' })
      ).rejects.toThrow('Not found');
    });
  });

  describe('deleteRoom', () => {
    it('部屋を削除する', async () => {
      mockFetchApi.mockResolvedValue(undefined);

      await service.deleteRoom('venue-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/venues/venue-1', {
        method: 'DELETE',
      });
    });

    it('APIエラー時に例外をスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Forbidden'));

      await expect(service.deleteRoom('venue-1')).rejects.toThrow('Forbidden');
    });
  });
});
