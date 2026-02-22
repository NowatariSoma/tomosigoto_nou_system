import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMemberManagement } from '@/features/member-management/hooks/useMemberManagement';
import { MemberSummary } from '@/features/member-management/types';

// memberManagementServiceをモック
const mockListMembers = vi.fn();
const mockUpdateRole = vi.fn();
const mockUpdateInstructorFlag = vi.fn();
const mockDeleteMember = vi.fn();

vi.mock('@/features/member-management/services/member-management-service', () => ({
  memberManagementService: {
    listMembers: (...args: unknown[]) => mockListMembers(...args),
    updateRole: (...args: unknown[]) => mockUpdateRole(...args),
    updateInstructorFlag: (...args: unknown[]) => mockUpdateInstructorFlag(...args),
    deleteMember: (...args: unknown[]) => mockDeleteMember(...args),
  },
}));

const mockMembers: MemberSummary[] = [
  {
    id: 'member-1',
    name: '田中太郎',
    email: 'tanaka@example.com',
    role: 'admin',
    is_instructor: true,
    last_active_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'member-2',
    name: '佐藤花子',
    email: 'sato@example.com',
    role: 'basic',
    is_instructor: false,
    last_active_at: '2025-01-02T00:00:00Z',
  },
  {
    id: 'member-3',
    name: '鈴木一郎',
    email: 'suzuki@example.com',
    role: 'admin',
    is_instructor: false,
    last_active_at: null,
  },
];

