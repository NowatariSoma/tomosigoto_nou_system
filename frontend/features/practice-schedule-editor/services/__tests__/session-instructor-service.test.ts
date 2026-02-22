import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionInstructorService } from '@/features/practice-schedule-editor/services/session-instructor-service';

// fetchApiをモック
const mockFetchApi = vi.fn();
vi.mock('@/lib/api', () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

describe('SessionInstructorService', () => {
  let service: SessionInstructorService;

  beforeEach(() => {
    service = new SessionInstructorService();
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // ヘルパー: レスポンスモックを作成
  function mockJsonResponse(data: unknown, status = 200) {
    return { json: vi.fn().mockResolvedValue(data), status, ok: true };
  }

  const mockSessionInstructor = {
    id: 'si-1',
    attendance_id: 'att-1',
    schedule_id: 'schedule-1',
    schedule_available_venue_id: 'sav-1',
    slot_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  const mockSessionInstructorWithDetails = {
    ...mockSessionInstructor,
    user_name: '田中 太郎',
    user_email: 'tanaka@example.com',
    venue_name: '第1稽古場',
    schedule_date: '2024-03-15',
    schedule_title: '通常練習',
    part_name: 'シテ',
  };

  describe('getSessionInstructors', () => {
    it('パラメータなしでセッション指導者一覧を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([mockSessionInstructorWithDetails]));

      const result = await service.getSessionInstructors();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('si-1');
      expect(result[0].user_name).toBe('田中 太郎');
      expect(mockFetchApi).toHaveBeenCalledWith('/session-instructors/');
    });

    it('scheduleIdでフィルタして取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([mockSessionInstructorWithDetails]));

      await service.getSessionInstructors('schedule-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/session-instructors/?schedule_id=schedule-1');
    });

    it('scheduleIdとslotOrderでフィルタして取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([mockSessionInstructorWithDetails]));

      await service.getSessionInstructors('schedule-1', 2);
      expect(mockFetchApi).toHaveBeenCalledWith(
        '/session-instructors/?schedule_id=schedule-1&slot_order=2'
      );
    });

    it('slotOrderが0の場合もフィルタに含まれる', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([]));

      await service.getSessionInstructors('schedule-1', 0);
      expect(mockFetchApi).toHaveBeenCalledWith(
        '/session-instructors/?schedule_id=schedule-1&slot_order=0'
      );
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Network error'));

      await expect(service.getSessionInstructors()).rejects.toThrow('Network error');
    });

    it('エラー時にconsole.errorが呼ばれる', async () => {
      mockFetchApi.mockRejectedValue(new Error('Network error'));

      await expect(service.getSessionInstructors()).rejects.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getSessionInstructor', () => {
    it('指定したIDのセッション指導者を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockSessionInstructor));

      const result = await service.getSessionInstructor('si-1');
      expect(result.id).toBe('si-1');
      expect(result.attendance_id).toBe('att-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/session-instructors/si-1');
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Not found'));

      await expect(service.getSessionInstructor('invalid-id')).rejects.toThrow('Not found');
    });
  });

  describe('getSessionInstructorsBySchedule', () => {
    it('指定したスケジュールの指導者一覧を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([mockSessionInstructor]));

      const result = await service.getSessionInstructorsBySchedule('schedule-1');
      expect(result).toHaveLength(1);
      expect(result[0].schedule_id).toBe('schedule-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/session-instructors/schedule/schedule-1');
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Fetch error'));

      await expect(service.getSessionInstructorsBySchedule('schedule-1')).rejects.toThrow('Fetch error');
    });
  });

  describe('getSessionInstructorsByScheduleAndSlot', () => {
    it('指定したスケジュールとコマの指導者一覧を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([mockSessionInstructor]));

      const result = await service.getSessionInstructorsByScheduleAndSlot('schedule-1', 2);
      expect(result).toHaveLength(1);
      expect(mockFetchApi).toHaveBeenCalledWith('/session-instructors/schedule/schedule-1/slot/2');
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Fetch error'));

      await expect(
        service.getSessionInstructorsByScheduleAndSlot('schedule-1', 2)
      ).rejects.toThrow('Fetch error');
    });
  });

  describe('getSessionInstructorsByAttendance', () => {
    it('指定した出席IDの指導者割り当て一覧を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([mockSessionInstructor]));

      const result = await service.getSessionInstructorsByAttendance('att-1');
      expect(result).toHaveLength(1);
      expect(result[0].attendance_id).toBe('att-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/session-instructors/attendance/att-1');
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Fetch error'));

      await expect(service.getSessionInstructorsByAttendance('att-1')).rejects.toThrow('Fetch error');
    });
  });

  describe('createSessionInstructor', () => {
    it('セッション指導者を作成する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockSessionInstructor));

      const data = {
        attendance_id: 'att-1',
        schedule_id: 'schedule-1',
        schedule_available_venue_id: 'sav-1',
        slot_order: 1,
      };

      const result = await service.createSessionInstructor(data);
      expect(result.id).toBe('si-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/session-instructors/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Creation failed'));

      await expect(
        service.createSessionInstructor({
          attendance_id: 'att-1',
          schedule_id: 'schedule-1',
          slot_order: 1,
        })
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('createSessionInstructorsBulk', () => {
    it('セッション指導者を一括作成する', async () => {
      const bulkResponse = {
        created_count: 2,
        created_items: [mockSessionInstructor],
        errors: [],
      };
      mockFetchApi.mockResolvedValue(mockJsonResponse(bulkResponse));

      const data = {
        schedule_id: 'schedule-1',
        schedule_available_venue_id: 'sav-1',
        slot_order: 1,
        attendance_ids: ['att-1', 'att-2'],
      };

      const result = await service.createSessionInstructorsBulk(data);
      expect(result.created_count).toBe(2);
      expect(result.errors).toEqual([]);
      expect(mockFetchApi).toHaveBeenCalledWith('/session-instructors/bulk', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Bulk creation failed'));

      await expect(
        service.createSessionInstructorsBulk({
          schedule_id: 'schedule-1',
          slot_order: 1,
          attendance_ids: ['att-1'],
        })
      ).rejects.toThrow('Bulk creation failed');
    });
  });

  describe('updateSessionInstructor', () => {
    it('セッション指導者を更新する', async () => {
      const updatedInstructor = { ...mockSessionInstructor, slot_order: 3 };
      mockFetchApi.mockResolvedValue(mockJsonResponse(updatedInstructor));

      const result = await service.updateSessionInstructor('si-1', { slot_order: 3 });
      expect(result.slot_order).toBe(3);
      expect(mockFetchApi).toHaveBeenCalledWith('/session-instructors/si-1', {
        method: 'PUT',
        body: JSON.stringify({ slot_order: 3 }),
      });
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Update failed'));

      await expect(
        service.updateSessionInstructor('si-1', { slot_order: 3 })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteSessionInstructor', () => {
    it('セッション指導者を削除する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse({ message: '削除しました' }));

      const result = await service.deleteSessionInstructor('si-1');
      expect(result.message).toBe('削除しました');
      expect(mockFetchApi).toHaveBeenCalledWith('/session-instructors/si-1', {
        method: 'DELETE',
      });
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteSessionInstructor('si-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('deleteSessionInstructorsBySchedule', () => {
    it('指定したスケジュールの指導者割り当てをすべて削除する', async () => {
      mockFetchApi.mockResolvedValue(
        mockJsonResponse({ message: '削除しました', deleted_count: 5 })
      );

      const result = await service.deleteSessionInstructorsBySchedule('schedule-1');
      expect(result.deleted_count).toBe(5);
      expect(mockFetchApi).toHaveBeenCalledWith('/session-instructors/schedule/schedule-1', {
        method: 'DELETE',
      });
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Delete failed'));

      await expect(
        service.deleteSessionInstructorsBySchedule('schedule-1')
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('deleteSessionInstructorsByScheduleAndSlot', () => {
    it('指定したスケジュールとコマの指導者割り当てをすべて削除する', async () => {
      mockFetchApi.mockResolvedValue(
        mockJsonResponse({ message: '削除しました', deleted_count: 2 })
      );

      const result = await service.deleteSessionInstructorsByScheduleAndSlot('schedule-1', 3);
      expect(result.deleted_count).toBe(2);
      expect(mockFetchApi).toHaveBeenCalledWith('/session-instructors/schedule/schedule-1/slot/3', {
        method: 'DELETE',
      });
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Delete failed'));

      await expect(
        service.deleteSessionInstructorsByScheduleAndSlot('schedule-1', 3)
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('getInstructorsForSlot', () => {
    it('指定したスケジュールとコマの指導者情報を取得する（getSessionInstructorsを呼び出す）', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([mockSessionInstructorWithDetails]));

      const result = await service.getInstructorsForSlot('schedule-1', 2);
      expect(result).toHaveLength(1);
      expect(result[0].user_name).toBe('田中 太郎');
      expect(mockFetchApi).toHaveBeenCalledWith(
        '/session-instructors/?schedule_id=schedule-1&slot_order=2'
      );
    });
  });

  describe('getInstructorCandidates', () => {
    it('インストラクター候補を取得する', async () => {
      const mockCandidates = [
        {
          user_id: 'user-1',
          email: 'tanaka@example.com',
          first_name_kanji: '太郎',
          last_name_kanji: '田中',
          student_id: 'S001',
          grade: 3,
          attendance_id: 'att-1',
          attendance_status: 'present',
        },
      ];
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockCandidates));

      const result = await service.getInstructorCandidates('ps-1');
      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe('user-1');
      expect(result[0].last_name_kanji).toBe('田中');
      expect(mockFetchApi).toHaveBeenCalledWith(
        '/session-instructors/candidates?practice_schedule_id=ps-1'
      );
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Candidates fetch failed'));

      await expect(service.getInstructorCandidates('ps-1')).rejects.toThrow(
        'Candidates fetch failed'
      );
    });

    it('エラー時にconsole.errorが呼ばれる', async () => {
      mockFetchApi.mockRejectedValue(new Error('Candidates fetch failed'));

      await expect(service.getInstructorCandidates('ps-1')).rejects.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('moveSessionInstructor', () => {
    it('インストラクターを別の会場・時限に移動する', async () => {
      const movedInstructor = {
        ...mockSessionInstructor,
        schedule_available_venue_id: 'sav-2',
        slot_order: 3,
      };
      mockFetchApi.mockResolvedValue(mockJsonResponse(movedInstructor));

      const result = await service.moveSessionInstructor('si-1', 'sav-2', 3);
      expect(result.schedule_available_venue_id).toBe('sav-2');
      expect(result.slot_order).toBe(3);
      expect(mockFetchApi).toHaveBeenCalledWith(
        '/session-instructors/si-1/move?target_venue_id=sav-2&target_slot_order=3',
        { method: 'PUT' }
      );
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Move failed'));

      await expect(service.moveSessionInstructor('si-1', 'sav-2', 3)).rejects.toThrow(
        'Move failed'
      );
    });
  });
});
