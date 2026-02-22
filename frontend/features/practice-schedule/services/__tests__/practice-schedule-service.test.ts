import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PracticeScheduleService } from '@/features/practice-schedule/services/practice-schedule-service';

// fetchApiをモック
const mockFetchApi = vi.fn();
vi.mock('@/lib/api', () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

// マッパーをモック
const mockMapApiResponseToPracticeSchedule = vi.fn();
const mockMapCreateRequestToApiRequest = vi.fn();
const mockMapUpdateRequestToApiRequest = vi.fn();
vi.mock('@/features/practice-schedule/mappers', () => ({
  mapApiResponseToPracticeSchedule: (...args: unknown[]) => mockMapApiResponseToPracticeSchedule(...args),
  mapCreateRequestToApiRequest: (...args: unknown[]) => mockMapCreateRequestToApiRequest(...args),
  mapUpdateRequestToApiRequest: (...args: unknown[]) => mockMapUpdateRequestToApiRequest(...args),
}));

describe('PracticeScheduleService', () => {
  let service: PracticeScheduleService;

  beforeEach(() => {
    service = new PracticeScheduleService();
    vi.clearAllMocks();
  });

  // ヘルパー: レスポンスモックを作成
  function mockJsonResponse(data: unknown) {
    return { json: vi.fn().mockResolvedValue(data) };
  }

  // テスト用のAPIレスポンスデータ
  const apiScheduleResponse = {
    id: 'schedule-1',
    schedule_date: '2024-06-15',
    start_time: '09:00',
    end_time: '12:00',
    division_count: 6,
    title: '通し稽古',
    description: '全体の通し稽古',
    schedule_type: 'regular',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    venue_ids: ['venue-1'],
    venues: [{ id: 'venue-1', name: '能楽堂', campus: '今出川' }],
    stage_id: 'stage-1',
    stage: { id: 'stage-1', name: '道成寺' },
  };

  // マッピング後のフロントエンド用データ
  const mappedSchedule = {
    id: 'schedule-1',
    date: '2024-06-15',
    startTime: '09:00',
    endTime: '12:00',
    venueId: 'venue-1',
    venueName: '能楽堂',
    campus: '今出川',
    title: '通し稽古',
    description: '全体の通し稽古',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    venueIds: ['venue-1'],
    venues: [{ id: 'venue-1', name: '能楽堂', campus: '今出川' }],
    stageId: 'stage-1',
    stage: { id: 'stage-1', name: '道成寺' },
  };

  describe('getPracticeSchedules', () => {
    it('練習スケジュール一覧を取得しマッピングする', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([apiScheduleResponse]));
      mockMapApiResponseToPracticeSchedule.mockReturnValue(mappedSchedule);

      const result = await service.getPracticeSchedules();

      expect(mockFetchApi).toHaveBeenCalledWith('/practice_schedules/');
      expect(result).toHaveLength(1);
      expect(mockMapApiResponseToPracticeSchedule).toHaveBeenCalledWith(apiScheduleResponse);
      expect(result[0]).toEqual(mappedSchedule);
    });

    it('空のリストを返す場合', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([]));

      const result = await service.getPracticeSchedules();

      expect(result).toHaveLength(0);
      expect(mockMapApiResponseToPracticeSchedule).not.toHaveBeenCalled();
    });

    it('複数のスケジュールを取得する場合', async () => {
      const secondApiResponse = { ...apiScheduleResponse, id: 'schedule-2', title: '仕舞稽古' };
      const secondMapped = { ...mappedSchedule, id: 'schedule-2', title: '仕舞稽古' };

      mockFetchApi.mockResolvedValue(mockJsonResponse([apiScheduleResponse, secondApiResponse]));
      mockMapApiResponseToPracticeSchedule
        .mockReturnValueOnce(mappedSchedule)
        .mockReturnValueOnce(secondMapped);

      const result = await service.getPracticeSchedules();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mappedSchedule);
      expect(result[1]).toEqual(secondMapped);
      expect(mockMapApiResponseToPracticeSchedule).toHaveBeenCalledTimes(2);
    });

    it('fetchApiがエラーをスローした場合、エラーが伝播する', async () => {
      mockFetchApi.mockRejectedValue(new Error('Network error'));

      await expect(service.getPracticeSchedules()).rejects.toThrow('Network error');
    });
  });

  describe('getPracticeSchedule', () => {
    it('単一の練習スケジュールを取得しマッピングする', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(apiScheduleResponse));
      mockMapApiResponseToPracticeSchedule.mockReturnValue(mappedSchedule);

      const result = await service.getPracticeSchedule('schedule-1');

      expect(mockFetchApi).toHaveBeenCalledWith('/practice_schedules/schedule-1');
      expect(mockMapApiResponseToPracticeSchedule).toHaveBeenCalledWith(apiScheduleResponse);
      expect(result).toEqual(mappedSchedule);
    });

    it('fetchApiがエラーをスローした場合、エラーが伝播する', async () => {
      mockFetchApi.mockRejectedValue(new Error('Not found'));

      await expect(service.getPracticeSchedule('nonexistent')).rejects.toThrow('Not found');
    });
  });

  describe('createPracticeSchedule', () => {
    const createRequest = {
      date: '2024-06-20',
      startTime: '10:00',
      endTime: '13:00',
      venueId: 'venue-1',
      venueIds: ['venue-1'],
      divisionCount: 6,
      title: '新規稽古',
      description: '新しい稽古の予定',
      scheduleType: 'regular',
      status: 'active',
      stageId: 'stage-1',
    };

    const mappedApiRequest = {
      schedule_date: '2024-06-20',
      start_time: '10:00',
      end_time: '13:00',
      division_count: 6,
      title: '新規稽古',
      description: '新しい稽古の予定',
      schedule_type: 'regular',
      status: 'active',
      venue_ids: ['venue-1'],
      stage_id: 'stage-1',
    };

    it('練習スケジュールを作成しマッピングされた結果を返す', async () => {
      mockMapCreateRequestToApiRequest.mockReturnValue(mappedApiRequest);
      mockFetchApi.mockResolvedValue(mockJsonResponse(apiScheduleResponse));
      mockMapApiResponseToPracticeSchedule.mockReturnValue(mappedSchedule);

      const result = await service.createPracticeSchedule(createRequest);

      expect(mockMapCreateRequestToApiRequest).toHaveBeenCalledWith(createRequest);
      expect(mockFetchApi).toHaveBeenCalledWith('/practice_schedules/', {
        method: 'POST',
        body: JSON.stringify(mappedApiRequest),
      });
      expect(mockMapApiResponseToPracticeSchedule).toHaveBeenCalledWith(apiScheduleResponse);
      expect(result).toEqual(mappedSchedule);
    });

    it('fetchApiがエラーをスローした場合、エラーが伝播する', async () => {
      mockMapCreateRequestToApiRequest.mockReturnValue(mappedApiRequest);
      mockFetchApi.mockRejectedValue(new Error('Validation error'));

      await expect(service.createPracticeSchedule(createRequest)).rejects.toThrow('Validation error');
    });
  });

  describe('updatePracticeSchedule', () => {
    const updateRequest = {
      title: '更新された稽古',
      startTime: '11:00',
      endTime: '14:00',
      stageId: 'stage-2',
    };

    const mappedUpdateApiRequest = {
      title: '更新された稽古',
      start_time: '11:00',
      end_time: '14:00',
      stage_id: 'stage-2',
    };

    it('練習スケジュールを更新しマッピングされた結果を返す', async () => {
      mockMapUpdateRequestToApiRequest.mockReturnValue(mappedUpdateApiRequest);
      mockFetchApi.mockResolvedValue(mockJsonResponse(apiScheduleResponse));
      mockMapApiResponseToPracticeSchedule.mockReturnValue(mappedSchedule);

      const result = await service.updatePracticeSchedule('schedule-1', updateRequest);

      expect(mockMapUpdateRequestToApiRequest).toHaveBeenCalledWith(updateRequest);
      expect(mockFetchApi).toHaveBeenCalledWith('/practice_schedules/schedule-1', {
        method: 'PUT',
        body: JSON.stringify(mappedUpdateApiRequest),
      });
      expect(mockMapApiResponseToPracticeSchedule).toHaveBeenCalledWith(apiScheduleResponse);
      expect(result).toEqual(mappedSchedule);
    });

    it('fetchApiがエラーをスローした場合、エラーが伝播する', async () => {
      mockMapUpdateRequestToApiRequest.mockReturnValue(mappedUpdateApiRequest);
      mockFetchApi.mockRejectedValue(new Error('Server error'));

      await expect(service.updatePracticeSchedule('schedule-1', updateRequest)).rejects.toThrow('Server error');
    });
  });

  describe('deletePracticeSchedule', () => {
    it('練習スケジュールを削除する', async () => {
      mockFetchApi.mockResolvedValue(undefined);

      await service.deletePracticeSchedule('schedule-1');

      expect(mockFetchApi).toHaveBeenCalledWith('/practice_schedules/schedule-1', {
        method: 'DELETE',
      });
    });

    it('fetchApiがエラーをスローした場合、エラーが伝播する', async () => {
      mockFetchApi.mockRejectedValue(new Error('Forbidden'));

      await expect(service.deletePracticeSchedule('schedule-1')).rejects.toThrow('Forbidden');
    });
  });
});
