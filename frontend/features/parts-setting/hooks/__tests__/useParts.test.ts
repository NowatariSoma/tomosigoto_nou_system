import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useParts } from '@/features/parts-setting/hooks/useParts';
import type { PartData } from '@/features/parts-setting/services/parts-service';

// partsServiceをモック
const mockGetPartsByStageId = vi.fn();
const mockGetPart = vi.fn();
const mockCreatePart = vi.fn();
const mockCreateParts = vi.fn();
const mockUpdatePart = vi.fn();
const mockDeletePart = vi.fn();
const mockDeletePartsByStageId = vi.fn();

vi.mock('@/features/parts-setting/services/parts-service', () => ({
  partsService: {
    getPartsByStageId: (...args: unknown[]) => mockGetPartsByStageId(...args),
    getPart: (...args: unknown[]) => mockGetPart(...args),
    createPart: (...args: unknown[]) => mockCreatePart(...args),
    createParts: (...args: unknown[]) => mockCreateParts(...args),
    updatePart: (...args: unknown[]) => mockUpdatePart(...args),
    deletePart: (...args: unknown[]) => mockDeletePart(...args),
    deletePartsByStageId: (...args: unknown[]) => mockDeletePartsByStageId(...args),
  },
}));

const mockPart1: PartData = {
  id: 'part-1',
  stageId: 'stage-1',
  name: 'ソプラノ',
  description: 'ソプラノパート',
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockPart2: PartData = {
  id: 'part-2',
  stageId: 'stage-1',
  name: 'アルト',
  description: 'アルトパート',
  status: 'active',
  createdAt: '2024-01-02T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

const mockPart3: PartData = {
  id: 'part-3',
  stageId: 'stage-2',
  name: 'テナー',
  description: 'テナーパート',
  status: 'active',
  createdAt: '2024-01-03T00:00:00Z',
  updatedAt: '2024-01-03T00:00:00Z',
};

describe('useParts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- 初期状態 ---

  it('初期状態を正しく設定する', () => {
    const { result } = renderHook(() => useParts());

    expect(result.current.parts).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('マウント時に自動取得しない', () => {
    renderHook(() => useParts('stage-1'));

    expect(mockGetPartsByStageId).not.toHaveBeenCalled();
  });

  // --- fetchParts ---

  it('fetchPartsでパート一覧を取得する', async () => {
    mockGetPartsByStageId.mockResolvedValue([mockPart1, mockPart2]);

    const { result } = renderHook(() => useParts());

    await act(async () => {
      await result.current.fetchParts('stage-1');
    });

    expect(mockGetPartsByStageId).toHaveBeenCalledWith('stage-1');
    expect(result.current.parts).toEqual([mockPart1, mockPart2]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetchParts中はloadingがtrueになる', async () => {
    let resolvePromise: (value: PartData[]) => void;
    mockGetPartsByStageId.mockReturnValue(
      new Promise<PartData[]>((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { result } = renderHook(() => useParts());

    let fetchPromise: Promise<void>;
    act(() => {
      fetchPromise = result.current.fetchParts('stage-1');
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!([mockPart1]);
      await fetchPromise!;
    });

    expect(result.current.loading).toBe(false);
  });

  it('fetchParts失敗時にErrorインスタンスのメッセージをerrorに設定する', async () => {
    mockGetPartsByStageId.mockRejectedValue(new Error('パート取得失敗'));

    const { result } = renderHook(() => useParts());

    await act(async () => {
      await result.current.fetchParts('stage-1');
    });

    expect(result.current.error).toBe('パート取得失敗');
    expect(result.current.loading).toBe(false);
  });

  it('fetchParts失敗時にError以外の場合はデフォルトメッセージを設定する', async () => {
    mockGetPartsByStageId.mockRejectedValue('unknown error');

    const { result } = renderHook(() => useParts());

    await act(async () => {
      await result.current.fetchParts('stage-1');
    });

    expect(result.current.error).toBe('パートの取得に失敗しました');
    expect(result.current.loading).toBe(false);
  });

  // --- getPart ---

  it('getPartでIDに一致するパートを返す', async () => {
    mockGetPartsByStageId.mockResolvedValue([mockPart1, mockPart2]);

    const { result } = renderHook(() => useParts());

    await act(async () => {
      await result.current.fetchParts('stage-1');
    });

    const part = result.current.getPart('part-1');
    expect(part).toEqual(mockPart1);
  });

  it('getPartで存在しないIDの場合はundefinedを返す', async () => {
    mockGetPartsByStageId.mockResolvedValue([mockPart1]);

    const { result } = renderHook(() => useParts());

    await act(async () => {
      await result.current.fetchParts('stage-1');
    });

    const part = result.current.getPart('non-existent');
    expect(part).toBeUndefined();
  });

  // --- createPart ---

  it('createPartでパートを作成しリストに追加する', async () => {
    mockGetPartsByStageId.mockResolvedValue([mockPart1]);
    mockCreatePart.mockResolvedValue(mockPart2);

    const { result } = renderHook(() => useParts());

    await act(async () => {
      await result.current.fetchParts('stage-1');
    });

    let createdPart: PartData | undefined;
    await act(async () => {
      createdPart = await result.current.createPart({
        stageId: 'stage-1',
        name: 'アルト',
        description: 'アルトパート',
      });
    });

    expect(mockCreatePart).toHaveBeenCalledWith({
      stageId: 'stage-1',
      name: 'アルト',
      description: 'アルトパート',
    });
    expect(createdPart).toEqual(mockPart2);
    expect(result.current.parts).toEqual([mockPart1, mockPart2]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('createPart失敗時にエラーを設定しthrowする', async () => {
    mockCreatePart.mockRejectedValue(new Error('パート作成失敗'));

    const { result } = renderHook(() => useParts());

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.createPart({
          stageId: 'stage-1',
          name: 'テスト',
        });
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toBeInstanceOf(Error);
    expect((thrownError as Error).message).toBe('パート作成失敗');
    expect(result.current.error).toBe('パート作成失敗');
    expect(result.current.loading).toBe(false);
  });

  it('createPart失敗時にError以外の場合はデフォルトメッセージを設定する', async () => {
    mockCreatePart.mockRejectedValue('unknown');

    const { result } = renderHook(() => useParts());

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.createPart({
          stageId: 'stage-1',
          name: 'テスト',
        });
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toBe('unknown');
    expect(result.current.error).toBe('パートの作成に失敗しました');
  });

  // --- createParts (bulk) ---

  it('createPartsで複数パートを一括作成しリストに追加する', async () => {
    mockGetPartsByStageId.mockResolvedValue([mockPart1]);
    mockCreateParts.mockResolvedValue([mockPart2, mockPart3]);

    const { result } = renderHook(() => useParts());

    await act(async () => {
      await result.current.fetchParts('stage-1');
    });

    let createdParts: PartData[] | undefined;
    await act(async () => {
      createdParts = await result.current.createParts([
        { stageId: 'stage-1', name: 'アルト' },
        { stageId: 'stage-2', name: 'テナー' },
      ]);
    });

    expect(mockCreateParts).toHaveBeenCalledWith([
      { stageId: 'stage-1', name: 'アルト' },
      { stageId: 'stage-2', name: 'テナー' },
    ]);
    expect(createdParts).toEqual([mockPart2, mockPart3]);
    expect(result.current.parts).toEqual([mockPart1, mockPart2, mockPart3]);
    expect(result.current.loading).toBe(false);
  });

  it('createParts失敗時にエラーを設定しthrowする', async () => {
    mockCreateParts.mockRejectedValue(new Error('一括作成失敗'));

    const { result } = renderHook(() => useParts());

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.createParts([
          { stageId: 'stage-1', name: 'テスト' },
        ]);
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toBeInstanceOf(Error);
    expect((thrownError as Error).message).toBe('一括作成失敗');
    expect(result.current.error).toBe('一括作成失敗');
    expect(result.current.loading).toBe(false);
  });

  // --- updatePart ---

  it('updatePartでパートを更新しリスト内のデータを差し替える', async () => {
    mockGetPartsByStageId.mockResolvedValue([mockPart1, mockPart2]);

    const updatedPart: PartData = {
      ...mockPart1,
      name: 'ソプラノ（更新済み）',
      updatedAt: '2024-02-01T00:00:00Z',
    };
    mockUpdatePart.mockResolvedValue(updatedPart);

    const { result } = renderHook(() => useParts());

    await act(async () => {
      await result.current.fetchParts('stage-1');
    });

    let returnedPart: PartData | undefined;
    await act(async () => {
      returnedPart = await result.current.updatePart('part-1', {
        name: 'ソプラノ（更新済み）',
      });
    });

    expect(mockUpdatePart).toHaveBeenCalledWith('part-1', {
      name: 'ソプラノ（更新済み）',
    });
    expect(returnedPart).toEqual(updatedPart);
    expect(result.current.parts[0]).toEqual(updatedPart);
    expect(result.current.parts[1]).toEqual(mockPart2);
    expect(result.current.loading).toBe(false);
  });

  it('updatePart失敗時にエラーを設定しthrowする', async () => {
    mockUpdatePart.mockRejectedValue(new Error('パート更新失敗'));

    const { result } = renderHook(() => useParts());

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.updatePart('part-1', { name: 'テスト' });
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toBeInstanceOf(Error);
    expect((thrownError as Error).message).toBe('パート更新失敗');
    expect(result.current.error).toBe('パート更新失敗');
    expect(result.current.loading).toBe(false);
  });

  it('updatePart失敗時にError以外の場合はデフォルトメッセージを設定する', async () => {
    mockUpdatePart.mockRejectedValue({ code: 500 });

    const { result } = renderHook(() => useParts());

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.updatePart('part-1', { name: 'テスト' });
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toEqual({ code: 500 });
    expect(result.current.error).toBe('パートの更新に失敗しました');
  });

  // --- deletePart ---

  it('deletePartでパートを削除しリストから除去する', async () => {
    mockGetPartsByStageId.mockResolvedValue([mockPart1, mockPart2]);
    mockDeletePart.mockResolvedValue(undefined);

    const { result } = renderHook(() => useParts());

    await act(async () => {
      await result.current.fetchParts('stage-1');
    });

    await act(async () => {
      await result.current.deletePart('part-1');
    });

    expect(mockDeletePart).toHaveBeenCalledWith('part-1');
    expect(result.current.parts).toEqual([mockPart2]);
    expect(result.current.loading).toBe(false);
  });

  it('deletePart失敗時にエラーを設定しthrowする', async () => {
    mockDeletePart.mockRejectedValue(new Error('パート削除失敗'));

    const { result } = renderHook(() => useParts());

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.deletePart('part-1');
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toBeInstanceOf(Error);
    expect((thrownError as Error).message).toBe('パート削除失敗');
    expect(result.current.error).toBe('パート削除失敗');
    expect(result.current.loading).toBe(false);
  });

  it('deletePart失敗時にError以外の場合はデフォルトメッセージを設定する', async () => {
    mockDeletePart.mockRejectedValue(42);

    const { result } = renderHook(() => useParts());

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.deletePart('part-1');
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toBe(42);
    expect(result.current.error).toBe('パートの削除に失敗しました');
  });

  // --- deletePartsByStageId ---

  it('deletePartsByStageIdでステージのパートを全削除しリストから除去する', async () => {
    mockGetPartsByStageId.mockResolvedValue([mockPart1, mockPart2]);
    mockDeletePartsByStageId.mockResolvedValue(undefined);

    const { result } = renderHook(() => useParts());

    await act(async () => {
      await result.current.fetchParts('stage-1');
    });

    // mockPart3 (stage-2) を createPart で追加
    mockCreatePart.mockResolvedValue(mockPart3);
    await act(async () => {
      await result.current.createPart({ stageId: 'stage-2', name: 'テナー' });
    });

    await act(async () => {
      await result.current.deletePartsByStageId('stage-1');
    });

    expect(mockDeletePartsByStageId).toHaveBeenCalledWith('stage-1');
    // stage-1のパートが除去され、stage-2のパートだけ残る
    expect(result.current.parts).toEqual([mockPart3]);
    expect(result.current.loading).toBe(false);
  });

  it('deletePartsByStageId失敗時にエラーを設定しthrowする', async () => {
    mockDeletePartsByStageId.mockRejectedValue(new Error('ステージパート削除失敗'));

    const { result } = renderHook(() => useParts());

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.deletePartsByStageId('stage-1');
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toBeInstanceOf(Error);
    expect((thrownError as Error).message).toBe('ステージパート削除失敗');
    expect(result.current.error).toBe('ステージパート削除失敗');
    expect(result.current.loading).toBe(false);
  });

  it('deletePartsByStageId失敗時にError以外の場合はデフォルトメッセージを設定する', async () => {
    mockDeletePartsByStageId.mockRejectedValue(null);

    const { result } = renderHook(() => useParts());

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.deletePartsByStageId('stage-1');
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toBe(null);
    expect(result.current.error).toBe('パートの削除に失敗しました');
  });
});
