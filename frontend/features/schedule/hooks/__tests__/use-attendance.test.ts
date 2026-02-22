import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAttendance } from '@/features/schedule/hooks/use-attendance';

// attendanceServiceをモック
const mockGetAttendances = vi.fn();
const mockGetAttendancesByPractice = vi.fn();
const mockGetAttendancesByUser = vi.fn();
const mockCreateAttendance = vi.fn();
const mockUpsertAttendance = vi.fn();
const mockUpdateAttendance = vi.fn();
const mockDeleteAttendance = vi.fn();

vi.mock('@/features/schedule/services/attendance-service', () => ({
  attendanceService: {
    getAttendances: (...args: unknown[]) => mockGetAttendances(...args),
    getAttendancesByPractice: (...args: unknown[]) => mockGetAttendancesByPractice(...args),
    getAttendancesByUser: (...args: unknown[]) => mockGetAttendancesByUser(...args),
    createAttendance: (...args: unknown[]) => mockCreateAttendance(...args),
    upsertAttendance: (...args: unknown[]) => mockUpsertAttendance(...args),
    updateAttendance: (...args: unknown[]) => mockUpdateAttendance(...args),
    deleteAttendance: (...args: unknown[]) => mockDeleteAttendance(...args),
  },
}));

const mockAttendance = {
  id: 'att-1',
  practice_schedule_id: 'ps-1',
  user_id: 'user-1',
  status: 'present' as const,
  notes: '',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  created_by: 'user-1',
  updated_by: 'user-1',
};

describe('useAttendance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAttendances.mockResolvedValue([mockAttendance]);
    mockGetAttendancesByPractice.mockResolvedValue([mockAttendance]);
  });

  it('practiceScheduleIdなしで初期化すると全出席記録を取得する', async () => {
    const { result } = renderHook(() => useAttendance());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetAttendances).toHaveBeenCalled();
    expect(result.current.attendances).toHaveLength(1);
  });

  it('practiceScheduleIdありで初期化すると練習ごとの出席記録を取得する', async () => {
    const { result } = renderHook(() => useAttendance('ps-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetAttendancesByPractice).toHaveBeenCalledWith('ps-1');
  });

  it('autoFetch=falseの場合はデータを取得しない', async () => {
    const { result } = renderHook(() => useAttendance(undefined, { autoFetch: false }));

    // loadingがtrueのまま自動取得されないことを確認
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(mockGetAttendances).not.toHaveBeenCalled();
  });

  it('initialAttendancesが指定された場合はそのデータを使う', async () => {
    const initialData = [mockAttendance];
    const { result } = renderHook(() =>
      useAttendance(undefined, { initialAttendances: initialData })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.attendances).toEqual(initialData);
  });

  it('createAttendanceで出席記録を追加する', async () => {
    const newAttendance = { ...mockAttendance, id: 'att-2' };
    mockCreateAttendance.mockResolvedValue(newAttendance);

    const { result } = renderHook(() => useAttendance(undefined, { autoFetch: false }));

    await act(async () => {
      await result.current.createAttendance({
        practice_schedule_id: 'ps-1',
        user_id: 'user-1',
        status: 'present',
      });
    });

    expect(result.current.attendances).toContainEqual(newAttendance);
  });

  it('updateAttendanceで出席記録を更新する', async () => {
    mockGetAttendances.mockResolvedValue([mockAttendance]);
    const updatedAttendance = { ...mockAttendance, status: 'absent' as const };
    mockUpdateAttendance.mockResolvedValue(updatedAttendance);

    const { result } = renderHook(() => useAttendance());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateAttendance('att-1', { status: 'absent' });
    });

    expect(result.current.attendances[0].status).toBe('absent');
  });

  it('deleteAttendanceで出席記録を削除する', async () => {
    mockGetAttendances.mockResolvedValue([mockAttendance]);
    mockDeleteAttendance.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAttendance());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteAttendance('att-1');
    });

    expect(result.current.attendances).toHaveLength(0);
  });

  it('upsertAttendanceで既存レコードを更新する', async () => {
    mockGetAttendances.mockResolvedValue([mockAttendance]);
    const upserted = { ...mockAttendance, status: 'late' as const };
    mockUpsertAttendance.mockResolvedValue(upserted);

    const { result } = renderHook(() => useAttendance());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.upsertAttendance({
        practice_schedule_id: 'ps-1',
        user_id: 'user-1',
        status: 'late',
      });
    });

    expect(result.current.attendances[0].status).toBe('late');
  });

  it('API取得失敗時にエラーを設定する', async () => {
    mockGetAttendances.mockRejectedValue(new Error('取得失敗'));

    const { result } = renderHook(() => useAttendance());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('取得失敗');
  });
});
