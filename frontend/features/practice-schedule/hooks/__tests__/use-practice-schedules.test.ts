import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePracticeSchedules } from '../use-practice-schedules';
import type { PracticeSchedule, CreatePracticeScheduleRequest, UpdatePracticeScheduleRequest } from '../../types';

// practiceScheduleServiceをモック
const mockGetPracticeSchedules = vi.fn();
const mockGetPracticeSchedule = vi.fn();
const mockCreatePracticeSchedule = vi.fn();
const mockUpdatePracticeSchedule = vi.fn();
const mockDeletePracticeSchedule = vi.fn();

vi.mock('@/features/practice-schedule/services', () => ({
  practiceScheduleService: {
    getPracticeSchedules: (...args: unknown[]) => mockGetPracticeSchedules(...args),
    getPracticeSchedule: (...args: unknown[]) => mockGetPracticeSchedule(...args),
    createPracticeSchedule: (...args: unknown[]) => mockCreatePracticeSchedule(...args),
    updatePracticeSchedule: (...args: unknown[]) => mockUpdatePracticeSchedule(...args),
    deletePracticeSchedule: (...args: unknown[]) => mockDeletePracticeSchedule(...args),
  },
}));

// テスト用のモックデータ
const mockSchedule1: PracticeSchedule = {
  id: 'schedule-1',
  date: '2024-03-15',
  startTime: '09:00',
  endTime: '12:00',
  venueId: 'venue-1',
  venueName: '練習室A',
  campus: 'キャンパスA',
  title: '午前練習',
  description: 'パート練習',
  createdAt: '2024-03-01T00:00:00Z',
  updatedAt: '2024-03-01T00:00:00Z',
};

const mockSchedule2: PracticeSchedule = {
  id: 'schedule-2',
  date: '2024-03-16',
  startTime: '13:00',
  endTime: '17:00',
  venueId: 'venue-2',
  venueName: '練習室B',
  campus: 'キャンパスB',
  title: '午後練習',
  description: '合奏練習',
  createdAt: '2024-03-01T00:00:00Z',
  updatedAt: '2024-03-01T00:00:00Z',
};

const mockSchedules: PracticeSchedule[] = [mockSchedule1, mockSchedule2];

