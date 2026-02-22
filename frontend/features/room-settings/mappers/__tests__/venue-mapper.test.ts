import { describe, it, expect } from 'vitest';
import { mapVenueToRoom, mapRoomToVenue } from '@/features/room-settings/mappers/venue-mapper';

describe('venue-mapper', () => {
  describe('mapVenueToRoom', () => {
    it('全フィールドを持つVenueResponseをRoom型に正しく変換する', () => {
      const venue = {
        id: 'venue-1',
        name: '大教室A',
        code: 'ROOM_001',
        address: '京田辺キャンパス',
        capacity: 50,
        campus: '京田辺',
        description: '大きな教室です',
        latitude: 34.8,
        longitude: 135.7,
        can_mai: true,
        desk: 10,
        chair: 50,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const result = mapVenueToRoom(venue);

      expect(result).toEqual({
        id: 'venue-1',
        name: '大教室A',
        campus: '京田辺',
        capacity: 50,
        danceAllowed: true,
        description: '大きな教室です',
      });
    });

    it('nullを渡すとデフォルト値のRoomを返す', () => {
      const result = mapVenueToRoom(null);

      expect(result).toEqual({
        id: '',
        name: '',
        campus: '京田辺',
        capacity: 0,
        danceAllowed: false,
        description: '',
      });
    });

    it('undefinedを渡すとデフォルト値のRoomを返す', () => {
      const result = mapVenueToRoom(undefined);

      expect(result).toEqual({
        id: '',
        name: '',
        campus: '京田辺',
        capacity: 0,
        danceAllowed: false,
        description: '',
      });
    });

    it('campus=今出川の場合、今出川を返す', () => {
      const venue = { campus: '今出川' };

      const result = mapVenueToRoom(venue);

      expect(result.campus).toBe('今出川');
    });

    it('campus=京田辺の場合、京田辺を返す', () => {
      const venue = { campus: '京田辺' };

      const result = mapVenueToRoom(venue);

      expect(result.campus).toBe('京田辺');
    });

    it('campusがその他の値の場合、京田辺にフォールバックする', () => {
      const venue = { campus: '東京' };

      const result = mapVenueToRoom(venue);

      expect(result.campus).toBe('京田辺');
    });

    it('can_mai=trueの場合、danceAllowed=trueを返す', () => {
      const venue = { can_mai: true };

      const result = mapVenueToRoom(venue);

      expect(result.danceAllowed).toBe(true);
    });

    it('オプションフィールド（id, name, description）が未設定の場合、空文字を返す', () => {
      const venue = { capacity: 30 };

      const result = mapVenueToRoom(venue);

      expect(result.id).toBe('');
      expect(result.name).toBe('');
      expect(result.description).toBe('');
    });

    it('capacity=0の場合、0（DEFAULTS.CAPACITY）を返す', () => {
      const venue = { capacity: 0 };

      const result = mapVenueToRoom(venue);

      expect(result.capacity).toBe(0);
    });
  });

  describe('mapRoomToVenue', () => {
    it('全フィールドを持つCreateRoomRequestを正しいVenueオブジェクトに変換する', () => {
      const room = {
        name: '小教室B',
        campus: '今出川',
        capacity: 20,
        danceAllowed: true,
        description: '練習用の部屋',
      };

      const result = mapRoomToVenue(room);

      expect(result.name).toBe('小教室B');
      expect(result.campus).toBe('今出川');
      expect(result.capacity).toBe(20);
      expect(result.can_mai).toBe(true);
      expect(result.description).toBe('練習用の部屋');
      expect(result.chair).toBe(20);
      expect(result.desk).toBe(0);
      expect(result.is_active).toBe(true);
      expect(result.latitude).toBe(35.6762);
      expect(result.longitude).toBe(139.6503);
      expect(result.code).toMatch(/^ROOM_\d+$/);
    });

    it('campusが指定されている場合、addressは「${campus}キャンパス」になる', () => {
      const room = { campus: '今出川' };

      const result = mapRoomToVenue(room);

      expect(result.address).toBe('今出川キャンパス');
    });

    it('campusが未指定の場合、addressは「未設定」になる', () => {
      const room = {};

      const result = mapRoomToVenue(room);

      expect(result.address).toBe('未設定');
    });

    it('descriptionが指定されている場合、そのdescriptionを使用する', () => {
      const room = {
        description: 'カスタム説明',
        danceAllowed: true,
      };

      const result = mapRoomToVenue(room);

      expect(result.description).toBe('カスタム説明');
    });

    it('descriptionが空でdanceAllowed=trueの場合、descriptionは「舞可能」になる', () => {
      const room = {
        description: '',
        danceAllowed: true,
      };

      const result = mapRoomToVenue(room);

      expect(result.description).toBe('舞可能');
    });

    it('descriptionが空でdanceAllowed=falseの場合、descriptionは空文字になる', () => {
      const room = {
        description: '',
        danceAllowed: false,
      };

      const result = mapRoomToVenue(room);

      expect(result.description).toBe('');
    });

    it('danceAllowedがcan_maiに正しくマッピングされる', () => {
      const roomTrue = { danceAllowed: true };
      const roomFalse = { danceAllowed: false };

      expect(mapRoomToVenue(roomTrue).can_mai).toBe(true);
      expect(mapRoomToVenue(roomFalse).can_mai).toBe(false);
    });

    it('capacityがcapacityとchairの両方にマッピングされる', () => {
      const room = { capacity: 35 };

      const result = mapRoomToVenue(room);

      expect(result.capacity).toBe(35);
      expect(result.chair).toBe(35);
    });

    it('codeはROOM_プレフィックスで生成される', () => {
      const room = { name: 'テスト部屋' };

      const result = mapRoomToVenue(room);

      expect(result.code).toMatch(/^ROOM_\d+$/);
    });

    it('固定値（latitude, longitude, desk, is_active）が正しく設定される', () => {
      const room = {};

      const result = mapRoomToVenue(room);

      expect(result.latitude).toBe(35.6762);
      expect(result.longitude).toBe(139.6503);
      expect(result.desk).toBe(0);
      expect(result.is_active).toBe(true);
    });
  });
});
