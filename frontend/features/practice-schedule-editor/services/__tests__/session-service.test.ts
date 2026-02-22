import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionService } from '@/features/practice-schedule-editor/services/session-service';

// fetchApiをモック
const mockFetchApi = vi.fn();
vi.mock('@/lib/api', () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    service = new SessionService();
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  // ヘルパー: レスポンスモックを作成
  function mockJsonResponse(data: unknown) {
    return { json: vi.fn().mockResolvedValue(data) };
  }

  const mockSessionApiResponse = {
    id: 'session-1',
    schedule_id: 'schedule-1',
    part_id: 'part-1',
    part_name: 'シテ',
    slot_order: 1,
    schedule_available_venue_id: 'sav-1',
    priority: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  describe('getSessionsBySchedule', () => {
    it('指定したスケジュールのセッション一覧を取得しマッピングする', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([mockSessionApiResponse]));

      const result = await service.getSessionsBySchedule('schedule-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('session-1');
      expect(result[0].schedule_id).toBe('schedule-1');
      expect(result[0].part_name).toBe('シテ');
      expect(result[0].slot_order).toBe(1);
      expect(mockFetchApi).toHaveBeenCalledWith('/practice_schedules/schedule-1/sessions');
    });

    it('空の配列を返す場合も正常に動作する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([]));

      const result = await service.getSessionsBySchedule('schedule-1');
      expect(result).toHaveLength(0);
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Network error'));

      await expect(service.getSessionsBySchedule('schedule-1')).rejects.toThrow('Network error');
    });
  });

  describe('getSession', () => {
    it('指定したIDのセッションを取得しマッピングする', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockSessionApiResponse));

      const result = await service.getSession('session-1');
      expect(result.id).toBe('session-1');
      expect(result.part_id).toBe('part-1');
      expect(result.priority).toBe(2);
      expect(mockFetchApi).toHaveBeenCalledWith('/practice_schedules/sessions/session-1');
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Not found'));

      await expect(service.getSession('invalid-id')).rejects.toThrow('Not found');
    });
  });

  describe('createSession', () => {
    it('新しいセッションを作成しマッピングされた結果を返す', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockSessionApiResponse));

      const result = await service.createSession({
        schedule_id: 'schedule-1',
        slot_order: 1,
        priority: 2,
        part_id: 'part-1',
        venue_id: 'venue-1',
        schedule_available_venue_id: 'sav-1',
      });

      expect(result.id).toBe('session-1');
      expect(result.schedule_id).toBe('schedule-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/practice_schedules/sessions', {
        method: 'POST',
        body: expect.stringContaining('"schedule_id":"schedule-1"'),
      });
    });

    it('オプションフィールドなしでもセッションを作成できる', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockSessionApiResponse));

      await service.createSession({
        schedule_id: 'schedule-1',
        slot_order: 1,
        priority: 0,
      });

      const callBody = JSON.parse(mockFetchApi.mock.calls[0][1].body);
      expect(callBody.schedule_id).toBe('schedule-1');
      expect(callBody.slot_order).toBe(1);
      expect(callBody.priority).toBe(0);
      expect(callBody.part_id).toBeUndefined();
      expect(callBody.venue_id).toBeUndefined();
      expect(callBody.schedule_available_venue_id).toBeUndefined();
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Creation failed'));

      await expect(service.createSession({
        schedule_id: 'schedule-1',
        slot_order: 1,
        priority: 0,
      })).rejects.toThrow('Creation failed');
    });
  });

  describe('updateSession', () => {
    it('セッションを更新しマッピングされた結果を返す', async () => {
      const updatedResponse = { ...mockSessionApiResponse, part_id: 'part-2', part_name: 'ワキ' };
      mockFetchApi.mockResolvedValue(mockJsonResponse(updatedResponse));

      const result = await service.updateSession('session-1', {
        part_id: 'part-2',
        slot_order: 2,
      });

      expect(result.part_id).toBe('part-2');
      expect(result.part_name).toBe('ワキ');
      expect(mockFetchApi).toHaveBeenCalledWith('/practice_schedules/sessions/session-1', {
        method: 'PUT',
        body: expect.any(String),
      });
    });

    it('部分的な更新でも正常に動作する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockSessionApiResponse));

      await service.updateSession('session-1', { priority: 5 });

      const callBody = JSON.parse(mockFetchApi.mock.calls[0][1].body);
      expect(callBody.priority).toBe(5);
      expect(callBody.part_id).toBeUndefined();
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Update failed'));

      await expect(service.updateSession('session-1', { priority: 5 })).rejects.toThrow('Update failed');
    });
  });

  describe('deleteSession', () => {
    it('セッションを削除する', async () => {
      mockFetchApi.mockResolvedValue(undefined);

      await service.deleteSession('session-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/practice_schedules/sessions/session-1', {
        method: 'DELETE',
      });
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteSession('session-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('moveSession', () => {
    it('セッションの位置を変更する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockSessionApiResponse));

      const result = await service.moveSession('session-1', 'venue-2', 3);

      expect(result.id).toBe('session-1');
      expect(mockFetchApi).toHaveBeenCalledWith(
        '/practice_schedules/sessions/session-1/move?target_venue_id=venue-2&target_slot_order=3',
        { method: 'PUT' }
      );
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Move failed'));

      await expect(service.moveSession('session-1', 'venue-2', 3)).rejects.toThrow('Move failed');
    });
  });
});
