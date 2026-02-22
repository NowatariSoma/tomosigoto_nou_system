import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminAttendance } from '@/features/admin-attendance/hooks/use-admin-attendance';

// attendance-serviceをモック
const mockGetAttendancesByPractice = vi.fn();
const mockGetUsersWithAttendance = vi.fn();
const mockBulkUpdateAttendances = vi.fn();
const mockUpsertAttendance = vi.fn();

vi.mock('@/features/admin-attendance/services/attendance-service', () => ({
  adminAttendanceService: {
    getAttendancesByPractice: (...args: unknown[]) => mockGetAttendancesByPractice(...args),
    getUsersWithAttendance: (...args: unknown[]) => mockGetUsersWithAttendance(...args),
    bulkUpdateAttendances: (...args: unknown[]) => mockBulkUpdateAttendances(...args),
    upsertAttendance: (...args: unknown[]) => mockUpsertAttendance(...args),
  },
}));

// user-serviceをモック
const mockGetUsers = vi.fn();

vi.mock('@/features/admin-attendance/services/user-service', () => ({
  adminUserService: {
    getUsers: (...args: unknown[]) => mockGetUsers(...args),
  },
}));

// fetchApiをモック（練習スケジュール取得用）
const mockFetchApi = vi.fn();

vi.mock('@/lib/api', () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

// --- テストデータ ---

const mockUsers = [
  {
    id: 'user-1',
    name: '田中太郎',
    email: 'tanaka@example.com',
    first_name_kanji: '太郎',
    last_name_kanji: '田中',
  },
  {
    id: 'user-2',
    name: '佐藤花子',
    email: 'sato@example.com',
    first_name_kanji: '花子',
    last_name_kanji: '佐藤',
  },
];

const mockPracticeSchedules = [
  {
    id: 'ps-1',
    schedule_date: '2024-06-01',
    start_time: '10:00',
    end_time: '12:00',
    division_count: 1,
    title: '通常練習',
  },
  {
    id: 'ps-2',
    schedule_date: '2024-06-08',
    start_time: '13:00',
    end_time: '15:00',
    division_count: 1,
    title: '特別練習',
  },
];

const mockAttendance = {
  id: 'att-1',
  practice_schedule_id: 'ps-1',
  user_id: 'user-1',
  status: 'present' as const,
  notes: 'メモ',
  available_from: '10:00',
  available_to: '12:00',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  created_by: 'admin',
  updated_by: 'admin',
};

const mockAttendances = [
  mockAttendance,
  {
    id: 'att-2',
    practice_schedule_id: 'ps-1',
    user_id: 'user-2',
    status: 'absent' as const,
    notes: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'admin',
    updated_by: 'admin',
  },
];

const mockUsersWithAttendanceResponse = [
  {
    user: mockUsers[0],
    attendance: mockAttendance,
  },
  {
    user: mockUsers[1],
    attendance: null,
  },
];

// ヘルパー: fetchApi用のレスポンスモック
function mockJsonResponse(data: unknown) {
  return { json: vi.fn().mockResolvedValue(data) };
}

describe('useAdminAttendance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // マウント時の自動取得用デフォルトモック
    mockGetUsers.mockResolvedValue(mockUsers);
    mockFetchApi.mockResolvedValue(mockJsonResponse(mockPracticeSchedules));
  });

  // ==========================================
  // 初期化・自動取得
  // ==========================================

  describe('初期状態と自動取得', () => {
    it('マウント時にユーザー一覧を自動取得する', async () => {
      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetUsers).toHaveBeenCalledTimes(1);
      expect(result.current.users).toEqual(mockUsers);
    });

    it('マウント時に練習スケジュール一覧を自動取得する', async () => {
      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetchApi).toHaveBeenCalledWith('/practice_schedules/');
      expect(result.current.practiceSchedules).toEqual(mockPracticeSchedules);
    });

    it('初期状態のattendancesは空配列', async () => {
      const { result } = renderHook(() => useAdminAttendance());

      expect(result.current.attendances).toEqual([]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('初期状態のusersWithAttendanceは空配列', async () => {
      const { result } = renderHook(() => useAdminAttendance());

      expect(result.current.usersWithAttendance).toEqual([]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('初期状態のerrorはnull', async () => {
      const { result } = renderHook(() => useAdminAttendance());

      expect(result.current.error).toBeNull();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  // ==========================================
  // fetchAttendancesByPractice
  // ==========================================

  describe('fetchAttendancesByPractice', () => {
    it('練習スケジュールIDで出席記録を取得してstateに設定する', async () => {
      mockGetAttendancesByPractice.mockResolvedValue(mockAttendances);

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.fetchAttendancesByPractice('ps-1');
      });

      expect(mockGetAttendancesByPractice).toHaveBeenCalledWith('ps-1');
      expect(result.current.attendances).toEqual(mockAttendances);
    });

    it('取得エラー時にerrorを設定する', async () => {
      mockGetAttendancesByPractice.mockRejectedValue(new Error('出席記録の取得に失敗'));

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.fetchAttendancesByPractice('ps-1');
      });

      expect(result.current.error).toBe('出席記録の取得に失敗');
    });

    it('Error以外の例外時にデフォルトエラーメッセージを設定する', async () => {
      mockGetAttendancesByPractice.mockRejectedValue('string error');

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.fetchAttendancesByPractice('ps-1');
      });

      expect(result.current.error).toBe('出席記録の取得に失敗しました');
    });
  });

  // ==========================================
  // bulkUpdateAttendances
  // ==========================================

  describe('bulkUpdateAttendances', () => {
    it('一括更新後に再取得して結果を返す', async () => {
      const attendancesToCreate = [
        { practice_schedule_id: 'ps-1', user_id: 'user-1', status: 'present' as const },
        { practice_schedule_id: 'ps-1', user_id: 'user-2', status: 'absent' as const },
      ];
      mockBulkUpdateAttendances.mockResolvedValue(mockAttendances);
      mockGetAttendancesByPractice.mockResolvedValue(mockAttendances);

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let returnedData: unknown;
      await act(async () => {
        returnedData = await result.current.bulkUpdateAttendances('ps-1', attendancesToCreate);
      });

      expect(mockBulkUpdateAttendances).toHaveBeenCalledWith('ps-1', attendancesToCreate);
      expect(returnedData).toEqual(mockAttendances);
      // 更新後にfetchAttendancesByPracticeが呼ばれる
      expect(mockGetAttendancesByPractice).toHaveBeenCalledWith('ps-1');
    });

    it('一括更新エラー時にerrorを設定してthrowする', async () => {
      mockBulkUpdateAttendances.mockRejectedValue(new Error('一括更新失敗'));

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(
          result.current.bulkUpdateAttendances('ps-1', [])
        ).rejects.toThrow('一括更新失敗');
      });

      expect(result.current.error).toBe('一括更新失敗');
    });

    it('Error以外の例外時にデフォルトエラーメッセージを設定する', async () => {
      mockBulkUpdateAttendances.mockRejectedValue('unknown');

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(
          result.current.bulkUpdateAttendances('ps-1', [])
        ).rejects.toBeTruthy();
      });

      expect(result.current.error).toBe('一括更新に失敗しました');
    });
  });

  // ==========================================
  // fetchUsersWithAttendance
  // ==========================================

  describe('fetchUsersWithAttendance', () => {
    it('パラメータなしでユーザー出席一覧を取得する', async () => {
      mockGetUsersWithAttendance.mockResolvedValue(mockUsersWithAttendanceResponse);

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let returnedData: unknown;
      await act(async () => {
        returnedData = await result.current.fetchUsersWithAttendance();
      });

      expect(mockGetUsersWithAttendance).toHaveBeenCalledWith(undefined);
      expect(returnedData).toEqual(mockUsersWithAttendanceResponse);
      expect(result.current.usersWithAttendance).toEqual(mockUsersWithAttendanceResponse);
    });

    it('パラメータ付きでユーザー出席一覧を取得する', async () => {
      mockGetUsersWithAttendance.mockResolvedValue(mockUsersWithAttendanceResponse);

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const params = { practice_schedule_id: 'ps-1', status: 'present' };
      await act(async () => {
        await result.current.fetchUsersWithAttendance(params);
      });

      expect(mockGetUsersWithAttendance).toHaveBeenCalledWith(params);
    });

    it('取得エラー時にerrorを設定してthrowする', async () => {
      mockGetUsersWithAttendance.mockRejectedValue(new Error('取得エラー'));

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(
          result.current.fetchUsersWithAttendance()
        ).rejects.toThrow('取得エラー');
      });

      expect(result.current.error).toBe('取得エラー');
    });

    it('Error以外の例外時にデフォルトエラーメッセージを設定する', async () => {
      mockGetUsersWithAttendance.mockRejectedValue(42);

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(
          result.current.fetchUsersWithAttendance()
        ).rejects.toBeTruthy();
      });

      expect(result.current.error).toBe('ユーザー一覧の取得に失敗しました');
    });
  });

  // ==========================================
  // upsertAttendance（楽観的更新）
  // ==========================================

  describe('upsertAttendance', () => {
    it('出席記録を作成/更新して結果を返す', async () => {
      const attendanceData = {
        practice_schedule_id: 'ps-1',
        user_id: 'user-1',
        status: 'late' as const,
        notes: '遅刻連絡あり',
      };
      const upsertedAttendance = {
        ...mockAttendance,
        status: 'late' as const,
        notes: '遅刻連絡あり',
      };
      mockUpsertAttendance.mockResolvedValue(upsertedAttendance);

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let returnedData: unknown;
      await act(async () => {
        returnedData = await result.current.upsertAttendance(attendanceData);
      });

      expect(mockUpsertAttendance).toHaveBeenCalledWith(attendanceData);
      expect(returnedData).toEqual(upsertedAttendance);
    });

    it('楽観的更新でusersWithAttendanceの該当ユーザーの出席記録を更新する', async () => {
      // まずfetchUsersWithAttendanceでデータをセット
      mockGetUsersWithAttendance.mockResolvedValue(mockUsersWithAttendanceResponse);

      const upsertedAttendance = {
        ...mockAttendance,
        status: 'late' as const,
        notes: '遅刻',
      };
      mockUpsertAttendance.mockResolvedValue(upsertedAttendance);

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // usersWithAttendanceにデータをセット
      await act(async () => {
        await result.current.fetchUsersWithAttendance();
      });

      expect(result.current.usersWithAttendance).toHaveLength(2);

      // upsert実行
      await act(async () => {
        await result.current.upsertAttendance({
          practice_schedule_id: 'ps-1',
          user_id: 'user-1',
          status: 'late',
          notes: '遅刻',
        });
      });

      // user-1の出席記録が楽観的に更新されていること
      const user1Record = result.current.usersWithAttendance.find(
        item => item.user.id === 'user-1'
      );
      expect(user1Record?.attendance?.status).toBe('late');
      expect(user1Record?.attendance?.notes).toBe('遅刻');

      // user-2の出席記録は変更されていないこと
      const user2Record = result.current.usersWithAttendance.find(
        item => item.user.id === 'user-2'
      );
      expect(user2Record?.attendance).toBeNull();
    });

    it('upsertエラー時にerrorを設定してthrowする', async () => {
      mockUpsertAttendance.mockRejectedValue(new Error('出席登録エラー'));

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(
          result.current.upsertAttendance({
            practice_schedule_id: 'ps-1',
            user_id: 'user-1',
            status: 'present',
          })
        ).rejects.toThrow('出席登録エラー');
      });

      expect(result.current.error).toBe('出席登録エラー');
    });

    it('Error以外の例外時にデフォルトエラーメッセージを設定する', async () => {
      mockUpsertAttendance.mockRejectedValue('unknown error');

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(
          result.current.upsertAttendance({
            practice_schedule_id: 'ps-1',
            user_id: 'user-1',
            status: 'present',
          })
        ).rejects.toBeTruthy();
      });

      expect(result.current.error).toBe('出席登録に失敗しました');
    });
  });

  // ==========================================
  // getUsersWithAttendance（同期マージ関数）
  // ==========================================

  describe('getUsersWithAttendance', () => {
    it('usersとattendancesをマージして返す', async () => {
      mockGetAttendancesByPractice.mockResolvedValue(mockAttendances);

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // attendancesをセット
      await act(async () => {
        await result.current.fetchAttendancesByPractice('ps-1');
      });

      const merged = result.current.getUsersWithAttendance('ps-1');

      expect(merged).toHaveLength(2);
      // user-1はatt-1の出席記録を持つ
      expect(merged[0].id).toBe('user-1');
      expect(merged[0].attendance?.id).toBe('att-1');
      expect(merged[0].attendance?.status).toBe('present');
      // user-2はatt-2の出席記録を持つ
      expect(merged[1].id).toBe('user-2');
      expect(merged[1].attendance?.id).toBe('att-2');
      expect(merged[1].attendance?.status).toBe('absent');
    });

    it('該当する出席記録がないユーザーのattendanceはundefined', async () => {
      // ps-2に対する出席記録はない
      mockGetAttendancesByPractice.mockResolvedValue(mockAttendances);

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.fetchAttendancesByPractice('ps-1');
      });

      const merged = result.current.getUsersWithAttendance('ps-2');

      expect(merged).toHaveLength(2);
      expect(merged[0].attendance).toBeUndefined();
      expect(merged[1].attendance).toBeUndefined();
    });

    it('attendancesが空の場合は全ユーザーのattendanceがundefined', async () => {
      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const merged = result.current.getUsersWithAttendance('ps-1');

      expect(merged).toHaveLength(2);
      merged.forEach(user => {
        expect(user.attendance).toBeUndefined();
      });
    });
  });

  // ==========================================
  // エラーハンドリング（自動取得）
  // ==========================================

  describe('自動取得のエラーハンドリング', () => {
    it('ユーザー取得失敗時にerrorを設定する', async () => {
      mockGetUsers.mockRejectedValue(new Error('ユーザー取得失敗'));

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.users).toEqual([]);
    });

    it('ユーザー取得でError以外の例外時にデフォルトメッセージを設定する', async () => {
      mockGetUsers.mockRejectedValue('unexpected');

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('ユーザー一覧の取得に失敗しました');
    });

    it('練習スケジュール取得失敗時にerrorを設定する', async () => {
      mockFetchApi.mockRejectedValue(new Error('スケジュール取得失敗'));

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.practiceSchedules).toEqual([]);
    });

    it('練習スケジュール取得でError以外の例外時にデフォルトメッセージを設定する', async () => {
      mockFetchApi.mockRejectedValue({ status: 500 });

      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('練習予定一覧の取得に失敗しました');
    });
  });

  // ==========================================
  // refetch関数
  // ==========================================

  describe('refetch関数', () => {
    it('refetchUsersでユーザー一覧を再取得する', async () => {
      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetUsers).toHaveBeenCalledTimes(1);

      const updatedUsers = [
        ...mockUsers,
        { id: 'user-3', name: '鈴木一郎', email: 'suzuki@example.com' },
      ];
      mockGetUsers.mockResolvedValue(updatedUsers);

      await act(async () => {
        await result.current.refetchUsers();
      });

      expect(mockGetUsers).toHaveBeenCalledTimes(2);
      expect(result.current.users).toEqual(updatedUsers);
    });

    it('refetchPracticeSchedulesで練習スケジュールを再取得する', async () => {
      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetchApi).toHaveBeenCalledTimes(1);

      const updatedSchedules = [
        ...mockPracticeSchedules,
        {
          id: 'ps-3',
          schedule_date: '2024-06-15',
          start_time: '09:00',
          end_time: '11:00',
          division_count: 1,
        },
      ];
      mockFetchApi.mockResolvedValue(mockJsonResponse(updatedSchedules));

      await act(async () => {
        await result.current.refetchPracticeSchedules();
      });

      expect(mockFetchApi).toHaveBeenCalledTimes(2);
      expect(result.current.practiceSchedules).toEqual(updatedSchedules);
    });
  });

  // ==========================================
  // loading状態
  // ==========================================

  describe('loading状態', () => {
    it('API呼び出し中にloadingがtrueになる', async () => {
      // resolveを遅延させる
      let resolveUsers!: (value: unknown[]) => void;
      mockGetUsers.mockReturnValue(
        new Promise(resolve => { resolveUsers = resolve; })
      );

      const { result } = renderHook(() => useAdminAttendance());

      // fetchUsers実行中はloadingがtrue
      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveUsers(mockUsers);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  // ==========================================
  // 返却値の確認
  // ==========================================

  describe('返却値', () => {
    it('必要な全てのプロパティと関数が返される', async () => {
      const { result } = renderHook(() => useAdminAttendance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // state
      expect(result.current).toHaveProperty('attendances');
      expect(result.current).toHaveProperty('users');
      expect(result.current).toHaveProperty('practiceSchedules');
      expect(result.current).toHaveProperty('usersWithAttendance');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');

      // functions
      expect(typeof result.current.fetchAttendancesByPractice).toBe('function');
      expect(typeof result.current.fetchUsersWithAttendance).toBe('function');
      expect(typeof result.current.bulkUpdateAttendances).toBe('function');
      expect(typeof result.current.upsertAttendance).toBe('function');
      expect(typeof result.current.getUsersWithAttendance).toBe('function');
      expect(typeof result.current.refetchUsers).toBe('function');
      expect(typeof result.current.refetchPracticeSchedules).toBe('function');
    });
  });
});
