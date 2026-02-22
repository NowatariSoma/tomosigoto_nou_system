import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScheduleAvailableVenueService } from '@/features/practice-schedule-editor/services/schedule-available-venue-service';

// fetchApiをモック
const mockFetchApi = vi.fn();
vi.mock('@/lib/api', () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

describe('ScheduleAvailableVenueService', () => {
  let service: ScheduleAvailableVenueService;

  beforeEach(() => {
    service = new ScheduleAvailableVenueService();
    vi.clearAllMocks();
  });

  // ヘルパー: レスポンスモックを作成
  function mockJsonResponse(data: unknown) {
    return { json: vi.fn().mockResolvedValue(data) };
  }

  const mockVenue = {
    id: 'sav-1',
    schedule_id: 'schedule-1',
    venue_id: 'venue-1',
    is_preferred: true,
    priority: 1,
    notes: '広い部屋',
    venue_name: '第1稽古場',
    venue_address: '東京都渋谷区',
    venue_capacity: 50,
  };

  const mockVenue2 = {
    id: 'sav-2',
    schedule_id: 'schedule-1',
    venue_id: 'venue-2',
    is_preferred: false,
    priority: 2,
    notes: undefined,
    venue_name: '第2稽古場',
  };

  describe('getBySchedule', () => {
    it('指定したスケジュールの利用可能会場一覧を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([mockVenue, mockVenue2]));

      const result = await service.getBySchedule('schedule-1');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('sav-1');
      expect(result[0].venue_name).toBe('第1稽古場');
      expect(result[0].is_preferred).toBe(true);
      expect(result[1].id).toBe('sav-2');
      expect(mockFetchApi).toHaveBeenCalledWith('/schedule-available-venues/schedule/schedule-1');
    });

    it('空の配列を返す場合も正常に動作する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([]));

      const result = await service.getBySchedule('schedule-1');
      expect(result).toHaveLength(0);
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Network error'));

      await expect(service.getBySchedule('schedule-1')).rejects.toThrow('Network error');
    });
  });

  describe('create', () => {
    it('スケジュール利用可能会場を作成する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockVenue));

      const data = {
        schedule_id: 'schedule-1',
        venue_id: 'venue-1',
        is_preferred: true,
        priority: 1,
        notes: '広い部屋',
      };

      const result = await service.create(data);
      expect(result.id).toBe('sav-1');
      expect(result.venue_id).toBe('venue-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/schedule-available-venues/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });

    it('オプションフィールドなしでも作成できる', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockVenue));

      const data = {
        schedule_id: 'schedule-1',
        venue_id: 'venue-1',
      };

      await service.create(data);
      expect(mockFetchApi).toHaveBeenCalledWith('/schedule-available-venues/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Creation failed'));

      await expect(
        service.create({ schedule_id: 'schedule-1', venue_id: 'venue-1' })
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('createBulk', () => {
    it('スケジュール利用可能会場を一括作成する', async () => {
      const bulkResponse = {
        created_count: 2,
        created_items: [mockVenue, mockVenue2],
        errors: [],
      };
      mockFetchApi.mockResolvedValue(mockJsonResponse(bulkResponse));

      const data = {
        schedule_id: 'schedule-1',
        venues: [
          { venue_id: 'venue-1', is_preferred: true, priority: 1 },
          { venue_id: 'venue-2', is_preferred: false, priority: 2 },
        ],
      };

      const result = await service.createBulk(data);
      expect(result.created_count).toBe(2);
      expect(result.errors).toEqual([]);
      expect(mockFetchApi).toHaveBeenCalledWith('/schedule-available-venues/bulk', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });

    it('エラーを含むレスポンスも正常に処理する', async () => {
      const bulkResponse = {
        created_count: 1,
        created_items: [mockVenue],
        errors: ['venue-2: 既に登録されています'],
      };
      mockFetchApi.mockResolvedValue(mockJsonResponse(bulkResponse));

      const data = {
        schedule_id: 'schedule-1',
        venues: [
          { venue_id: 'venue-1' },
          { venue_id: 'venue-2' },
        ],
      };

      const result = await service.createBulk(data);
      expect(result.created_count).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Bulk creation failed'));

      await expect(
        service.createBulk({
          schedule_id: 'schedule-1',
          venues: [{ venue_id: 'venue-1' }],
        })
      ).rejects.toThrow('Bulk creation failed');
    });
  });

  describe('delete', () => {
    it('スケジュール利用可能会場を削除する', async () => {
      mockFetchApi.mockResolvedValue(undefined);

      await service.delete('sav-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/schedule-available-venues/sav-1', {
        method: 'DELETE',
      });
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Delete failed'));

      await expect(service.delete('sav-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('deleteBySchedule', () => {
    it('指定したスケジュールの利用可能会場をすべて削除する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse({ deleted_count: 3 }));

      const result = await service.deleteBySchedule('schedule-1');
      expect(result.deleted_count).toBe(3);
      expect(mockFetchApi).toHaveBeenCalledWith('/schedule-available-venues/schedule/schedule-1', {
        method: 'DELETE',
      });
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteBySchedule('schedule-1')).rejects.toThrow('Delete failed');
    });
  });
});
