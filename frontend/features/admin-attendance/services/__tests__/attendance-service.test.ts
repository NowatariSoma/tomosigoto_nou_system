import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminAttendanceService } from '@/features/admin-attendance/services/attendance-service';

// fetchApiをモック
const mockFetchApi = vi.fn();
vi.mock('@/lib/api', () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

describe('AdminAttendanceService', () => {
  let service: AdminAttendanceService;

  beforeEach(() => {
    service = new AdminAttendanceService();
    vi.clearAllMocks();
  });

  // ヘルパー: レスポンスモックを作成
  function mockJsonResponse(data: unknown) {
    return { json: vi.fn().mockResolvedValue(data) };
  }

  describe('getAttendancesByPractice', () => {
    it('練習スケジュールIDで出席一覧を取得する', async () => {
      const mockAttendances = [
        {
          id: 'att-1',
          practice_schedule_id: 'ps-1',
          user_id: 'user-1',
          status: 'present',
          notes: 'メモ',
          available_from: '10:00',
          available_to: '12:00',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'admin',
          updated_by: 'admin',
        },
        {
          id: 'att-2',
          practice_schedule_id: 'ps-1',
          user_id: 'user-2',
          status: 'absent',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'admin',
          updated_by: 'admin',
        },
      ];
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockAttendances));

      const result = await service.getAttendancesByPractice('ps-1');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('att-1');
      expect(result[0].status).toBe('present');
      expect(result[1].status).toBe('absent');
      expect(mockFetchApi).toHaveBeenCalledWith('/attendance/practice/ps-1');
    });

    it('APIエラー時に例外をスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Network error'));

      await expect(service.getAttendancesByPractice('ps-1')).rejects.toThrow('Network error');
    });
  });

  describe('getUsersWithAttendance', () => {
    it('パラメータなしでユーザー出席一覧を取得する', async () => {
      const mockData = [
        {
          user: { id: 'user-1', name: '田中太郎', email: 'tanaka@example.com' },
          attendance: null,
        },
      ];
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockData));

      const result = await service.getUsersWithAttendance();
      expect(result).toHaveLength(1);
      expect(result[0].user.name).toBe('田中太郎');
      expect(result[0].attendance).toBeNull();
      expect(mockFetchApi).toHaveBeenCalledWith('/attendance/admin/list');
    });

    it('practice_schedule_idパラメータ付きでリクエストする', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([]));

      await service.getUsersWithAttendance({ practice_schedule_id: 'ps-1' });
      expect(mockFetchApi).toHaveBeenCalledWith(
        '/attendance/admin/list?practice_schedule_id=ps-1'
      );
    });

    it('statusパラメータ付きでリクエストする', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([]));

      await service.getUsersWithAttendance({ status: 'present' });
      expect(mockFetchApi).toHaveBeenCalledWith(
        '/attendance/admin/list?status=present'
      );
    });

    it('user_nameパラメータ付きでリクエストする', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([]));

      await service.getUsersWithAttendance({ user_name: '田中' });
      expect(mockFetchApi).toHaveBeenCalledWith(
        expect.stringContaining('user_name=')
      );
    });

    it('pageとlimitパラメータ付きでリクエストする', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([]));

      await service.getUsersWithAttendance({ page: 2, limit: 10 });
      expect(mockFetchApi).toHaveBeenCalledWith(
        '/attendance/admin/list?page=2&limit=10'
      );
    });

    it('複数パラメータを組み合わせてリクエストする', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([]));

      await service.getUsersWithAttendance({
        practice_schedule_id: 'ps-1',
        status: 'present',
        page: 1,
        limit: 20,
      });
      const calledUrl = mockFetchApi.mock.calls[0][0] as string;
      expect(calledUrl).toContain('practice_schedule_id=ps-1');
      expect(calledUrl).toContain('status=present');
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).toContain('limit=20');
    });

    it('APIエラー時に例外をスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Unauthorized'));

      await expect(service.getUsersWithAttendance()).rejects.toThrow('Unauthorized');
    });
  });

  describe('bulkUpdateAttendances', () => {
    it('一括で出席を更新する', async () => {
      const attendancesToCreate = [
        {
          practice_schedule_id: 'ps-1',
          user_id: 'user-1',
          status: 'present' as const,
          notes: '出席',
        },
        {
          practice_schedule_id: 'ps-1',
          user_id: 'user-2',
          status: 'absent' as const,
        },
      ];
      const mockResult = [
        {
          id: 'att-1',
          practice_schedule_id: 'ps-1',
          user_id: 'user-1',
          status: 'present',
          notes: '出席',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'admin',
          updated_by: 'admin',
        },
        {
          id: 'att-2',
          practice_schedule_id: 'ps-1',
          user_id: 'user-2',
          status: 'absent',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'admin',
          updated_by: 'admin',
        },
      ];
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockResult));

      const result = await service.bulkUpdateAttendances('ps-1', attendancesToCreate);
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('present');
      expect(result[1].status).toBe('absent');
      expect(mockFetchApi).toHaveBeenCalledWith('/attendance/bulk/ps-1', {
        method: 'POST',
        body: JSON.stringify(attendancesToCreate),
      });
    });

    it('APIエラー時に例外をスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Server error'));

      await expect(
        service.bulkUpdateAttendances('ps-1', [])
      ).rejects.toThrow('Server error');
    });
  });

  describe('upsertAttendance', () => {
    it('出席を作成または更新する', async () => {
      const attendanceData = {
        practice_schedule_id: 'ps-1',
        user_id: 'user-1',
        status: 'late' as const,
        notes: '遅刻連絡あり',
        available_from: '10:30',
        available_to: '12:00',
      };
      const mockResult = {
        id: 'att-1',
        ...attendanceData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        created_by: 'admin',
        updated_by: 'admin',
      };
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockResult));

      const result = await service.upsertAttendance(attendanceData);
      expect(result.id).toBe('att-1');
      expect(result.status).toBe('late');
      expect(result.notes).toBe('遅刻連絡あり');
      expect(mockFetchApi).toHaveBeenCalledWith('/attendance/upsert', {
        method: 'POST',
        body: JSON.stringify(attendanceData),
      });
    });

    it('APIエラー時に例外をスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Validation error'));

      await expect(
        service.upsertAttendance({
          practice_schedule_id: 'ps-1',
          user_id: 'user-1',
          status: 'present',
        })
      ).rejects.toThrow('Validation error');
    });
  });
});
