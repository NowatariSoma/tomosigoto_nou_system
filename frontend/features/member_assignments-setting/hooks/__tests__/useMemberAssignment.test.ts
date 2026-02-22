import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMemberAssignment } from '@/features/member_assignments-setting/hooks/useMemberAssignment';

// memberAssignmentService をモック
const mockGetMemberAssignment = vi.fn();
const mockCreateMemberAssignment = vi.fn();
const mockUpdateMemberAssignment = vi.fn();
const mockDeleteMemberAssignment = vi.fn();

vi.mock('@/features/member_assignments-setting/services/member-assignment-service', () => ({
  memberAssignmentService: {
    getMemberAssignment: (...args: unknown[]) => mockGetMemberAssignment(...args),
    createMemberAssignment: (...args: unknown[]) => mockCreateMemberAssignment(...args),
    updateMemberAssignment: (...args: unknown[]) => mockUpdateMemberAssignment(...args),
    deleteMemberAssignment: (...args: unknown[]) => mockDeleteMemberAssignment(...args),
  },
}));

const mockAssignment = {
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
};

describe('useMemberAssignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態を正しく設定する', () => {
    const { result } = renderHook(() => useMemberAssignment());
    expect(result.current.memberAssignment).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('マウント時に自動取得しない', () => {
    renderHook(() => useMemberAssignment());
    expect(mockGetMemberAssignment).not.toHaveBeenCalled();
  });

  describe('fetchMemberAssignment', () => {
    it('IDを指定してメンバー所属を取得する', async () => {
      mockGetMemberAssignment.mockResolvedValue(mockAssignment);

      const { result } = renderHook(() => useMemberAssignment());

      await act(async () => {
        await result.current.fetchMemberAssignment('assignment-1');
      });

      expect(mockGetMemberAssignment).toHaveBeenCalledWith('assignment-1');
      expect(result.current.memberAssignment).toEqual(mockAssignment);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('取得結果を返す', async () => {
      mockGetMemberAssignment.mockResolvedValue(mockAssignment);

      const { result } = renderHook(() => useMemberAssignment());

      let returnedAssignment: unknown;
      await act(async () => {
        returnedAssignment = await result.current.fetchMemberAssignment('assignment-1');
      });

      expect(returnedAssignment).toEqual(mockAssignment);
    });

    it('取得中にloadingをtrueに設定する', async () => {
      let resolvePromise: (value: unknown) => void;
      mockGetMemberAssignment.mockReturnValue(
        new Promise((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => useMemberAssignment());

      act(() => {
        result.current.fetchMemberAssignment('assignment-1');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await act(async () => {
        resolvePromise!(mockAssignment);
      });

      expect(result.current.loading).toBe(false);
    });

    it('取得失敗時にエラーメッセージを設定する', async () => {
      mockGetMemberAssignment.mockRejectedValue(new Error('取得エラー'));

      const { result } = renderHook(() => useMemberAssignment());

      await act(async () => {
        await expect(result.current.fetchMemberAssignment('assignment-1')).rejects.toThrow('取得エラー');
      });

      expect(result.current.error).toBe('取得エラー');
      expect(result.current.loading).toBe(false);
    });

    it('Error以外のエラーの場合にデフォルトメッセージを設定する', async () => {
      mockGetMemberAssignment.mockRejectedValue('unknown error');

      const { result } = renderHook(() => useMemberAssignment());

      await act(async () => {
        await expect(result.current.fetchMemberAssignment('assignment-1')).rejects.toBe('unknown error');
      });

      expect(result.current.error).toBe('メンバー所属の取得に失敗しました');
    });
  });

  describe('createMemberAssignment', () => {
    const createData = {
      user_id: 'user-1',
      part_id: 'part-1',
      category: 'utai' as const,
      display_order: 1,
    };

    it('メンバー所属を作成し状態を更新する', async () => {
      mockCreateMemberAssignment.mockResolvedValue(mockAssignment);

      const { result } = renderHook(() => useMemberAssignment());

      await act(async () => {
        await result.current.createMemberAssignment(createData);
      });

      expect(mockCreateMemberAssignment).toHaveBeenCalledWith(createData);
      expect(result.current.memberAssignment).toEqual(mockAssignment);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('作成結果を返す', async () => {
      mockCreateMemberAssignment.mockResolvedValue(mockAssignment);

      const { result } = renderHook(() => useMemberAssignment());

      let returnedAssignment: unknown;
      await act(async () => {
        returnedAssignment = await result.current.createMemberAssignment(createData);
      });

      expect(returnedAssignment).toEqual(mockAssignment);
    });

    it('作成失敗時にエラーメッセージを設定する', async () => {
      mockCreateMemberAssignment.mockRejectedValue(new Error('作成エラー'));

      const { result } = renderHook(() => useMemberAssignment());

      await act(async () => {
        await expect(result.current.createMemberAssignment(createData)).rejects.toThrow('作成エラー');
      });

      expect(result.current.error).toBe('作成エラー');
      expect(result.current.loading).toBe(false);
    });

    it('Error以外のエラーの場合にデフォルトメッセージを設定する', async () => {
      mockCreateMemberAssignment.mockRejectedValue('unknown');

      const { result } = renderHook(() => useMemberAssignment());

      await act(async () => {
        await expect(result.current.createMemberAssignment(createData)).rejects.toBe('unknown');
      });

      expect(result.current.error).toBe('メンバー所属の作成に失敗しました');
    });
  });

  describe('updateMemberAssignment', () => {
    const updateData = {
      category: 'mai' as const,
      display_order: 2,
    };

    const updatedAssignment = {
      ...mockAssignment,
      category: 'mai' as const,
      display_order: 2,
    };

    it('メンバー所属を更新し状態を更新する', async () => {
      mockUpdateMemberAssignment.mockResolvedValue(updatedAssignment);

      const { result } = renderHook(() => useMemberAssignment());

      await act(async () => {
        await result.current.updateMemberAssignment('assignment-1', updateData);
      });

      expect(mockUpdateMemberAssignment).toHaveBeenCalledWith('assignment-1', updateData);
      expect(result.current.memberAssignment).toEqual(updatedAssignment);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('更新結果を返す', async () => {
      mockUpdateMemberAssignment.mockResolvedValue(updatedAssignment);

      const { result } = renderHook(() => useMemberAssignment());

      let returnedAssignment: unknown;
      await act(async () => {
        returnedAssignment = await result.current.updateMemberAssignment('assignment-1', updateData);
      });

      expect(returnedAssignment).toEqual(updatedAssignment);
    });

    it('更新失敗時にエラーメッセージを設定する', async () => {
      mockUpdateMemberAssignment.mockRejectedValue(new Error('更新エラー'));

      const { result } = renderHook(() => useMemberAssignment());

      await act(async () => {
        await expect(result.current.updateMemberAssignment('assignment-1', updateData)).rejects.toThrow('更新エラー');
      });

      expect(result.current.error).toBe('更新エラー');
      expect(result.current.loading).toBe(false);
    });

    it('Error以外のエラーの場合にデフォルトメッセージを設定する', async () => {
      mockUpdateMemberAssignment.mockRejectedValue('unknown');

      const { result } = renderHook(() => useMemberAssignment());

      await act(async () => {
        await expect(result.current.updateMemberAssignment('assignment-1', updateData)).rejects.toBe('unknown');
      });

      expect(result.current.error).toBe('メンバー所属の更新に失敗しました');
    });
  });

  describe('deleteMemberAssignment', () => {
    it('メンバー所属を削除し状態をクリアする', async () => {
      mockGetMemberAssignment.mockResolvedValue(mockAssignment);
      mockDeleteMemberAssignment.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMemberAssignment());

      // まず取得
      await act(async () => {
        await result.current.fetchMemberAssignment('assignment-1');
      });
      expect(result.current.memberAssignment).toEqual(mockAssignment);

      // 削除
      await act(async () => {
        await result.current.deleteMemberAssignment('assignment-1');
      });

      expect(mockDeleteMemberAssignment).toHaveBeenCalledWith('assignment-1');
      expect(result.current.memberAssignment).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('削除失敗時にエラーメッセージを設定する', async () => {
      mockDeleteMemberAssignment.mockRejectedValue(new Error('削除エラー'));

      const { result } = renderHook(() => useMemberAssignment());

      await act(async () => {
        await expect(result.current.deleteMemberAssignment('assignment-1')).rejects.toThrow('削除エラー');
      });

      expect(result.current.error).toBe('削除エラー');
      expect(result.current.loading).toBe(false);
    });

    it('Error以外のエラーの場合にデフォルトメッセージを設定する', async () => {
      mockDeleteMemberAssignment.mockRejectedValue('unknown');

      const { result } = renderHook(() => useMemberAssignment());

      await act(async () => {
        await expect(result.current.deleteMemberAssignment('assignment-1')).rejects.toBe('unknown');
      });

      expect(result.current.error).toBe('メンバー所属の削除に失敗しました');
    });
  });

  describe('clearMemberAssignment', () => {
    it('状態をクリアする', async () => {
      mockGetMemberAssignment.mockResolvedValue(mockAssignment);

      const { result } = renderHook(() => useMemberAssignment());

      // まず取得
      await act(async () => {
        await result.current.fetchMemberAssignment('assignment-1');
      });
      expect(result.current.memberAssignment).toEqual(mockAssignment);

      // クリア
      act(() => {
        result.current.clearMemberAssignment();
      });

      expect(result.current.memberAssignment).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('エラー状態もクリアする', async () => {
      mockGetMemberAssignment.mockRejectedValue(new Error('エラー'));

      const { result } = renderHook(() => useMemberAssignment());

      await act(async () => {
        await expect(result.current.fetchMemberAssignment('assignment-1')).rejects.toThrow();
      });
      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearMemberAssignment();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
