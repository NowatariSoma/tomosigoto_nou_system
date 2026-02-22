import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScheduleTimeSlotService } from '@/features/practice-schedule-editor/services/schedule-time-slot-service';

// fetchApiをモック
const mockFetchApi = vi.fn();
vi.mock('@/lib/api', () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

describe('ScheduleTimeSlotService', () => {
  let service: ScheduleTimeSlotService;

  beforeEach(() => {
    service = new ScheduleTimeSlotService();
    vi.clearAllMocks();
  });

  // ヘルパー: レスポンスモックを作成
  function mockJsonResponse(data: unknown) {
    return { json: vi.fn().mockResolvedValue(data) };
  }

  const mockTimeSlotResponse = {
    id: 'ts-1',
    schedule_id: 'schedule-1',
    slot_order: 1,
    start_time: '09:00:00',
    end_time: '10:00:00',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  const mockTimeSlotResponse2 = {
    id: 'ts-2',
    schedule_id: 'schedule-1',
    slot_order: 2,
    start_time: '10:00:00',
    end_time: '11:00:00',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  describe('getTimeSlotsBySchedule', () => {
    it('指定したスケジュールの時間スロット一覧を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([mockTimeSlotResponse, mockTimeSlotResponse2]));

      const result = await service.getTimeSlotsBySchedule('schedule-1');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('ts-1');
      expect(result[1].id).toBe('ts-2');
      expect(mockFetchApi).toHaveBeenCalledWith('/schedule-time-slots/schedule/schedule-1');
    });

    it('404の場合は空配列を返す', async () => {
      const error: any = new Error('Not found');
      error.status = 404;
      mockFetchApi.mockRejectedValue(error);

      const result = await service.getTimeSlotsBySchedule('invalid-id');
      expect(result).toEqual([]);
    });

    it('404以外のエラーはスローする', async () => {
      const error: any = new Error('Server error');
      error.status = 500;
      mockFetchApi.mockRejectedValue(error);

      await expect(service.getTimeSlotsBySchedule('schedule-1')).rejects.toThrow('Server error');
    });
  });

  describe('updateTimeSlot', () => {
    it('時間スロットを更新する', async () => {
      const updatedSlot = { ...mockTimeSlotResponse, start_time: '09:30:00', end_time: '10:30:00' };
      mockFetchApi.mockResolvedValue(mockJsonResponse(updatedSlot));

      const result = await service.updateTimeSlot('ts-1', {
        start_time: '09:30:00',
        end_time: '10:30:00',
      });

      expect(result.start_time).toBe('09:30:00');
      expect(result.end_time).toBe('10:30:00');
      expect(mockFetchApi).toHaveBeenCalledWith('/schedule-time-slots/ts-1', {
        method: 'PUT',
        body: JSON.stringify({ start_time: '09:30:00', end_time: '10:30:00' }),
      });
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Update failed'));

      await expect(
        service.updateTimeSlot('ts-1', { start_time: '09:30:00', end_time: '10:30:00' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('createTimeSlotsBulk', () => {
    it('時間スロットを一括作成する', async () => {
      mockFetchApi.mockResolvedValue(undefined);

      const timeSlots = [
        { slot_order: 1, start_time: '09:00:00', end_time: '10:00:00' },
        { slot_order: 2, start_time: '10:00:00', end_time: '11:00:00' },
      ];

      await service.createTimeSlotsBulk('schedule-1', timeSlots);

      expect(mockFetchApi).toHaveBeenCalledWith('/schedule-time-slots/bulk', {
        method: 'POST',
        body: JSON.stringify({
          schedule_id: 'schedule-1',
          time_slots: timeSlots,
        }),
      });
    });

    it('空の配列でも正常に呼び出せる', async () => {
      mockFetchApi.mockResolvedValue(undefined);

      await service.createTimeSlotsBulk('schedule-1', []);

      const callBody = JSON.parse(mockFetchApi.mock.calls[0][1].body);
      expect(callBody.schedule_id).toBe('schedule-1');
      expect(callBody.time_slots).toEqual([]);
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Bulk creation failed'));

      await expect(
        service.createTimeSlotsBulk('schedule-1', [
          { slot_order: 1, start_time: '09:00:00', end_time: '10:00:00' },
        ])
      ).rejects.toThrow('Bulk creation failed');
    });
  });

  describe('deleteTimeSlotsBySchedule', () => {
    it('指定したスケジュールの時間スロットをすべて削除する', async () => {
      mockFetchApi.mockResolvedValue(undefined);

      await service.deleteTimeSlotsBySchedule('schedule-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/schedule-time-slots/schedule/schedule-1', {
        method: 'DELETE',
      });
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteTimeSlotsBySchedule('schedule-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('convertToTimeSlots', () => {
    it('DBの時間スロットをTimeSlot形式に変換する', () => {
      const dbSlots = [mockTimeSlotResponse, mockTimeSlotResponse2];

      const result = service.convertToTimeSlots(dbSlots);
      expect(result).toHaveLength(2);

      expect(result[0].id).toBe('ts-1');
      expect(result[0].slot_order).toBe(1);
      expect(result[0].time).toBe('09:00');
      expect(result[0].start_time).toBe('09:00');
      expect(result[0].end_time).toBe('10:00');
      expect(result[0].display_time).toBe('09:00-10:00');

      expect(result[1].id).toBe('ts-2');
      expect(result[1].slot_order).toBe(2);
      expect(result[1].time).toBe('10:00');
      expect(result[1].start_time).toBe('10:00');
      expect(result[1].end_time).toBe('11:00');
      expect(result[1].display_time).toBe('10:00-11:00');
    });

    it('空の配列を正常に処理する', () => {
      const result = service.convertToTimeSlots([]);
      expect(result).toEqual([]);
    });

    it('時間文字列をHH:MM形式に変換する（秒を除去）', () => {
      const dbSlots = [{
        ...mockTimeSlotResponse,
        start_time: '14:30:00',
        end_time: '15:45:00',
      }];

      const result = service.convertToTimeSlots(dbSlots);
      expect(result[0].start_time).toBe('14:30');
      expect(result[0].end_time).toBe('15:45');
    });
  });
});
