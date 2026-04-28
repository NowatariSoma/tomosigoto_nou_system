import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStageAssignments } from '@/features/member-assignments-setting/hooks/useStageAssignments';

// partAssignmentsService をモック（useStageAssignments は partAssignmentsService を使用する）
const mockGetStagesWithPartsAndAssignments = vi.fn();
const mockGetAssignmentsByStage = vi.fn();

vi.mock('@/features/member-assignments-setting/services/part-assignments-service', () => ({
  partAssignmentsService: {
    getStagesWithPartsAndAssignments: (...args: unknown[]) => mockGetStagesWithPartsAndAssignments(...args),
    getAssignmentsByStage: (...args: unknown[]) => mockGetAssignmentsByStage(...args),
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

const mockAssignment2 = {
  id: 'assignment-2',
  user_id: 'user-2',
  part_id: 'part-2',
  category: 'mai' as const,
  display_order: 2,
  created_at: '2025-01-02T00:00:00Z',
  updated_at: '2025-01-02T00:00:00Z',
  user: {
    id: 'user-2',
    name: 'スズキ ハナコ',
    email: 'suzuki@example.com',
    first_name_katakana: 'ハナコ',
    last_name_katakana: 'スズキ',
    first_name_kanji: '花子',
    last_name_kanji: '鈴木',
  },
  part: {
    id: 'part-2',
    name: 'ワキ',
    stage: {
      id: 'stage-1',
      name: '第一回公演',
      performance_date: '2025-06-01',
    },
  },
};

const mockStages = [
  {
    id: 'stage-1',
    name: '第一回公演',
    performance_date: '2025-06-01',
    description: '春の公演',
    parts: [
      {
        id: 'part-1',
        name: 'シテ',
        stage_id: 'stage-1',
        stage_name: '第一回公演',
        performance_date: '2025-06-01',
        member_assignments: [mockAssignment1],
      },
      {
        id: 'part-2',
        name: 'ワキ',
        stage_id: 'stage-1',
        stage_name: '第一回公演',
        performance_date: '2025-06-01',
        member_assignments: [mockAssignment2],
      },
    ],
  },
  {
    id: 'stage-2',
    name: '第二回公演',
    performance_date: '2025-12-01',
    description: '冬の公演',
    parts: [
      {
        id: 'part-3',
        name: 'シテ',
        stage_id: 'stage-2',
        stage_name: '第二回公演',
        performance_date: '2025-12-01',
        member_assignments: [],
      },
    ],
  },
];

describe('useStageAssignments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStagesWithPartsAndAssignments.mockResolvedValue(mockStages);
  });

  it('マウント時に自動的にステージ一覧を取得する', async () => {
    const { result } = renderHook(() => useStageAssignments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetStagesWithPartsAndAssignments).toHaveBeenCalledTimes(1);
    expect(result.current.stages).toEqual(mockStages);
    expect(result.current.error).toBeNull();
  });

  it('初期状態でloadingがtrueに設定される', () => {
    mockGetStagesWithPartsAndAssignments.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useStageAssignments());

    expect(result.current.loading).toBe(true);
    expect(result.current.stages).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('自動取得失敗時にエラーメッセージを設定する', async () => {
    // useEffect内のfetchStagesWithAssignmentsがthrowするためunhandled rejectionを抑制
    const handler = () => {};
    process.on('unhandledRejection', handler);

    mockGetStagesWithPartsAndAssignments.mockRejectedValue(new Error('ステージ取得エラー'));

    const { result } = renderHook(() => useStageAssignments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('ステージ取得エラー');
    expect(result.current.stages).toEqual([]);

    process.removeListener('unhandledRejection', handler);
  });

  it('自動取得でError以外のエラーの場合にデフォルトメッセージを設定する', async () => {
    const handler = () => {};
    process.on('unhandledRejection', handler);

    mockGetStagesWithPartsAndAssignments.mockRejectedValue('unknown');

    const { result } = renderHook(() => useStageAssignments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('舞台所属の取得に失敗しました');

    process.removeListener('unhandledRejection', handler);
  });

  describe('refreshStages', () => {
    it('ステージ一覧を再取得する', async () => {
      const { result } = renderHook(() => useStageAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updatedStages = [mockStages[0]];
      mockGetStagesWithPartsAndAssignments.mockResolvedValue(updatedStages);

      await act(async () => {
        await result.current.refreshStages();
      });

      expect(mockGetStagesWithPartsAndAssignments).toHaveBeenCalledTimes(2);
      expect(result.current.stages).toEqual(updatedStages);
    });

    it('再取得結果を返す', async () => {
      const { result } = renderHook(() => useStageAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockGetStagesWithPartsAndAssignments.mockResolvedValue(mockStages);

      let returnedStages: unknown;
      await act(async () => {
        returnedStages = await result.current.refreshStages();
      });

      expect(returnedStages).toEqual(mockStages);
    });
  });

  describe('fetchAssignmentsByStage', () => {
    it('ステージIDを指定してアサインメントを取得する', async () => {
      const stageAssignments = [mockAssignment1, mockAssignment2];
      mockGetAssignmentsByStage.mockResolvedValue(stageAssignments);

      const { result } = renderHook(() => useStageAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let returnedAssignments: unknown;
      await act(async () => {
        returnedAssignments = await result.current.fetchAssignmentsByStage('stage-1');
      });

      expect(mockGetAssignmentsByStage).toHaveBeenCalledWith('stage-1');
      expect(returnedAssignments).toEqual(stageAssignments);
    });

    it('取得失敗時にエラーメッセージを設定する', async () => {
      mockGetAssignmentsByStage.mockRejectedValue(new Error('舞台所属取得エラー'));

      const { result } = renderHook(() => useStageAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.fetchAssignmentsByStage('stage-1')).rejects.toThrow('舞台所属取得エラー');
      });

      expect(result.current.error).toBe('舞台所属取得エラー');
      expect(result.current.loading).toBe(false);
    });

    it('Error以外のエラーの場合にデフォルトメッセージを設定する', async () => {
      mockGetAssignmentsByStage.mockRejectedValue('unknown');

      const { result } = renderHook(() => useStageAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.fetchAssignmentsByStage('stage-1')).rejects.toBe('unknown');
      });

      expect(result.current.error).toBe('舞台所属の取得に失敗しました');
    });
  });

  describe('getStage', () => {
    it('IDを指定してステージを取得する', async () => {
      const { result } = renderHook(() => useStageAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const stage = result.current.getStage('stage-1');
      expect(stage).toEqual(mockStages[0]);
    });

    it('別のステージIDで取得する', async () => {
      const { result } = renderHook(() => useStageAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const stage = result.current.getStage('stage-2');
      expect(stage).toEqual(mockStages[1]);
    });

    it('存在しないIDの場合はundefinedを返す', async () => {
      const { result } = renderHook(() => useStageAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const stage = result.current.getStage('nonexistent-id');
      expect(stage).toBeUndefined();
    });
  });

  describe('getPart', () => {
    it('ステージIDとパートIDを指定してパートを取得する', async () => {
      const { result } = renderHook(() => useStageAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const part = result.current.getPart('stage-1', 'part-1');
      expect(part).toEqual(mockStages[0].parts[0]);
    });

    it('同じステージ内の別のパートを取得する', async () => {
      const { result } = renderHook(() => useStageAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const part = result.current.getPart('stage-1', 'part-2');
      expect(part).toEqual(mockStages[0].parts[1]);
    });

    it('別のステージのパートを取得する', async () => {
      const { result } = renderHook(() => useStageAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const part = result.current.getPart('stage-2', 'part-3');
      expect(part).toEqual(mockStages[1].parts[0]);
    });

    it('存在しないステージIDの場合はundefinedを返す', async () => {
      const { result } = renderHook(() => useStageAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const part = result.current.getPart('nonexistent-stage', 'part-1');
      expect(part).toBeUndefined();
    });

    it('存在しないパートIDの場合はundefinedを返す', async () => {
      const { result } = renderHook(() => useStageAssignments());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const part = result.current.getPart('stage-1', 'nonexistent-part');
      expect(part).toBeUndefined();
    });
  });
});
