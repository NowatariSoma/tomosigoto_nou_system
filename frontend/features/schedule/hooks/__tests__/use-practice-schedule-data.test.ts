import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  usePracticeSchedule,
  usePracticeScheduleDetails,
  useIdealSchedule,
} from '@/features/schedule/hooks/use-practice-schedule-data';

// practiceScheduleServiceをモック
const mockGetPracticeScheduleByDate = vi.fn();
const mockGetPracticeScheduleDetails = vi.fn();
const mockGetPracticeScheduleIdealFormat = vi.fn();

vi.mock('@/features/schedule/services/practice-schedule-service', () => ({
  practiceScheduleService: {
    getPracticeScheduleByDate: (...args: unknown[]) => mockGetPracticeScheduleByDate(...args),
    getPracticeScheduleDetails: (...args: unknown[]) => mockGetPracticeScheduleDetails(...args),
    getPracticeScheduleIdealFormat: (...args: unknown[]) => mockGetPracticeScheduleIdealFormat(...args),
  },
}));

describe('usePracticeSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態を正しく設定する', () => {
    const { result } = renderHook(() => usePracticeSchedule());
    expect(result.current.scheduleData).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetchPracticeScheduleByDateでスケジュールを取得する', async () => {
    const mockData = {
      id: 'schedule-1',
      schedule_date: '2024-03-15',
      start_time: '09:00',
      end_time: '17:00',
    };
    mockGetPracticeScheduleByDate.mockResolvedValue(mockData);

    const { result } = renderHook(() => usePracticeSchedule());

    await act(async () => {
      await result.current.fetchPracticeScheduleByDate('2024-03-15');
    });

    expect(result.current.scheduleData).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetchPracticeScheduleByDate失敗時にエラーを設定する', async () => {
    mockGetPracticeScheduleByDate.mockRejectedValue(new Error('取得失敗'));

    const { result } = renderHook(() => usePracticeSchedule());

    await act(async () => {
      await result.current.fetchPracticeScheduleByDate('2024-03-15');
    });

    expect(result.current.scheduleData).toBeNull();
    expect(result.current.error).toBe('取得失敗');
  });

  it('clearScheduleDataでデータとエラーをクリアする', async () => {
    mockGetPracticeScheduleByDate.mockResolvedValue({
      id: 'schedule-1',
      schedule_date: '2024-03-15',
    });

    const { result } = renderHook(() => usePracticeSchedule());

    await act(async () => {
      await result.current.fetchPracticeScheduleByDate('2024-03-15');
    });

    act(() => {
      result.current.clearScheduleData();
    });

    expect(result.current.scheduleData).toBeNull();
    expect(result.current.error).toBeNull();
  });
});

describe('usePracticeScheduleDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態を正しく設定する', () => {
    const { result } = renderHook(() => usePracticeScheduleDetails());
    expect(result.current.detailsData).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetchPracticeScheduleDetailsで詳細データを取得する', async () => {
    const mockDetails = {
      id: 'schedule-1',
      schedule_date: '2024-03-15',
      sessions: [],
    };
    mockGetPracticeScheduleDetails.mockResolvedValue(mockDetails);

    const { result } = renderHook(() => usePracticeScheduleDetails());

    await act(async () => {
      await result.current.fetchPracticeScheduleDetails('schedule-1');
    });

    expect(result.current.detailsData).toEqual(mockDetails);
  });

  it('取得失敗時にエラーを設定する', async () => {
    mockGetPracticeScheduleDetails.mockRejectedValue(new Error('詳細取得失敗'));

    const { result } = renderHook(() => usePracticeScheduleDetails());

    await act(async () => {
      await result.current.fetchPracticeScheduleDetails('schedule-1');
    });

    expect(result.current.detailsData).toBeNull();
    expect(result.current.error).toBe('詳細取得失敗');
  });

  it('clearDetailsDataでデータをクリアする', async () => {
    mockGetPracticeScheduleDetails.mockResolvedValue({ id: 'schedule-1' });

    const { result } = renderHook(() => usePracticeScheduleDetails());

    await act(async () => {
      await result.current.fetchPracticeScheduleDetails('schedule-1');
    });

    act(() => {
      result.current.clearDetailsData();
    });

    expect(result.current.detailsData).toBeNull();
    expect(result.current.error).toBeNull();
  });
});

describe('useIdealSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期データなしの場合はnullを設定する', () => {
    const { result } = renderHook(() => useIdealSchedule());
    expect(result.current.idealData).toBeNull();
  });

  it('初期データありの場合はそのデータを設定する', () => {
    const initialData = {
      schedule_info: {
        id: 's-1',
        schedule_date: '2024-03-15',
        start_time: '09:00',
        end_time: '17:00',
        description: 'テスト',
      },
      venues: [],
      time_schedule: {},
    };

    const { result } = renderHook(() => useIdealSchedule(initialData));
    expect(result.current.idealData).toEqual(initialData);
  });

  it('fetchIdealScheduleByDateで理想形式データを取得する', async () => {
    const mockIdealData = {
      schedule_info: {
        id: 's-1',
        schedule_date: '2024-03-15',
        start_time: '09:00',
        end_time: '17:00',
        description: 'テスト',
      },
      venues: [{ id: 'v1', name: '会場A', priority: 1, color: '#FF0000' }],
      time_schedule: {},
    };
    mockGetPracticeScheduleIdealFormat.mockResolvedValue(mockIdealData);

    const { result } = renderHook(() => useIdealSchedule());

    await act(async () => {
      await result.current.fetchIdealScheduleByDate('2024-03-15');
    });

    expect(result.current.idealData).toEqual(mockIdealData);
  });

  it('venuesが無効な場合は空配列を設定する', async () => {
    const mockData = {
      schedule_info: {
        id: 's-1',
        schedule_date: '2024-03-15',
        start_time: '09:00',
        end_time: '17:00',
        description: 'テスト',
      },
      venues: null,
      time_schedule: {},
    };
    mockGetPracticeScheduleIdealFormat.mockResolvedValue(mockData);

    const { result } = renderHook(() => useIdealSchedule());

    await act(async () => {
      await result.current.fetchIdealScheduleByDate('2024-03-15');
    });

    expect(result.current.idealData?.venues).toEqual([]);
  });

  it('nullレスポンスの場合はnullを設定する', async () => {
    mockGetPracticeScheduleIdealFormat.mockResolvedValue(null);

    const { result } = renderHook(() => useIdealSchedule());

    await act(async () => {
      await result.current.fetchIdealScheduleByDate('2024-03-15');
    });

    expect(result.current.idealData).toBeNull();
  });

  it('clearIdealDataでデータをクリアする', async () => {
    const mockIdealData = {
      schedule_info: {
        id: 's-1',
        schedule_date: '2024-03-15',
        start_time: '09:00',
        end_time: '17:00',
        description: 'テスト',
      },
      venues: [],
      time_schedule: {},
    };
    mockGetPracticeScheduleIdealFormat.mockResolvedValue(mockIdealData);

    const { result } = renderHook(() => useIdealSchedule());

    await act(async () => {
      await result.current.fetchIdealScheduleByDate('2024-03-15');
    });

    act(() => {
      result.current.clearIdealData();
    });

    expect(result.current.idealData).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
