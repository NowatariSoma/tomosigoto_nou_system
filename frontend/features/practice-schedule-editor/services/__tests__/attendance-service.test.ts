import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttendanceService } from '@/features/practice-schedule-editor/services/attendance-service';

// fetchApiをモック
const mockFetchApi = vi.fn();
vi.mock('@/lib/api', () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

describe('AttendanceService', () => {
  let service: AttendanceService;

  beforeEach(() => {
    service = new AttendanceService();
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // ヘルパー: レスポンスモックを作成
  function mockJsonResponse(data: unknown, status = 200) {
    return { json: vi.fn().mockResolvedValue(data), status };
  }

  const mockAttendance = {
    id: 'att-1',
    user_id: 'user-1',
    practice_schedule_id: 'ps-1',
    status: 'present',
    user_name: '田中 太郎',
  };

  describe('getAttendancesByPractice', () => {
    it('指定した練習スケジュールの出席者一覧を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([mockAttendance]));

      const result = await service.getAttendancesByPractice('ps-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('att-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/attendance/practice/ps-1');
    });

    it('空の配列を返す場合も正常に動作する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([]));

      const result = await service.getAttendancesByPractice('ps-1');
      expect(result).toHaveLength(0);
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Network error'));

      await expect(service.getAttendancesByPractice('ps-1')).rejects.toThrow('Network error');
    });

    it('エラー時にconsole.errorが呼ばれる', async () => {
      mockFetchApi.mockRejectedValue(new Error('Network error'));

      await expect(service.getAttendancesByPractice('ps-1')).rejects.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getAttendances', () => {
    it('すべての出席者を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([mockAttendance]));

      const result = await service.getAttendances();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('att-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/attendance/');
    });

    it('空の配列を返す場合も正常に動作する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([]));

      const result = await service.getAttendances();
      expect(result).toHaveLength(0);
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Fetch error'));

      await expect(service.getAttendances()).rejects.toThrow('Fetch error');
    });

    it('エラー時にconsole.errorが呼ばれる', async () => {
      mockFetchApi.mockRejectedValue(new Error('Fetch error'));

      await expect(service.getAttendances()).rejects.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getAttendance', () => {
    it('指定したIDの出席者を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockAttendance));

      const result = await service.getAttendance('att-1');
      expect(result.id).toBe('att-1');
      expect(result.user_id).toBe('user-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/attendance/att-1');
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Not found'));

      await expect(service.getAttendance('invalid-id')).rejects.toThrow('Not found');
    });

    it('エラー時にconsole.errorが呼ばれる', async () => {
      mockFetchApi.mockRejectedValue(new Error('Not found'));

      await expect(service.getAttendance('invalid-id')).rejects.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getAttendancesByUser', () => {
    it('指定したユーザーの出席記録を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([mockAttendance]));

      const result = await service.getAttendancesByUser('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe('user-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/attendance/user/user-1');
    });

    it('空の配列を返す場合も正常に動作する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([]));

      const result = await service.getAttendancesByUser('user-1');
      expect(result).toHaveLength(0);
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('User not found'));

      await expect(service.getAttendancesByUser('invalid-user')).rejects.toThrow('User not found');
    });

    it('エラー時にconsole.errorが呼ばれる', async () => {
      mockFetchApi.mockRejectedValue(new Error('User not found'));

      await expect(service.getAttendancesByUser('invalid-user')).rejects.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
