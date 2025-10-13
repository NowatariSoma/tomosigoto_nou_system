import { useState, useEffect, useCallback } from 'react';
import { 
  practiceScheduleService, 
  CalendarEvent, 
  MonthCalendarResponse 
} from '../../attendance/services/practice-schedule-service';

export interface UsePracticeScheduleCalendarReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  currentYear: number;
  currentMonth: number;
  totalCount: number;
  fetchMonthSchedules: (year: number, month: number) => Promise<void>;
  fetchCurrentMonth: () => Promise<void>;
  refreshSchedules: () => Promise<void>;
}

/**
 * 練習スケジュールのカレンダー表示用フック
 */
export function usePracticeScheduleCalendar(): UsePracticeScheduleCalendarReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [totalCount, setTotalCount] = useState(0);

  /**
   * 指定月の練習スケジュールを取得
   */
  const fetchMonthSchedules = useCallback(async (year: number, month: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: MonthCalendarResponse = await practiceScheduleService.getPracticeSchedulesForMonthCalendar(year, month);
      setEvents(response.events);
      setTotalCount(response.total_count);
      setCurrentYear(year);
      setCurrentMonth(month);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '練習スケジュールの取得に失敗しました';
      setError(errorMessage);
      console.error('Failed to fetch practice schedules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 現在月の練習スケジュールを取得
   */
  const fetchCurrentMonth = useCallback(async () => {
    const now = new Date();
    await fetchMonthSchedules(now.getFullYear(), now.getMonth() + 1);
  }, [fetchMonthSchedules]);

  /**
   * 現在表示中の月のスケジュールを再取得
   */
  const refreshSchedules = useCallback(async () => {
    await fetchMonthSchedules(currentYear, currentMonth);
  }, [fetchMonthSchedules, currentYear, currentMonth]);

  // 初回読み込み時に現在月のスケジュールを取得
  useEffect(() => {
    fetchCurrentMonth();
  }, [fetchCurrentMonth]);

  return {
    events,
    loading,
    error,
    currentYear,
    currentMonth,
    totalCount,
    fetchMonthSchedules,
    fetchCurrentMonth,
    refreshSchedules,
  };
}

/**
 * 練習スケジュールをスケジューラー用のイベント形式に変換するフック
 */
export function usePracticeScheduleEvents() {
  const {
    events,
    loading,
    error,
    currentYear,
    currentMonth,
    totalCount,
    fetchMonthSchedules,
    fetchCurrentMonth,
    refreshSchedules,
  } = usePracticeScheduleCalendar();

  // カレンダーイベントをスケジューラー用のEvent形式に変換
  const schedulerEvents = events.map(event => 
    practiceScheduleService.convertCalendarEventToSchedulerEvent(event)
  );

  return {
    events: schedulerEvents,
    rawEvents: events,
    loading,
    error,
    currentYear,
    currentMonth,
    totalCount,
    fetchMonthSchedules,
    fetchCurrentMonth,
    refreshSchedules,
  };
}
