import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePartAssignments } from '@/features/member_assignments-setting/hooks/usePartAssignments';

// partAssignmentsService をモック
const mockGetPartWithAssignments = vi.fn();

vi.mock('@/features/member_assignments-setting/services/part-assignments-service', () => ({
  partAssignmentsService: {
    getPartWithAssignments: (...args: unknown[]) => mockGetPartWithAssignments(...args),
  },
}));

const mockPartWithAssignments = {
  id: 'part-1',
  name: 'シテ',
  stage_id: 'stage-1',
  stage_name: '第一回公演',
  performance_date: '2025-06-01',
  member_assignments: [
    {
      id: 'assignment-1',
      user_id: 'user-1',
      part_id: 'part-1',
      category: 'utai' as const,
      display_order: 1,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      user: {
        id: 'user-1',
        name: 'タナカ タロウ',
        email: 'tanaka@example.com',
        first_name_katakana: 'タロウ',
        last_name_katakana: 'タナカ',
        first_name_kanji: '太郎',
        last_name_kanji: '田中',
      },
      part: {
        id: 'part-1',
        name: 'シテ',
        stage: {
          id: 'stage-1',
          name: '第一回公演',
          performance_date: '2025-06-01',
        },
      },
    },
  ],
};

describe('usePartAssignments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態を正しく設定する', () => {
    const { result } = renderHook(() => usePartAssignments());
    expect(result.current.partAssignments).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('マウント時に自動取得しない', () => {
    renderHook(() => usePartAssignments());
    expect(mockGetPartWithAssignments).not.toHaveBeenCalled();
  });

  describe('fetchPartAssignments', () => {
    it('パートIDを指定してパート所属を取得する', async () => {
      mockGetPartWithAssignments.mockResolvedValue(mockPartWithAssignments);

      const { result } = renderHook(() => usePartAssignments());

      await act(async () => {
        await result.current.fetchPartAssignments('part-1');
      });

      expect(mockGetPartWithAssignments).toHaveBeenCalledWith('part-1');
      expect(result.current.partAssignments).toEqual(mockPartWithAssignments);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('取得結果を返す', async () => {
      mockGetPartWithAssignments.mockResolvedValue(mockPartWithAssignments);

      const { result } = renderHook(() => usePartAssignments());

      let returnedPart: unknown;
      await act(async () => {
        returnedPart = await result.current.fetchPartAssignments('part-1');
      });

      expect(returnedPart).toEqual(mockPartWithAssignments);
    });

    it('取得中にloadingをtrueに設定する', async () => {
      let resolvePromise: (value: unknown) => void;
      mockGetPartWithAssignments.mockReturnValue(
        new Promise((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => usePartAssignments());

      act(() => {
        result.current.fetchPartAssignments('part-1');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await act(async () => {
        resolvePromise!(mockPartWithAssignments);
      });

      expect(result.current.loading).toBe(false);
    });

    it('取得失敗時にエラーメッセージを設定する', async () => {
      mockGetPartWithAssignments.mockRejectedValue(new Error('パート取得エラー'));

      const { result } = renderHook(() => usePartAssignments());

      await act(async () => {
        await expect(result.current.fetchPartAssignments('part-1')).rejects.toThrow('パート取得エラー');
      });

      expect(result.current.error).toBe('パート取得エラー');
      expect(result.current.loading).toBe(false);
    });

    it('Error以外のエラーの場合にデフォルトメッセージを設定する', async () => {
      mockGetPartWithAssignments.mockRejectedValue('unknown error');

      const { result } = renderHook(() => usePartAssignments());

      await act(async () => {
        await expect(result.current.fetchPartAssignments('part-1')).rejects.toBe('unknown error');
      });

      expect(result.current.error).toBe('パート所属の取得に失敗しました');
    });

    it('別のパートIDで再取得できる', async () => {
      const anotherPart = {
        ...mockPartWithAssignments,
        id: 'part-2',
        name: 'ワキ',
        member_assignments: [],
      };

      mockGetPartWithAssignments
        .mockResolvedValueOnce(mockPartWithAssignments)
        .mockResolvedValueOnce(anotherPart);

      const { result } = renderHook(() => usePartAssignments());

      await act(async () => {
        await result.current.fetchPartAssignments('part-1');
      });
      expect(result.current.partAssignments).toEqual(mockPartWithAssignments);

      await act(async () => {
        await result.current.fetchPartAssignments('part-2');
      });
      expect(result.current.partAssignments).toEqual(anotherPart);
      expect(mockGetPartWithAssignments).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearPartAssignments', () => {
    it('状態をクリアする', async () => {
      mockGetPartWithAssignments.mockResolvedValue(mockPartWithAssignments);

      const { result } = renderHook(() => usePartAssignments());

      // まず取得
      await act(async () => {
        await result.current.fetchPartAssignments('part-1');
      });
      expect(result.current.partAssignments).toEqual(mockPartWithAssignments);

      // クリア
      act(() => {
        result.current.clearPartAssignments();
      });

      expect(result.current.partAssignments).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('エラー状態もクリアする', async () => {
      mockGetPartWithAssignments.mockRejectedValue(new Error('エラー'));

      const { result } = renderHook(() => usePartAssignments());

      await act(async () => {
        await expect(result.current.fetchPartAssignments('part-1')).rejects.toThrow();
      });
      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearPartAssignments();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.partAssignments).toBeNull();
    });
  });
});
