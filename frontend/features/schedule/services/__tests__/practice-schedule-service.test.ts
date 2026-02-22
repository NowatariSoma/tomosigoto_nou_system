import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PracticeScheduleService } from '@/features/schedule/services/practice-schedule-service';

// fetchApiをモック
const mockFetchApi = vi.fn();
vi.mock('@/lib/api', () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

describe('PracticeScheduleService', () => {
  let service: PracticeScheduleService;

  beforeEach(() => {
    service = new PracticeScheduleService();
    vi.clearAllMocks();
  });

  function mockJsonResponse(data: unknown) {
    return { json: vi.fn().mockResolvedValue(data) };
  }

  describe('getPracticeScheduleByDate', () => {
    it('指定した日付のスケジュールを取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse({
        id: 'schedule-1',
        schedule_date: '2024-03-15',
        start_time: '09:00',
        end_time: '17:00',
      }));

      const result = await service.getPracticeScheduleByDate('2024-03-15');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('schedule-1');
      expect(mockFetchApi).toHaveBeenCalledWith('/practice_schedules/date/2024-03-15');
    });

    it('404の場合はnullを返す', async () => {
      mockFetchApi.mockRejectedValue({ status: 404 });

      const result = await service.getPracticeScheduleByDate('2024-03-20');
      expect(result).toBeNull();
    });

    it('404以外のエラーはスローする', async () => {
      mockFetchApi.mockRejectedValue({ status: 500, message: 'Server error' });

      await expect(service.getPracticeScheduleByDate('2024-03-20')).rejects.toEqual(
        { status: 500, message: 'Server error' }
      );
    });
  });

  describe('getAllPracticeSchedules', () => {
    it('全スケジュールを取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([
        { id: 's1', schedule_date: '2024-03-15', start_time: '09:00', end_time: '17:00' },
        { id: 's2', schedule_date: '2024-03-22', start_time: '09:00', end_time: '17:00' },
      ]));

      const result = await service.getAllPracticeSchedules();
      expect(result).toHaveLength(2);
      expect(mockFetchApi).toHaveBeenCalledWith('/practice_schedules/');
    });
  });

  describe('getNextPracticeScheduleDate', () => {
    it('次の練習日を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([
        { id: 's1', schedule_date: '2024-03-10', start_time: '09:00', end_time: '17:00' },
        { id: 's2', schedule_date: '2024-03-20', start_time: '09:00', end_time: '17:00' },
        { id: 's3', schedule_date: '2024-03-25', start_time: '09:00', end_time: '17:00' },
      ]));

      const result = await service.getNextPracticeScheduleDate('2024-03-15');
      expect(result).toBe('2024-03-20');
    });

    it('次の練習日がない場合はnullを返す', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([
        { id: 's1', schedule_date: '2024-03-01', start_time: '09:00', end_time: '17:00' },
      ]));

      const result = await service.getNextPracticeScheduleDate('2024-03-15');
      expect(result).toBeNull();
    });

    it('API失敗時はnullを返す', async () => {
      mockFetchApi.mockRejectedValue(new Error('Network error'));

      const result = await service.getNextPracticeScheduleDate('2024-03-15');
      expect(result).toBeNull();
    });
  });

  describe('getPreviousPracticeScheduleDate', () => {
    it('前の練習日を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([
        { id: 's1', schedule_date: '2024-03-05', start_time: '09:00', end_time: '17:00' },
        { id: 's2', schedule_date: '2024-03-10', start_time: '09:00', end_time: '17:00' },
        { id: 's3', schedule_date: '2024-03-20', start_time: '09:00', end_time: '17:00' },
      ]));

      const result = await service.getPreviousPracticeScheduleDate('2024-03-15');
      expect(result).toBe('2024-03-10');
    });
  });

  describe('getPracticeScheduleIdealFormat', () => {
    it('理想形式のスケジュールを取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse({
        schedule_info: {
          id: 'schedule-1',
          schedule_date: '2024-03-15',
          start_time: '09:00',
          end_time: '17:00',
          description: 'テスト練習',
        },
        venues: [
          { id: 'v1', name: '会場A', priority: 1, color: '#FF0000' },
        ],
        time_schedule: {},
      }));

      const result = await service.getPracticeScheduleIdealFormat('2024-03-15');
      expect(result).not.toBeNull();
      expect(result!.schedule_info.id).toBe('schedule-1');
      expect(result!.venues).toHaveLength(1);
    });

    it('404の場合はnullを返す', async () => {
      mockFetchApi.mockRejectedValue({ status: 404 });

      const result = await service.getPracticeScheduleIdealFormat('2024-03-20');
      expect(result).toBeNull();
    });
  });

  describe('convertCalendarEventToSchedulerEvent', () => {
    it('CalendarEventをスケジューラーイベントに変換する', () => {
      const calendarEvent = {
        id: 'event-1',
        title: '練習A',
        date: '2024-03-15',
        start_time: '09:00',
        end_time: '17:00',
        description: 'テスト',
        schedule_type: 'regular',
        status: 'scheduled',
        venues: ['会場A'],
        session_count: 2,
        division_count: 1,
        color: '#FF0000',
        is_all_day: false,
        category: 'practice',
      };

      const result = service.convertCalendarEventToSchedulerEvent(calendarEvent);
      expect(result.id).toBe('event-1');
      expect(result.title).toBe('練習A');
      expect(result.variant).toBe('primary');
      expect(result.metadata.venues).toEqual(['会場A']);
    });

    it('特殊なスケジュールタイプのバリアントを返す', () => {
      const calendarEvent = {
        id: 'event-2',
        title: 'イベント',
        date: '2024-03-15',
        start_time: '09:00',
        end_time: '17:00',
        schedule_type: 'special',
        status: 'scheduled',
        venues: [],
        session_count: 1,
        division_count: 1,
        color: '#00FF00',
        is_all_day: false,
        category: 'event',
      };

      const result = service.convertCalendarEventToSchedulerEvent(calendarEvent);
      expect(result.variant).toBe('success');
    });
  });

  describe('getPracticeSchedulesForMonthCalendar', () => {
    it('月別カレンダーデータを取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse({
        year: 2024,
        month: 3,
        events: [],
        total_count: 0,
      }));

      const result = await service.getPracticeSchedulesForMonthCalendar(2024, 3);
      expect(result.year).toBe(2024);
      expect(result.month).toBe(3);
      expect(result.events).toEqual([]);
    });
  });

  describe('getPracticeScheduleBundle', () => {
    it('bundle データを取得する', async () => {
      const bundleData = {
        schedule: { id: 's1', schedule_date: '2024-03-15', venues: [] },
        ideal: null,
        attendance: { entries: [], my_entry: null },
        users: [],
        meta: { generated_at: '2024-03-15T00:00:00Z', version: 1 },
      };
      mockFetchApi.mockResolvedValue(mockJsonResponse(bundleData));

      const result = await service.getPracticeScheduleBundle('2024-03-15');
      expect(result.schedule.id).toBe('s1');
      expect(mockFetchApi).toHaveBeenCalledWith('/practice_schedules/date/2024-03-15/bundle');
    });
  });
});
