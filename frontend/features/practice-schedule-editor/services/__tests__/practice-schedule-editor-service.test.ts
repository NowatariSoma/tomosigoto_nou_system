import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PracticeScheduleEditorService } from '@/features/practice-schedule-editor/services/practice-schedule-editor-service';

// fetchApiをモック
const mockFetchApi = vi.fn();
vi.mock('@/lib/api', () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

describe('PracticeScheduleEditorService', () => {
  let service: PracticeScheduleEditorService;

  beforeEach(() => {
    service = new PracticeScheduleEditorService();
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  // ヘルパー: レスポンスモックを作成
  function mockJsonResponse(data: unknown) {
    return { json: vi.fn().mockResolvedValue(data) };
  }

  const mockBasicSchedule = {
    id: 'schedule-1',
    schedule_date: '2024-03-15',
    start_time: '09:00:00',
    end_time: '17:00:00',
    title: '練習日',
    description: '通常練習',
  };

  const mockDetailsResponse = {
    schedule_info: {
      id: 'schedule-1',
      schedule_date: '2024-03-15',
      start_time: '09:00:00',
      end_time: '17:00:00',
      title: '練習日',
      description: '通常練習',
    },
    venues: [
      {
        venue_id: 'venue-1',
        venue_name: '第1稽古場',
      },
    ],
    time_schedule: {
      '09:00': { 'venue-1': [] },
    },
  };

  describe('getBasicSchedule', () => {
    it('指定したスケジュールの基本情報を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockBasicSchedule));

      const result = await service.getBasicSchedule('schedule-1');
      expect(result.id).toBe('schedule-1');
      expect(result.title).toBe('練習日');
      expect(mockFetchApi).toHaveBeenCalledWith('/practice_schedules/schedule-1');
    });

    it('404の場合はnullを返す', async () => {
      const error: any = new Error('Not found');
      error.status = 404;
      mockFetchApi.mockRejectedValue(error);

      const result = await service.getBasicSchedule('invalid-id');
      expect(result).toBeNull();
    });

    it('404以外のエラーはスローする', async () => {
      const error: any = new Error('Server error');
      error.status = 500;
      mockFetchApi.mockRejectedValue(error);

      await expect(service.getBasicSchedule('schedule-1')).rejects.toThrow('Server error');
    });
  });

  describe('getScheduleDetails', () => {
    it('指定したスケジュールの詳細情報を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockDetailsResponse));

      const result = await service.getScheduleDetails('schedule-1');
      expect(result.schedule_info.id).toBe('schedule-1');
      expect(result.venues).toHaveLength(1);
      expect(mockFetchApi).toHaveBeenCalledWith('/practice_schedules/schedule-1/details');
    });

    it('404の場合は基本情報のみで空の詳細を返す', async () => {
      const error404: any = new Error('Not found');
      error404.status = 404;
      mockFetchApi
        .mockRejectedValueOnce(error404)
        .mockResolvedValueOnce(mockJsonResponse(mockBasicSchedule));

      const result = await service.getScheduleDetails('schedule-1');
      expect(result.schedule_info.id).toBe('schedule-1');
      expect(result.venues).toEqual([]);
      expect(result.time_schedule).toEqual({});
    });

    it('404で基本情報も取得できない場合はエラーをスローする', async () => {
      const error404: any = new Error('Not found');
      error404.status = 404;
      const error404Basic: any = new Error('Not found');
      error404Basic.status = 404;
      mockFetchApi
        .mockRejectedValueOnce(error404)
        .mockRejectedValueOnce(error404Basic);

      await expect(service.getScheduleDetails('invalid-id')).rejects.toThrow('スケジュールが見つかりません');
    });

    it('404以外のエラーはスローする', async () => {
      const error: any = new Error('Server error');
      error.status = 500;
      mockFetchApi.mockRejectedValue(error);

      await expect(service.getScheduleDetails('schedule-1')).rejects.toThrow('Server error');
    });
  });

  describe('getScheduleDetailsByDate', () => {
    it('指定した日付のスケジュール詳細を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockDetailsResponse));

      const result = await service.getScheduleDetailsByDate('2024-03-15');
      expect(result).not.toBeNull();
      expect(result!.schedule_info.schedule_date).toBe('2024-03-15');
      expect(mockFetchApi).toHaveBeenCalledWith('/practice_schedules/date/2024-03-15/details');
    });

    it('404の場合はnullを返す', async () => {
      const error: any = new Error('Not found');
      error.status = 404;
      mockFetchApi.mockRejectedValue(error);

      const result = await service.getScheduleDetailsByDate('2024-01-01');
      expect(result).toBeNull();
    });

    it('404以外のエラーはスローする', async () => {
      const error: any = new Error('Server error');
      error.status = 500;
      mockFetchApi.mockRejectedValue(error);

      await expect(service.getScheduleDetailsByDate('2024-03-15')).rejects.toThrow('Server error');
    });
  });

  describe('generateTimeSlots', () => {
    it('デフォルトの分割数（6）で時間スロットを生成する', () => {
      const slots = service.generateTimeSlots('09:00', '15:00');
      expect(slots).toHaveLength(6);
      expect(slots[0].start_time).toBe('09:00');
      expect(slots[0].end_time).toBe('10:00');
      expect(slots[0].display_time).toBe('09:00-10:00');
      expect(slots[5].end_time).toBe('15:00');
    });

    it('カスタム分割数で時間スロットを生成する', () => {
      const slots = service.generateTimeSlots('10:00', '14:00', 4);
      expect(slots).toHaveLength(4);
      expect(slots[0].start_time).toBe('10:00');
      expect(slots[0].end_time).toBe('11:00');
      expect(slots[3].end_time).toBe('14:00');
    });

    it('2分割で正しく生成する', () => {
      const slots = service.generateTimeSlots('09:00', '11:00', 2);
      expect(slots).toHaveLength(2);
      expect(slots[0].start_time).toBe('09:00');
      expect(slots[0].end_time).toBe('10:00');
      expect(slots[1].start_time).toBe('10:00');
      expect(slots[1].end_time).toBe('11:00');
    });

    it('time フィールドが start_time と一致する', () => {
      const slots = service.generateTimeSlots('09:00', '12:00', 3);
      for (const slot of slots) {
        expect(slot.time).toBe(slot.start_time);
      }
    });
  });

  describe('updateScheduleTime', () => {
    it('練習スケジュールの時間を更新する', async () => {
      mockFetchApi.mockResolvedValue(undefined);

      await service.updateScheduleTime('schedule-1', '09:00:00', '17:00:00');
      expect(mockFetchApi).toHaveBeenCalledWith('/practice_schedules/schedule-1', {
        method: 'PUT',
        body: JSON.stringify({ start_time: '09:00:00', end_time: '17:00:00' }),
      });
    });

    it('分割数を指定して更新する', async () => {
      mockFetchApi.mockResolvedValue(undefined);

      await service.updateScheduleTime('schedule-1', '09:00:00', '17:00:00', 8);
      const callBody = JSON.parse(mockFetchApi.mock.calls[0][1].body);
      expect(callBody.start_time).toBe('09:00:00');
      expect(callBody.end_time).toBe('17:00:00');
      expect(callBody.division_count).toBe(8);
    });

    it('分割数を指定しない場合はdivision_countが含まれない', async () => {
      mockFetchApi.mockResolvedValue(undefined);

      await service.updateScheduleTime('schedule-1', '09:00:00', '17:00:00');
      const callBody = JSON.parse(mockFetchApi.mock.calls[0][1].body);
      expect(callBody.division_count).toBeUndefined();
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Update failed'));

      await expect(
        service.updateScheduleTime('schedule-1', '09:00:00', '17:00:00')
      ).rejects.toThrow('Update failed');
    });
  });

  describe('getVenues', () => {
    it('会場一覧を取得しマッピングする', async () => {
      const mockVenues = [
        {
          id: 'venue-1',
          name: '第1稽古場',
          campus: '本部',
          is_preferred: true,
          priority: 1,
          notes: '広い部屋',
        },
      ];
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockVenues));

      const result = await service.getVenues();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('venue-1');
      expect(result[0].name).toBe('第1稽古場');
      expect(result[0].campus).toBe('本部');
      expect(result[0].is_preferred).toBe(true);
      expect(result[0].priority).toBe(1);
      expect(result[0].notes).toBe('広い部屋');
      expect(mockFetchApi).toHaveBeenCalledWith('/venues/');
    });

    it('is_preferred と priority のデフォルト値を設定する', async () => {
      const mockVenues = [
        {
          id: 'venue-1',
          name: '第1稽古場',
          campus: '本部',
        },
      ];
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockVenues));

      const result = await service.getVenues();
      expect(result[0].is_preferred).toBe(false);
      expect(result[0].priority).toBe(0);
    });

    it('配列以外のレスポンスは空配列を返す', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse({ error: 'invalid' }));

      const result = await service.getVenues();
      expect(result).toEqual([]);
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Network error'));

      await expect(service.getVenues()).rejects.toThrow('Network error');
    });
  });
});
