import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStages } from '@/features/parts-setting/hooks/useStages';
import type { StageData } from '@/features/parts-setting/services/stages-service';

// stagesServiceをモック
const mockGetStages = vi.fn();
const mockGetStage = vi.fn();
const mockCreateStage = vi.fn();
const mockUpdateStage = vi.fn();
const mockDeleteStage = vi.fn();

vi.mock('@/features/parts-setting/services/stages-service', () => ({
  stagesService: {
    getStages: (...args: unknown[]) => mockGetStages(...args),
    getStage: (...args: unknown[]) => mockGetStage(...args),
    createStage: (...args: unknown[]) => mockCreateStage(...args),
    updateStage: (...args: unknown[]) => mockUpdateStage(...args),
    deleteStage: (...args: unknown[]) => mockDeleteStage(...args),
  },
}));

const mockStage1: StageData = {
  id: 'stage-1',
  name: '第1回定期演奏会',
  description: '春の定期演奏会',
  performanceDate: '2024-04-01',
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockStage2: StageData = {
  id: 'stage-2',
  name: '第2回定期演奏会',
  description: '秋の定期演奏会',
  performanceDate: '2024-10-01',
  status: 'active',
  createdAt: '2024-01-02T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

describe('useStages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- 自動取得 ---

  it('マウント時にfetchStagesを自動実行する', async () => {
    mockGetStages.mockResolvedValue([mockStage1, mockStage2]);

    const { result } = renderHook(() => useStages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetStages).toHaveBeenCalledTimes(1);
    expect(result.current.stages).toEqual([mockStage1, mockStage2]);
    expect(result.current.error).toBeNull();
  });

  it('マウント時の自動取得中はloadingがtrueになる', async () => {
    let resolvePromise: (value: StageData[]) => void;
    mockGetStages.mockReturnValue(
      new Promise<StageData[]>((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { result } = renderHook(() => useStages());

    // useEffect発火後のloadingを確認
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    await act(async () => {
      resolvePromise!([mockStage1]);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.stages).toEqual([mockStage1]);
  });

  it('マウント時の自動取得失敗時にErrorインスタンスのメッセージをerrorに設定する', async () => {
    mockGetStages.mockRejectedValue(new Error('ステージ取得失敗'));

    const { result } = renderHook(() => useStages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('ステージ取得失敗');
    expect(result.current.stages).toEqual([]);
  });

  it('マウント時の自動取得失敗時にError以外の場合はデフォルトメッセージを設定する', async () => {
    mockGetStages.mockRejectedValue('unknown error');

    const { result } = renderHook(() => useStages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('舞台の取得に失敗しました');
  });

  // --- fetchStages (明示的呼び出し) ---

  it('fetchStagesを明示的に呼び出してステージ一覧を再取得する', async () => {
    mockGetStages.mockResolvedValue([mockStage1]);

    const { result } = renderHook(() => useStages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stages).toEqual([mockStage1]);

    // 再取得
    mockGetStages.mockResolvedValue([mockStage1, mockStage2]);

    await act(async () => {
      await result.current.fetchStages();
    });

    expect(mockGetStages).toHaveBeenCalledTimes(2);
    expect(result.current.stages).toEqual([mockStage1, mockStage2]);
  });

  // --- getStage ---

  it('getStageでIDに一致するステージを返す', async () => {
    mockGetStages.mockResolvedValue([mockStage1, mockStage2]);

    const { result } = renderHook(() => useStages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const stage = result.current.getStage('stage-1');
    expect(stage).toEqual(mockStage1);
  });

  it('getStageで存在しないIDの場合はundefinedを返す', async () => {
    mockGetStages.mockResolvedValue([mockStage1]);

    const { result } = renderHook(() => useStages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const stage = result.current.getStage('non-existent');
    expect(stage).toBeUndefined();
  });

  // --- createStage ---

  it('createStageでステージを作成しリストの先頭に追加する', async () => {
    mockGetStages.mockResolvedValue([mockStage1]);
    mockCreateStage.mockResolvedValue(mockStage2);

    const { result } = renderHook(() => useStages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let createdStage: StageData | undefined;
    await act(async () => {
      createdStage = await result.current.createStage({
        name: '第2回定期演奏会',
        description: '秋の定期演奏会',
        performanceDate: '2024-10-01',
      });
    });

    expect(mockCreateStage).toHaveBeenCalledWith({
      name: '第2回定期演奏会',
      description: '秋の定期演奏会',
      performanceDate: '2024-10-01',
    });
    expect(createdStage).toEqual(mockStage2);
    // 新しいステージがリスト先頭に追加される
    expect(result.current.stages).toEqual([mockStage2, mockStage1]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('createStage失敗時にエラーを設定しthrowする', async () => {
    mockGetStages.mockResolvedValue([]);
    mockCreateStage.mockRejectedValue(new Error('ステージ作成失敗'));

    const { result } = renderHook(() => useStages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.createStage({
          name: 'テスト',
        });
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toBeInstanceOf(Error);
    expect((thrownError as Error).message).toBe('ステージ作成失敗');
    expect(result.current.error).toBe('ステージ作成失敗');
    expect(result.current.loading).toBe(false);
  });

  it('createStage失敗時にError以外の場合はデフォルトメッセージを設定する', async () => {
    mockGetStages.mockResolvedValue([]);
    mockCreateStage.mockRejectedValue('unknown');

    const { result } = renderHook(() => useStages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.createStage({ name: 'テスト' });
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toBe('unknown');
    expect(result.current.error).toBe('舞台の作成に失敗しました');
  });

  // --- updateStage ---

  it('updateStageでステージを更新しリスト内のデータを差し替える', async () => {
    mockGetStages.mockResolvedValue([mockStage1, mockStage2]);

    const updatedStage: StageData = {
      ...mockStage1,
      name: '第1回定期演奏会（更新済み）',
      updatedAt: '2024-02-01T00:00:00Z',
    };
    mockUpdateStage.mockResolvedValue(updatedStage);

    const { result } = renderHook(() => useStages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let returnedStage: StageData | undefined;
    await act(async () => {
      returnedStage = await result.current.updateStage('stage-1', {
        name: '第1回定期演奏会（更新済み）',
      });
    });

    expect(mockUpdateStage).toHaveBeenCalledWith('stage-1', {
      name: '第1回定期演奏会（更新済み）',
    });
    expect(returnedStage).toEqual(updatedStage);
    expect(result.current.stages[0]).toEqual(updatedStage);
    expect(result.current.stages[1]).toEqual(mockStage2);
    expect(result.current.loading).toBe(false);
  });

  it('updateStage失敗時にエラーを設定しthrowする', async () => {
    mockGetStages.mockResolvedValue([]);
    mockUpdateStage.mockRejectedValue(new Error('ステージ更新失敗'));

    const { result } = renderHook(() => useStages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.updateStage('stage-1', { name: 'テスト' });
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toBeInstanceOf(Error);
    expect((thrownError as Error).message).toBe('ステージ更新失敗');
    expect(result.current.error).toBe('ステージ更新失敗');
    expect(result.current.loading).toBe(false);
  });

  it('updateStage失敗時にError以外の場合はデフォルトメッセージを設定する', async () => {
    mockGetStages.mockResolvedValue([]);
    mockUpdateStage.mockRejectedValue({ code: 500 });

    const { result } = renderHook(() => useStages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.updateStage('stage-1', { name: 'テスト' });
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toEqual({ code: 500 });
    expect(result.current.error).toBe('舞台の更新に失敗しました');
  });

  // --- deleteStage ---

  it('deleteStageでステージを削除しリストから除去する', async () => {
    mockGetStages.mockResolvedValue([mockStage1, mockStage2]);
    mockDeleteStage.mockResolvedValue(undefined);

    const { result } = renderHook(() => useStages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteStage('stage-1');
    });

    expect(mockDeleteStage).toHaveBeenCalledWith('stage-1');
    expect(result.current.stages).toEqual([mockStage2]);
    expect(result.current.loading).toBe(false);
  });

  it('deleteStage失敗時にエラーを設定しthrowする', async () => {
    mockGetStages.mockResolvedValue([]);
    mockDeleteStage.mockRejectedValue(new Error('ステージ削除失敗'));

    const { result } = renderHook(() => useStages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.deleteStage('stage-1');
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toBeInstanceOf(Error);
    expect((thrownError as Error).message).toBe('ステージ削除失敗');
    expect(result.current.error).toBe('ステージ削除失敗');
    expect(result.current.loading).toBe(false);
  });

  it('deleteStage失敗時にError以外の場合はデフォルトメッセージを設定する', async () => {
    mockGetStages.mockResolvedValue([]);
    mockDeleteStage.mockRejectedValue(null);

    const { result } = renderHook(() => useStages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.deleteStage('stage-1');
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toBe(null);
    expect(result.current.error).toBe('舞台の削除に失敗しました');
  });
});
