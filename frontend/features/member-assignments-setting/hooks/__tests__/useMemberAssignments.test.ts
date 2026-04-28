import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMemberAssignments } from '@/features/member-assignments-setting/hooks/useMemberAssignments';

// memberAssignmentsService をモック
const mockGetMemberAssignments = vi.fn();
const mockCreateMemberAssignment = vi.fn();
const mockUpdateMemberAssignment = vi.fn();
const mockDeleteMemberAssignment = vi.fn();

vi.mock('@/features/member-assignments-setting/services/member-assignments-service', () => ({
  memberAssignmentsService: {
    getMemberAssignments: (...args: unknown[]) => mockGetMemberAssignments(...args),
    createMemberAssignment: (...args: unknown[]) => mockCreateMemberAssignment(...args),
    updateMemberAssignment: (...args: unknown[]) => mockUpdateMemberAssignment(...args),
    deleteMemberAssignment: (...args: unknown[]) => mockDeleteMemberAssignment(...args),
  },
}));

const mockAssignment1 = {
  id: 'assignment-1',
  user_id: 'user-1',
  part_id: 'part-1',
  category: 'utai' as const,
  display_order: 1,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const mockAssignment2 = {
  id: 'assignment-2',
  user_id: 'user-2',
  part_id: 'part-2',
  category: 'mai' as const,
  display_order: 2,
  created_at: '2025-01-02T00:00:00Z',
  updated_at: '2025-01-02T00:00:00Z',
};

const mockAssignments = [mockAssignment1, mockAssignment2];

describe('useMemberAssignments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMemberAssignments.mockResolvedValue(mockAssignments);
  });

  it('マウント時に自動的にメンバー所属一覧を取得する', async () => {
    const { result } = renderHook(() => useMemberAssignments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetMemberAssignments).toHaveBeenCalledTimes(1);
    expect(result.current.memberAssignments).toEqual(mockAssignments);
    expect(result.current.error).toBeNull();
  });

  it('自動取得失敗時にエラーメッセージを設定する', async () => {
    mockGetMemberAssignments.mockRejectedValue(new Error('一覧取得エラー'));

    const { result } = renderHook(() => useMemberAssignments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('一覧取得エラー');
    expect(result.current.memberAssignments).toEqual([]);
  });

  it('自動取得でError以外のエラーの場合にデフォルトメッセージを設定する', async () => {
    mockGetMemberAssignments.mockRejectedValue('unknown');

    const { result } = renderHook(() => useMemberAssignments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('メンバー所属の取得に失敗しました');
  });

  describe('fetchMemberAssignments', () => {
    it('手動でメンバー所属一覧を再取得する', async () => {
      const { result } = renderHook(() => useMemberAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updatedAssignments = [...mockAssignments, {
        id: 'assignment-3',
        user_id: 'user-3',
        part_id: 'part-3',
        category: 'utai' as const,
        display_order: 3,
        created_at: '2025-01-03T00:00:00Z',
        updated_at: '2025-01-03T00:00:00Z',
      }];
      mockGetMemberAssignments.mockResolvedValue(updatedAssignments);

      await act(async () => {
        await result.current.fetchMemberAssignments();
      });

      expect(mockGetMemberAssignments).toHaveBeenCalledTimes(2);
      expect(result.current.memberAssignments).toEqual(updatedAssignments);
    });
  });

  describe('getMemberAssignment', () => {
    it('IDを指定してメンバー所属を取得する', async () => {
      const { result } = renderHook(() => useMemberAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const found = result.current.getMemberAssignment('assignment-1');
      expect(found).toEqual(mockAssignment1);
    });

    it('存在しないIDの場合はundefinedを返す', async () => {
      const { result } = renderHook(() => useMemberAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const found = result.current.getMemberAssignment('nonexistent-id');
      expect(found).toBeUndefined();
    });
  });

  describe('createMemberAssignment', () => {
    const createData = {
      user_id: 'user-3',
      part_id: 'part-3',
      category: 'utai' as const,
      display_order: 3,
    };

    const newAssignment = {
      id: 'assignment-3',
      user_id: 'user-3',
      part_id: 'part-3',
      category: 'utai' as const,
      display_order: 3,
      created_at: '2025-01-03T00:00:00Z',
      updated_at: '2025-01-03T00:00:00Z',
    };

    it('メンバー所属を作成し先頭に追加する', async () => {
      mockCreateMemberAssignment.mockResolvedValue(newAssignment);

      const { result } = renderHook(() => useMemberAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createMemberAssignment(createData);
      });

      expect(mockCreateMemberAssignment).toHaveBeenCalledWith(createData);
      expect(result.current.memberAssignments[0]).toEqual(newAssignment);
      expect(result.current.memberAssignments).toHaveLength(3);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('作成結果を返す', async () => {
      mockCreateMemberAssignment.mockResolvedValue(newAssignment);

      const { result } = renderHook(() => useMemberAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let returnedAssignment: unknown;
      await act(async () => {
        returnedAssignment = await result.current.createMemberAssignment(createData);
      });

      expect(returnedAssignment).toEqual(newAssignment);
    });

    it('作成失敗時にエラーメッセージを設定する', async () => {
      mockCreateMemberAssignment.mockRejectedValue(new Error('作成エラー'));

      const { result } = renderHook(() => useMemberAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.createMemberAssignment(createData)).rejects.toThrow('作成エラー');
      });

      expect(result.current.error).toBe('作成エラー');
      expect(result.current.loading).toBe(false);
    });

    it('Error以外のエラーの場合にデフォルトメッセージを設定する', async () => {
      mockCreateMemberAssignment.mockRejectedValue('unknown');

      const { result } = renderHook(() => useMemberAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.createMemberAssignment(createData)).rejects.toBe('unknown');
      });

      expect(result.current.error).toBe('メンバー所属の作成に失敗しました');
    });
  });

  describe('updateMemberAssignment', () => {
    const updateData = {
      category: 'mai' as const,
      display_order: 10,
    };

    const updatedAssignment = {
      ...mockAssignment1,
      category: 'mai' as const,
      display_order: 10,
    };

    it('メンバー所属を更新し配列内で置き換える', async () => {
      mockUpdateMemberAssignment.mockResolvedValue(updatedAssignment);

      const { result } = renderHook(() => useMemberAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateMemberAssignment('assignment-1', updateData);
      });

      expect(mockUpdateMemberAssignment).toHaveBeenCalledWith('assignment-1', updateData);
      expect(result.current.memberAssignments[0]).toEqual(updatedAssignment);
      expect(result.current.memberAssignments[1]).toEqual(mockAssignment2);
      expect(result.current.memberAssignments).toHaveLength(2);
      expect(result.current.loading).toBe(false);
    });

    it('更新結果を返す', async () => {
      mockUpdateMemberAssignment.mockResolvedValue(updatedAssignment);

      const { result } = renderHook(() => useMemberAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let returnedAssignment: unknown;
      await act(async () => {
        returnedAssignment = await result.current.updateMemberAssignment('assignment-1', updateData);
      });

      expect(returnedAssignment).toEqual(updatedAssignment);
    });

    it('更新失敗時にエラーメッセージを設定する', async () => {
      mockUpdateMemberAssignment.mockRejectedValue(new Error('更新エラー'));

      const { result } = renderHook(() => useMemberAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.updateMemberAssignment('assignment-1', updateData)).rejects.toThrow('更新エラー');
      });

      expect(result.current.error).toBe('更新エラー');
      expect(result.current.loading).toBe(false);
    });

    it('Error以外のエラーの場合にデフォルトメッセージを設定する', async () => {
      mockUpdateMemberAssignment.mockRejectedValue('unknown');

      const { result } = renderHook(() => useMemberAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.updateMemberAssignment('assignment-1', updateData)).rejects.toBe('unknown');
      });

      expect(result.current.error).toBe('メンバー所属の更新に失敗しました');
    });
  });

  describe('deleteMemberAssignment', () => {
    it('メンバー所属を削除し配列から除外する', async () => {
      mockDeleteMemberAssignment.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMemberAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.memberAssignments).toHaveLength(2);

      await act(async () => {
        await result.current.deleteMemberAssignment('assignment-1');
      });

      expect(mockDeleteMemberAssignment).toHaveBeenCalledWith('assignment-1');
      expect(result.current.memberAssignments).toHaveLength(1);
      expect(result.current.memberAssignments[0]).toEqual(mockAssignment2);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('削除失敗時にエラーメッセージを設定する', async () => {
      mockDeleteMemberAssignment.mockRejectedValue(new Error('削除エラー'));

      const { result } = renderHook(() => useMemberAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.deleteMemberAssignment('assignment-1')).rejects.toThrow('削除エラー');
      });

      expect(result.current.error).toBe('削除エラー');
      expect(result.current.loading).toBe(false);
      // 削除失敗時は配列が変更されていないこと
      expect(result.current.memberAssignments).toHaveLength(2);
    });

    it('Error以外のエラーの場合にデフォルトメッセージを設定する', async () => {
      mockDeleteMemberAssignment.mockRejectedValue('unknown');

      const { result } = renderHook(() => useMemberAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.deleteMemberAssignment('assignment-1')).rejects.toBe('unknown');
      });

      expect(result.current.error).toBe('メンバー所属の削除に失敗しました');
    });
  });
});