describe('useMemberManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListMembers.mockResolvedValue(mockMembers);
  });

  // ---------------------------------------------------------------------------
  // 初期フェッチ
  // ---------------------------------------------------------------------------
  describe('マウント時の自動フェッチ', () => {
    it('マウント時にlistMembersを呼び出してメンバー一覧を取得する', async () => {
      const { result } = renderHook(() => useMemberManagement());

      // 初期状態: ローディング中
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockListMembers).toHaveBeenCalledTimes(1);
      expect(result.current.members).toEqual(mockMembers);
      expect(result.current.error).toBeNull();
    });

    it('フェッチ失敗時にエラーメッセージを設定する', async () => {
      mockListMembers.mockRejectedValue(new Error('ネットワークエラー'));

      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('ネットワークエラー');
      expect(result.current.members).toEqual([]);
    });

    it('Error以外の例外の場合はデフォルトメッセージを設定する', async () => {
      mockListMembers.mockRejectedValue('string error');

      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('不明なエラーが発生しました');
    });
  });

  // ---------------------------------------------------------------------------
  // adminCount
  // ---------------------------------------------------------------------------
  describe('adminCount', () => {
    it('adminロールのメンバー数を正しく計算する', async () => {
      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // mockMembersにはadminが2人（member-1, member-3）
      expect(result.current.adminCount).toBe(2);
    });

    it('adminが0人の場合は0を返す', async () => {
      mockListMembers.mockResolvedValue([
        { ...mockMembers[1], role: 'basic' as const },
      ]);

      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.adminCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // handleRoleChange
  // ---------------------------------------------------------------------------
  describe('handleRoleChange', () => {
    it('成功時にメンバーのロールを楽観的に更新する', async () => {
      mockUpdateRole.mockResolvedValue({ ...mockMembers[1], role: 'admin' });

      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleRoleChange('member-2', 'admin');
      });

      const updated = result.current.members.find(m => m.id === 'member-2');
      expect(updated?.role).toBe('admin');
      expect(mockUpdateRole).toHaveBeenCalledWith('member-2', { role: 'admin' });
      expect(result.current.error).toBeNull();
    });

    it('同じロールへの変更は何もしない', async () => {
      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleRoleChange('member-1', 'admin');
      });

      expect(mockUpdateRole).not.toHaveBeenCalled();
    });

    it('存在しないメンバーIDの場合は何もしない', async () => {
      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleRoleChange('non-existent', 'admin');
      });

      expect(mockUpdateRole).not.toHaveBeenCalled();
    });

    it('API失敗時にロールをロールバックしエラーを設定する', async () => {
      mockUpdateRole.mockRejectedValue(new Error('権限の更新に失敗'));

      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleRoleChange('member-2', 'admin');
      });

      // ロールバックされている
      const rolledBack = result.current.members.find(m => m.id === 'member-2');
      expect(rolledBack?.role).toBe('basic');
      expect(result.current.error).toBe('権限の更新に失敗');
    });

    it('API失敗時にError以外の例外の場合はデフォルトメッセージを設定する', async () => {
      mockUpdateRole.mockRejectedValue('string error');

      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleRoleChange('member-2', 'admin');
      });

      expect(result.current.error).toBe('権限の更新に失敗しました');
      // ロールバックされている
      const rolledBack = result.current.members.find(m => m.id === 'member-2');
      expect(rolledBack?.role).toBe('basic');
    });
  });

  // ---------------------------------------------------------------------------
  // handleInstructorFlagChange
  // ---------------------------------------------------------------------------
  describe('handleInstructorFlagChange', () => {
    it('成功時に指導者フラグを楽観的に更新する', async () => {
      mockUpdateInstructorFlag.mockResolvedValue({ ...mockMembers[1], is_instructor: true });

      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleInstructorFlagChange('member-2', true);
      });

      const updated = result.current.members.find(m => m.id === 'member-2');
      expect(updated?.is_instructor).toBe(true);
      expect(mockUpdateInstructorFlag).toHaveBeenCalledWith('member-2', { is_instructor: true });
      expect(result.current.error).toBeNull();
    });

    it('同じ値への変更は何もしない', async () => {
      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // member-2のis_instructorはfalse
      await act(async () => {
        await result.current.handleInstructorFlagChange('member-2', false);
      });

      expect(mockUpdateInstructorFlag).not.toHaveBeenCalled();
    });

    it('存在しないメンバーIDの場合は何もしない', async () => {
      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleInstructorFlagChange('non-existent', true);
      });

      expect(mockUpdateInstructorFlag).not.toHaveBeenCalled();
    });

    it('API失敗時に指導者フラグをロールバックしエラーを設定する', async () => {
      mockUpdateInstructorFlag.mockRejectedValue(new Error('指導者フラグの更新に失敗'));

      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleInstructorFlagChange('member-2', true);
      });

      // ロールバックされている
      const rolledBack = result.current.members.find(m => m.id === 'member-2');
      expect(rolledBack?.is_instructor).toBe(false);
      expect(result.current.error).toBe('指導者フラグの更新に失敗');
    });

    it('API失敗時にError以外の例外の場合はデフォルトメッセージを設定する', async () => {
      mockUpdateInstructorFlag.mockRejectedValue('string error');

      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleInstructorFlagChange('member-2', true);
      });

      expect(result.current.error).toBe('指導者フラグの更新に失敗しました');
      // ロールバックされている
      const rolledBack = result.current.members.find(m => m.id === 'member-2');
      expect(rolledBack?.is_instructor).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // handleRemoveMember
  // ---------------------------------------------------------------------------
  describe('handleRemoveMember', () => {
    it('成功時にメンバーを楽観的に削除する', async () => {
      mockDeleteMember.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.members).toHaveLength(3);

      await act(async () => {
        await result.current.handleRemoveMember('member-2');
      });

      expect(result.current.members).toHaveLength(2);
      expect(result.current.members.find(m => m.id === 'member-2')).toBeUndefined();
      expect(mockDeleteMember).toHaveBeenCalledWith('member-2');
      expect(result.current.error).toBeNull();
    });

    it('API失敗時にメンバーリストをロールバックしエラーを設定する', async () => {
      mockDeleteMember.mockRejectedValue(new Error('アカウントの削除に失敗'));

      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleRemoveMember('member-2');
      });

      // ロールバックされている
      expect(result.current.members).toHaveLength(3);
      expect(result.current.members.find(m => m.id === 'member-2')).toBeDefined();
      expect(result.current.error).toBe('アカウントの削除に失敗');
    });

    it('API失敗時にError以外の例外の場合はデフォルトメッセージを設定する', async () => {
      mockDeleteMember.mockRejectedValue('string error');

      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleRemoveMember('member-2');
      });

      expect(result.current.error).toBe('アカウントの削除に失敗しました');
      // ロールバックされている
      expect(result.current.members).toHaveLength(3);
    });
  });

  // ---------------------------------------------------------------------------
  // fetchMembers（手動再フェッチ）
  // ---------------------------------------------------------------------------
  describe('fetchMembers（手動再フェッチ）', () => {
    it('手動でfetchMembersを呼び出してメンバーを再取得できる', async () => {
      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockListMembers).toHaveBeenCalledTimes(1);

      const updatedMembers = [mockMembers[0]];
      mockListMembers.mockResolvedValue(updatedMembers);

      await act(async () => {
        await result.current.fetchMembers();
      });

      expect(mockListMembers).toHaveBeenCalledTimes(2);
      expect(result.current.members).toEqual(updatedMembers);
    });

    it('再フェッチ時にエラーが発生した場合、以前のエラーがクリアされ新しいエラーが設定される', async () => {
      const { result } = renderHook(() => useMemberManagement());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockListMembers.mockRejectedValue(new Error('再取得失敗'));

      await act(async () => {
        await result.current.fetchMembers();
      });

      expect(result.current.error).toBe('再取得失敗');
    });
  });
});