describe('usePracticeSchedules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルトでは自動fetchが成功するようにする
    mockGetPracticeSchedules.mockResolvedValue([]);
  });

  describe('初期化とマウント時の自動取得', () => {
    it('マウント時にfetchSchedulesを自動で呼び出す', async () => {
      mockGetPracticeSchedules.mockResolvedValue(mockSchedules);

      const { result } = renderHook(() => usePracticeSchedules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetPracticeSchedules).toHaveBeenCalledTimes(1);
      expect(result.current.schedules).toEqual(mockSchedules);
      expect(result.current.error).toBeNull();
    });

    it('マウント時の取得中はloadingがtrueになる', async () => {
      let resolvePromise: (value: PracticeSchedule[]) => void;
      mockGetPracticeSchedules.mockReturnValue(
        new Promise<PracticeSchedule[]>((resolve) => {
          resolvePromise = resolve;
        })
      );

      const { result } = renderHook(() => usePracticeSchedules());

      // loading中を確認
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // 完了
      await act(async () => {
        resolvePromise!(mockSchedules);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.schedules).toEqual(mockSchedules);
    });

    it('マウント時の取得失敗でエラーが設定される', async () => {
      mockGetPracticeSchedules.mockRejectedValue(new Error('ネットワークエラー'));

      const { result } = renderHook(() => usePracticeSchedules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('ネットワークエラー');
      expect(result.current.schedules).toEqual([]);
    });

    it('Error以外の例外ではデフォルトのエラーメッセージを設定する', async () => {
      mockGetPracticeSchedules.mockRejectedValue('unknown error');

      const { result } = renderHook(() => usePracticeSchedules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('練習予定の取得に失敗しました');
    });
  });

  describe('fetchSchedules', () => {
    it('手動でfetchSchedulesを呼び出してスケジュールを再取得できる', async () => {
      mockGetPracticeSchedules.mockResolvedValueOnce([]).mockResolvedValueOnce(mockSchedules);

      const { result } = renderHook(() => usePracticeSchedules());

      // 初回自動取得完了を待つ
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.schedules).toEqual([]);

      // 手動で再取得
      await act(async () => {
        await result.current.fetchSchedules();
      });

      expect(result.current.schedules).toEqual(mockSchedules);
      expect(mockGetPracticeSchedules).toHaveBeenCalledTimes(2);
    });
  });

  describe('getPracticeSchedule', () => {
    it('IDを指定してスケジュールを取得できる', async () => {
      mockGetPracticeSchedule.mockResolvedValue(mockSchedule1);

      const { result } = renderHook(() => usePracticeSchedules());

      // 初回自動取得完了を待つ
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let schedule: PracticeSchedule | undefined;
      await act(async () => {
        schedule = await result.current.getPracticeSchedule('schedule-1');
      });

      expect(mockGetPracticeSchedule).toHaveBeenCalledWith('schedule-1');
      expect(schedule).toEqual(mockSchedule1);
    });

    it('取得失敗時にエラーを設定しエラーをthrowする', async () => {
      const error = new Error('スケジュールが見つかりません');
      mockGetPracticeSchedule.mockRejectedValue(error);

      const { result } = renderHook(() => usePracticeSchedules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let thrownError: unknown;
      await act(async () => {
        try {
          await result.current.getPracticeSchedule('nonexistent');
        } catch (e) {
          thrownError = e;
        }
      });

      expect(thrownError).toBe(error);
      expect(result.current.error).toBe('スケジュールが見つかりません');
      expect(result.current.loading).toBe(false);
    });

    it('Error以外の例外ではデフォルトのエラーメッセージを設定する', async () => {
      mockGetPracticeSchedule.mockRejectedValue('unknown');

      const { result } = renderHook(() => usePracticeSchedules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let thrownError: unknown;
      await act(async () => {
        try {
          await result.current.getPracticeSchedule('nonexistent');
        } catch (e) {
          thrownError = e;
        }
      });

      expect(thrownError).toBe('unknown');
      expect(result.current.error).toBe('練習予定の取得に失敗しました');
    });
  });

  describe('createSchedule', () => {
    const createRequest: CreatePracticeScheduleRequest = {
      date: '2024-03-20',
      startTime: '10:00',
      endTime: '15:00',
      venueId: 'venue-1',
      title: '新規練習',
      description: '全体練習',
    };

    const createdSchedule: PracticeSchedule = {
      id: 'schedule-3',
      date: '2024-03-20',
      startTime: '10:00',
      endTime: '15:00',
      venueId: 'venue-1',
      venueName: '練習室A',
      campus: 'キャンパスA',
      title: '新規練習',
      description: '全体練習',
      createdAt: '2024-03-10T00:00:00Z',
      updatedAt: '2024-03-10T00:00:00Z',
    };

    it('スケジュールを作成し、リストを再取得する', async () => {
      mockGetPracticeSchedules
        .mockResolvedValueOnce([]) // 初回自動取得
        .mockResolvedValueOnce([...mockSchedules, createdSchedule]); // 作成後の再取得
      mockCreatePracticeSchedule.mockResolvedValue(createdSchedule);

      const { result } = renderHook(() => usePracticeSchedules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let newSchedule: PracticeSchedule | undefined;
      await act(async () => {
        newSchedule = await result.current.createSchedule(createRequest);
      });

      expect(mockCreatePracticeSchedule).toHaveBeenCalledWith(createRequest);
      expect(newSchedule).toEqual(createdSchedule);
      // 作成後にfetchSchedulesが呼ばれる（初回 + 作成後 = 2回）
      expect(mockGetPracticeSchedules).toHaveBeenCalledTimes(2);
      expect(result.current.schedules).toEqual([...mockSchedules, createdSchedule]);
    });

    it('作成した結果を返す', async () => {
      mockCreatePracticeSchedule.mockResolvedValue(createdSchedule);
      mockGetPracticeSchedules.mockResolvedValue([]);

      const { result } = renderHook(() => usePracticeSchedules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let returnedSchedule: PracticeSchedule | undefined;
      await act(async () => {
        returnedSchedule = await result.current.createSchedule(createRequest);
      });

      expect(returnedSchedule).toEqual(createdSchedule);
    });

    it('作成失敗時にエラーを設定しエラーをthrowする', async () => {
      const error = new Error('作成に失敗');
      mockCreatePracticeSchedule.mockRejectedValue(error);

      const { result } = renderHook(() => usePracticeSchedules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let thrownError: unknown;
      await act(async () => {
        try {
          await result.current.createSchedule(createRequest);
        } catch (e) {
          thrownError = e;
        }
      });

      expect(thrownError).toBe(error);
      expect(result.current.error).toBe('作成に失敗');
      expect(result.current.loading).toBe(false);
    });

    it('Error以外の例外ではデフォルトのエラーメッセージを設定する', async () => {
      const error = { status: 500 };
      mockCreatePracticeSchedule.mockRejectedValue(error);

      const { result } = renderHook(() => usePracticeSchedules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let thrownError: unknown;
      await act(async () => {
        try {
          await result.current.createSchedule(createRequest);
        } catch (e) {
          thrownError = e;
        }
      });

      expect(thrownError).toEqual({ status: 500 });
      expect(result.current.error).toBe('練習予定の作成に失敗しました');
    });
  });

  describe('updateSchedule', () => {
    const updateRequest: UpdatePracticeScheduleRequest = {
      title: '更新された練習',
      startTime: '10:00',
      endTime: '16:00',
    };

    const updatedSchedule: PracticeSchedule = {
      ...mockSchedule1,
      title: '更新された練習',
      startTime: '10:00',
      endTime: '16:00',
      updatedAt: '2024-03-10T00:00:00Z',
    };

    it('スケジュールを更新し、ローカルのリストを更新する', async () => {
      mockGetPracticeSchedules.mockResolvedValue(mockSchedules);
      mockUpdatePracticeSchedule.mockResolvedValue(updatedSchedule);

      const { result } = renderHook(() => usePracticeSchedules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.schedules).toEqual(mockSchedules);

      let returnedSchedule: PracticeSchedule | undefined;
      await act(async () => {
        returnedSchedule = await result.current.updateSchedule('schedule-1', updateRequest);
      });

      expect(mockUpdatePracticeSchedule).toHaveBeenCalledWith('schedule-1', updateRequest);
      expect(returnedSchedule).toEqual(updatedSchedule);

      // ローカルのリスト内で該当スケジュールが更新されている
      expect(result.current.schedules[0]).toEqual(updatedSchedule);
      // 他のスケジュールは変更されていない
      expect(result.current.schedules[1]).toEqual(mockSchedule2);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('存在しないIDの更新でもリストに変化がない', async () => {
      mockGetPracticeSchedules.mockResolvedValue(mockSchedules);
      mockUpdatePracticeSchedule.mockResolvedValue({
        ...mockSchedule1,
        id: 'nonexistent',
        title: '更新',
      });

      const { result } = renderHook(() => usePracticeSchedules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSchedule('nonexistent', updateRequest);
      });

      // 既存のスケジュールはそのまま
      expect(result.current.schedules).toEqual(mockSchedules);
    });

    it('更新失敗時にエラーを設定しエラーをthrowする', async () => {
      const error = new Error('更新に失敗');
      mockUpdatePracticeSchedule.mockRejectedValue(error);

      const { result } = renderHook(() => usePracticeSchedules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let thrownError: unknown;
      await act(async () => {
        try {
          await result.current.updateSchedule('schedule-1', updateRequest);
        } catch (e) {
          thrownError = e;
        }
      });

      expect(thrownError).toBe(error);
      expect(result.current.error).toBe('更新に失敗');
      expect(result.current.loading).toBe(false);
    });

    it('Error以外の例外ではデフォルトのエラーメッセージを設定する', async () => {
      mockUpdatePracticeSchedule.mockRejectedValue(null);

      const { result } = renderHook(() => usePracticeSchedules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let thrownError: unknown;
      await act(async () => {
        try {
          await result.current.updateSchedule('schedule-1', updateRequest);
        } catch (e) {
          thrownError = e;
        }
      });

      expect(thrownError).toBeNull();
      expect(result.current.error).toBe('練習予定の更新に失敗しました');
    });
  });

  describe('deleteSchedule', () => {
    it('スケジュールを削除し、ローカルのリストから除外する', async () => {
      mockGetPracticeSchedules.mockResolvedValue(mockSchedules);
      mockDeletePracticeSchedule.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePracticeSchedules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.schedules).toHaveLength(2);

      await act(async () => {
        await result.current.deleteSchedule('schedule-1');
      });

      expect(mockDeletePracticeSchedule).toHaveBeenCalledWith('schedule-1');
      expect(result.current.schedules).toHaveLength(1);
      expect(result.current.schedules[0]).toEqual(mockSchedule2);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('存在しないIDの削除でもエラーにならない（フィルタが変化しない）', async () => {
      mockGetPracticeSchedules.mockResolvedValue(mockSchedules);
      mockDeletePracticeSchedule.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePracticeSchedules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteSchedule('nonexistent');
      });

      expect(result.current.schedules).toHaveLength(2);
    });

    it('削除失敗時にエラーを設定しエラーをthrowする', async () => {
      const error = new Error('削除に失敗');
      mockDeletePracticeSchedule.mockRejectedValue(error);

      const { result } = renderHook(() => usePracticeSchedules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let thrownError: unknown;
      await act(async () => {
        try {
          await result.current.deleteSchedule('schedule-1');
        } catch (e) {
          thrownError = e;
        }
      });

      expect(thrownError).toBe(error);
      expect(result.current.error).toBe('削除に失敗');
      expect(result.current.loading).toBe(false);
    });

    it('Error以外の例外ではデフォルトのエラーメッセージを設定する', async () => {
      mockDeletePracticeSchedule.mockRejectedValue(42);

      const { result } = renderHook(() => usePracticeSchedules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let thrownError: unknown;
      await act(async () => {
        try {
          await result.current.deleteSchedule('schedule-1');
        } catch (e) {
          thrownError = e;
        }
      });

      expect(thrownError).toBe(42);
      expect(result.current.error).toBe('練習予定の削除に失敗しました');
    });
  });

  describe('エラーのクリア', () => {
    it('新しい操作を開始するとエラーがクリアされる', async () => {
      // まずエラーを発生させる
      mockGetPracticeSchedules
        .mockRejectedValueOnce(new Error('エラー'))
        .mockResolvedValueOnce(mockSchedules);

      const { result } = renderHook(() => usePracticeSchedules());

      await waitFor(() => {
        expect(result.current.error).toBe('エラー');
      });

      // 再取得でエラーがクリアされる
      await act(async () => {
        await result.current.fetchSchedules();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.schedules).toEqual(mockSchedules);
    });
  });
});
