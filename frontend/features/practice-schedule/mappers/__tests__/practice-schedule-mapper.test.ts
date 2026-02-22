import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTransformApiResponseToSchedule = vi.fn();
vi.mock('@/features/practice-schedule/types/schemas', () => ({
  transformApiResponseToSchedule: (...args: unknown[]) => mockTransformApiResponseToSchedule(...args),
}));

import {
  mapApiResponseToPracticeSchedule,
  mapCreateRequestToApiRequest,
  mapUpdateRequestToApiRequest,
} from '@/features/practice-schedule/mappers/practice-schedule-mapper';

describe('practice-schedule-mapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapApiResponseToPracticeSchedule', () => {
    const baseSchedule = () => ({
      id: 'ps-1',
      date: '2024-06-15',
      startTime: '09:00',
      endTime: '17:00',
      venueId: 'venue-1',
      venueName: '',
      campus: '',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      venues: [],
    });

    it('transformApiResponseToScheduleに委譲し、その結果を返す', () => {
      const schedule = baseSchedule();
      mockTransformApiResponseToSchedule.mockReturnValue(schedule);
      const apiResponse = { id: 'ps-1' };

      const result = mapApiResponseToPracticeSchedule(apiResponse);

      expect(mockTransformApiResponseToSchedule).toHaveBeenCalledWith(apiResponse);
      expect(result.id).toBe('ps-1');
      expect(result.date).toBe('2024-06-15');
    });

    it('venueNameパラメータでschedule.venueNameを上書きする', () => {
      const schedule = baseSchedule();
      mockTransformApiResponseToSchedule.mockReturnValue(schedule);

      const result = mapApiResponseToPracticeSchedule({}, '大ホール');

      expect(result.venueName).toBe('大ホール');
    });

    it('campusパラメータでschedule.campusを上書きする', () => {
      const schedule = baseSchedule();
      mockTransformApiResponseToSchedule.mockReturnValue(schedule);

      const result = mapApiResponseToPracticeSchedule({}, undefined, '京田辺');

      expect(result.campus).toBe('京田辺');
    });

    it('venueNameが空でvenuesが存在する場合、venues[0]にフォールバックする', () => {
      const schedule = {
        ...baseSchedule(),
        venueName: '',
        campus: '',
        venues: [
          { id: 'v-1', name: '練習室A', campus: '今出川' },
          { id: 'v-2', name: '練習室B', campus: '京田辺' },
        ],
      };
      mockTransformApiResponseToSchedule.mockReturnValue(schedule);

      const result = mapApiResponseToPracticeSchedule({});

      expect(result.venueName).toBe('練習室A');
      expect(result.campus).toBe('今出川');
    });

    it('venueNameが既に設定されている場合、venues[0]にフォールバックしない', () => {
      const schedule = {
        ...baseSchedule(),
        venueName: '既存の会場',
        campus: '既存キャンパス',
        venues: [
          { id: 'v-1', name: '練習室A', campus: '今出川' },
        ],
      };
      mockTransformApiResponseToSchedule.mockReturnValue(schedule);

      const result = mapApiResponseToPracticeSchedule({});

      expect(result.venueName).toBe('既存の会場');
      expect(result.campus).toBe('既存キャンパス');
    });

    it('venueNameパラメータとvenuesの両方がある場合、パラメータが優先される', () => {
      const schedule = {
        ...baseSchedule(),
        venueName: '',
        campus: '',
        venues: [
          { id: 'v-1', name: '練習室A', campus: '今出川' },
        ],
      };
      mockTransformApiResponseToSchedule.mockReturnValue(schedule);

      const result = mapApiResponseToPracticeSchedule({}, 'パラメータ会場', 'パラメータキャンパス');

      // venueNameパラメータがセットされた後、venueNameが空でないためフォールバックは起きない
      expect(result.venueName).toBe('パラメータ会場');
      expect(result.campus).toBe('パラメータキャンパス');
    });
  });

  describe('mapCreateRequestToApiRequest', () => {
    it('全フィールドが正しくマッピングされる', () => {
      const request = {
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '17:00',
        venueId: 'venue-1',
        divisionCount: 8,
        title: '通し稽古',
        description: '本番前の通し稽古',
        scheduleType: 'special',
        status: 'draft',
        venueIds: ['venue-1', 'venue-2'],
        stageId: 'stage-1',
      };

      const result = mapCreateRequestToApiRequest(request);

      expect(result).toEqual({
        schedule_date: '2024-06-15',
        start_time: '09:00',
        end_time: '17:00',
        division_count: 8,
        title: '通し稽古',
        description: '本番前の通し稽古',
        schedule_type: 'special',
        status: 'draft',
        venue_ids: ['venue-1', 'venue-2'],
        stage_id: 'stage-1',
      });
    });

    it('divisionCountが未指定の場合、デフォルト値6になる', () => {
      const request = {
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '17:00',
        venueId: 'venue-1',
      };

      const result = mapCreateRequestToApiRequest(request);

      expect(result.division_count).toBe(6);
    });

    it('titleが未指定の場合、デフォルト値の空文字になる', () => {
      const request = {
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '17:00',
        venueId: 'venue-1',
      };

      const result = mapCreateRequestToApiRequest(request);

      expect(result.title).toBe('');
    });

    it('descriptionが未指定の場合、デフォルト値の空文字になる', () => {
      const request = {
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '17:00',
        venueId: 'venue-1',
      };

      const result = mapCreateRequestToApiRequest(request);

      expect(result.description).toBe('');
    });

    it('scheduleTypeが未指定の場合、デフォルト値regularになる', () => {
      const request = {
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '17:00',
        venueId: 'venue-1',
      };

      const result = mapCreateRequestToApiRequest(request);

      expect(result.schedule_type).toBe('regular');
    });

    it('statusが未指定の場合、デフォルト値activeになる', () => {
      const request = {
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '17:00',
        venueId: 'venue-1',
      };

      const result = mapCreateRequestToApiRequest(request);

      expect(result.status).toBe('active');
    });

    it('venueIdsが指定されている場合、そのまま使用される', () => {
      const request = {
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '17:00',
        venueId: 'venue-1',
        venueIds: ['venue-2', 'venue-3'],
      };

      const result = mapCreateRequestToApiRequest(request);

      expect(result.venue_ids).toEqual(['venue-2', 'venue-3']);
    });

    it('venueIdsが未指定でvenueIdがある場合、venue_ids=[venueId]になる', () => {
      const request = {
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '17:00',
        venueId: 'venue-1',
      };

      const result = mapCreateRequestToApiRequest(request);

      expect(result.venue_ids).toEqual(['venue-1']);
    });

    it('venueIdsもvenueIdも空の場合、venue_ids=[]になる', () => {
      const request = {
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '17:00',
        venueId: '',
      };

      const result = mapCreateRequestToApiRequest(request);

      expect(result.venue_ids).toEqual([]);
    });

    it('stageIdが指定されている場合、stage_idが設定される', () => {
      const request = {
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '17:00',
        venueId: 'venue-1',
        stageId: 'stage-1',
      };

      const result = mapCreateRequestToApiRequest(request);

      expect(result.stage_id).toBe('stage-1');
    });

    it('stageIdが未指定の場合、stage_idはundefinedになる', () => {
      const request = {
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '17:00',
        venueId: 'venue-1',
      };

      const result = mapCreateRequestToApiRequest(request);

      expect(result.stage_id).toBeUndefined();
    });
  });

  describe('mapUpdateRequestToApiRequest', () => {
    it('単一フィールドの更新では、そのフィールドのみが出力に含まれる', () => {
      const request = { date: '2024-07-01' };

      const result = mapUpdateRequestToApiRequest(request);

      expect(result).toEqual({ schedule_date: '2024-07-01' });
    });

    it('複数フィールドの更新では、すべてのフィールドが出力に含まれる', () => {
      const request = {
        date: '2024-07-01',
        startTime: '10:00',
        endTime: '18:00',
        title: '更新後タイトル',
      };

      const result = mapUpdateRequestToApiRequest(request);

      expect(result).toEqual({
        schedule_date: '2024-07-01',
        start_time: '10:00',
        end_time: '18:00',
        title: '更新後タイトル',
      });
    });

    it('空のリクエストでは空のオブジェクトを返す', () => {
      const request = {};

      const result = mapUpdateRequestToApiRequest(request);

      expect(result).toEqual({});
    });

    it('venueIdsが指定されている場合、venue_idsが設定される', () => {
      const request = { venueIds: ['venue-1', 'venue-2'] };

      const result = mapUpdateRequestToApiRequest(request);

      expect(result.venue_ids).toEqual(['venue-1', 'venue-2']);
    });

    it('venueIdsが未指定でvenueIdがある場合、venue_ids=[venueId]になる', () => {
      const request = { venueId: 'venue-1' };

      const result = mapUpdateRequestToApiRequest(request);

      expect(result.venue_ids).toEqual(['venue-1']);
    });

    it('venueIdsもvenueIdも未指定の場合、venue_idsは出力に含まれない', () => {
      const request = { title: 'テスト' };

      const result = mapUpdateRequestToApiRequest(request);

      expect(result).not.toHaveProperty('venue_ids');
    });

    it('undefinedのフィールドは出力に含まれない', () => {
      const request = { date: '2024-07-01' };

      const result = mapUpdateRequestToApiRequest(request);

      expect(result).not.toHaveProperty('start_time');
      expect(result).not.toHaveProperty('end_time');
      expect(result).not.toHaveProperty('division_count');
      expect(result).not.toHaveProperty('title');
      expect(result).not.toHaveProperty('description');
      expect(result).not.toHaveProperty('schedule_type');
      expect(result).not.toHaveProperty('status');
      expect(result).not.toHaveProperty('stage_id');
    });

    it('stageIdが指定されている場合、stage_idが設定される', () => {
      const request = { stageId: 'stage-1' };

      const result = mapUpdateRequestToApiRequest(request);

      expect(result.stage_id).toBe('stage-1');
    });

    it('divisionCountが指定されている場合、division_countが設定される', () => {
      const request = { divisionCount: 4 };

      const result = mapUpdateRequestToApiRequest(request);

      expect(result.division_count).toBe(4);
    });

    it('descriptionが指定されている場合、descriptionが設定される', () => {
      const request = { description: '更新後の説明' };

      const result = mapUpdateRequestToApiRequest(request);

      expect(result.description).toBe('更新後の説明');
    });

    it('scheduleTypeが指定されている場合、schedule_typeが設定される', () => {
      const request = { scheduleType: 'special' };

      const result = mapUpdateRequestToApiRequest(request);

      expect(result.schedule_type).toBe('special');
    });

    it('statusが指定されている場合、statusが設定される', () => {
      const request = { status: 'cancelled' };

      const result = mapUpdateRequestToApiRequest(request);

      expect(result.status).toBe('cancelled');
    });
  });
});
