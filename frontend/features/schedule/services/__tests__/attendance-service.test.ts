import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttendanceService } from '@/features/schedule/services/attendance-service';

// fetchApiをモック
const mockFetchApi = vi.fn();
vi.mock('@/lib/api', () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

const mockAttendance = {
  id: 'att-1',
  practice_schedule_id: 'ps-1',
  user_id: 'user-1',
  status: 'present' as const,
  notes: 'テスト',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  created_by: 'user-1',
  updated_by: 'user-1',
};

describe('AttendanceService', () => {
  let service: AttendanceService;

  beforeEach(() => {
    service = new AttendanceService();
    vi.clearAllMocks();
  });

  function mockJsonResponse(data: unknown) {
    return { json: vi.fn().mockResolvedValue(data) };
  }

  describe('getAttendances', () => {
    it('出席一覧を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([mockAttendance]));

      const result = await service.getAttendances();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('att-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/attendance/');
    });

    it('データがnullの場合は空配列を返す', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(null));

      const result = await service.getAttendances();
      expect(result).toEqual([]);
    });
  });

  describe('getAttendance', () => {
    it('単一の出席記録を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockAttendance));

      const result = await service.getAttendance('att-1');
      expect(result.id).toBe('att-1');
      expect(result.status).toBe('present');
      expect(mockFetchApi).toHaveBeenCalledWith('/attendance/att-1');
    });
  });

  describe('getAttendancesByUser', () => {
    it('ユーザーの出席記録を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([mockAttendance]));

      const result = await service.getAttendancesByUser('user-1');
      expect(result).toHaveLength(1);
      expect(mockFetchApi).toHaveBeenCalledWith('/attendance/user/user-1');
    });
  });

  describe('getAttendancesByPractice', () => {
    it('練習ごとの出席記録を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([mockAttendance]));

      const result = await service.getAttendancesByPractice('ps-1');
      expect(result).toHaveLength(1);
      expect(mockFetchApi).toHaveBeenCalledWith('/attendance/practice/ps-1');
    });
  });

  describe('createAttendance', () => {
    it('出席記録を作成する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockAttendance));

      const result = await service.createAttendance({
        practice_schedule_id: 'ps-1',
        user_id: 'user-1',
        status: 'present',
      });
      expect(result.id).toBe('att-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/attendance/', {
        method: 'POST',
        body: expect.any(String),
      });
    });
  });

  describe('updateAttendance', () => {
    it('出席記録を更新する', async () => {
      const updated = { ...mockAttendance, status: 'absent' as const };
      mockFetchApi.mockResolvedValue(mockJsonResponse(updated));

      const result = await service.updateAttendance('att-1', { status: 'absent' });
      expect(result.status).toBe('absent');
      expect(mockFetchApi).toHaveBeenCalledWith('/attendance/att-1', {
        method: 'PUT',
        body: expect.any(String),
      });
    });
  });

  describe('upsertAttendance', () => {
    it('出席記録をupsertする', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockAttendance));

      const result = await service.upsertAttendance({
        practice_schedule_id: 'ps-1',
        user_id: 'user-1',
        status: 'present',
      });
      expect(result.id).toBe('att-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/attendance/upsert', {
        method: 'POST',
        body: expect.any(String),
      });
    });
  });

  describe('deleteAttendance', () => {
    it('出席記録を削除する', async () => {
      mockFetchApi.mockResolvedValue(undefined);

      await service.deleteAttendance('att-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/attendance/att-1', {
        method: 'DELETE',
      });
    });
  });
});
