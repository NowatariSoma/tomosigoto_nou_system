import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsyncData } from '@/shared/hooks/useAsyncData';

describe('useAsyncData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. fetchOnMount=true (default): Auto-fetches data and sets it
  it('fetchOnMount=true (デフォルト) で自動的にデータを取得する', async () => {
    const mockData = { id: 1, name: 'テスト' };
    const fetcher = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useAsyncData(fetcher, null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  // 2. fetchOnMount=false: Does NOT fetch on mount
  it('fetchOnMount=false でマウント時にデータを取得しない', () => {
    const fetcher = vi.fn().mockResolvedValue('data');

    const { result } = renderHook(() =>
      useAsyncData(fetcher, 'default', { fetchOnMount: false }),
    );

    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.data).toBe('default');
  });

  // 3. loading state transitions: loading=true initially, then false after fetch
  it('loading状態が正しく遷移する（true -> false）', async () => {
    let resolvePromise: (value: string) => void;
    const fetcher = vi.fn(
      () => new Promise<string>((resolve) => { resolvePromise = resolve; }),
    );

    const { result } = renderHook(() => useAsyncData(fetcher, ''));

    // マウント直後のloading状態
    expect(result.current.loading).toBe(true);

    // fetchを解決する
    await act(async () => {
      resolvePromise!('resolved data');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe('resolved data');
  });

  // 4. initialData: Uses initialData as initial state, loading starts as false
  it('initialDataを初期状態として使用し、loadingがfalseで開始する', async () => {
    const initialData = [{ id: 1 }, { id: 2 }];
    const fetcher = vi.fn().mockResolvedValue([{ id: 3 }]);

    // fetchOnMount=falseで初期状態のみ確認
    const { result } = renderHook(() =>
      useAsyncData(fetcher, [], { initialData, fetchOnMount: false }),
    );

    // initialDataが設定されている場合、loadingはfalseで開始
    expect(result.current.data).toEqual(initialData);
    expect(result.current.loading).toBe(false);

    // 手動fetchでデータが更新される
    await act(async () => {
      await result.current.fetch();
    });
    expect(result.current.data).toEqual([{ id: 3 }]);
  });

  // 5. defaultValue: Uses defaultValue when no initialData
  it('initialDataがない場合、defaultValueを使用する', () => {
    const fetcher = vi.fn().mockResolvedValue('fetched');
    const defaultValue = 'デフォルト値';

    const { result } = renderHook(() =>
      useAsyncData(fetcher, defaultValue, { fetchOnMount: false }),
    );

    expect(result.current.data).toBe(defaultValue);
  });

  // 6. fetch() manual call: Can manually trigger fetch
  it('fetch()で手動でデータ取得をトリガーできる', async () => {
    const mockData = { value: 42 };
    const fetcher = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() =>
      useAsyncData(fetcher, null, { fetchOnMount: false }),
    );

    expect(result.current.data).toBeNull();

    await act(async () => {
      await result.current.fetch();
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockData);
  });

  // 7. fetch() clears error: Error is cleared on new fetch
  it('fetch()呼び出し時にエラーがクリアされる', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('最初のエラー'))
      .mockResolvedValueOnce('成功データ');

    const { result } = renderHook(() =>
      useAsyncData(fetcher, '', { fetchOnMount: false }),
    );

    // 最初のfetchでエラーを発生させる
    await act(async () => {
      await result.current.fetch();
    });
    expect(result.current.error).toBe('最初のエラー');

    // 2回目のfetchでエラーがクリアされる
    await act(async () => {
      await result.current.fetch();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBe('成功データ');
  });

  // 8. Error handling (Error instance): Sets error.message
  it('Errorインスタンスの場合、error.messageを設定する', async () => {
    const errorMessage = 'カスタムエラーメッセージ';
    const fetcher = vi.fn().mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() =>
      useAsyncData(fetcher, null, { fetchOnMount: false }),
    );

    await act(async () => {
      await result.current.fetch();
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.data).toBeNull();
  });

  // 9. Error handling (non-Error): Uses defaultErrorMessage
  it('Error以外の例外の場合、デフォルトのエラーメッセージを使用する', async () => {
    const fetcher = vi.fn().mockRejectedValue('文字列エラー');

    const { result } = renderHook(() =>
      useAsyncData(fetcher, null, { fetchOnMount: false }),
    );

    await act(async () => {
      await result.current.fetch();
    });

    expect(result.current.error).toBe('データの取得に失敗しました');
  });

  // 10. Custom defaultErrorMessage: Uses provided message for non-Error exceptions
  it('カスタムdefaultErrorMessageがnon-Error例外で使用される', async () => {
    const customMessage = 'カスタムフォールバックメッセージ';
    const fetcher = vi.fn().mockRejectedValue(42);

    const { result } = renderHook(() =>
      useAsyncData(fetcher, null, {
        fetchOnMount: false,
        defaultErrorMessage: customMessage,
      }),
    );

    await act(async () => {
      await result.current.fetch();
    });

    expect(result.current.error).toBe(customMessage);
  });

  // 11. setData: Can manually update data
  it('setDataでデータを手動更新できる', async () => {
    const fetcher = vi.fn().mockResolvedValue('initial');

    const { result } = renderHook(() =>
      useAsyncData(fetcher, 'default', { fetchOnMount: false }),
    );

    expect(result.current.data).toBe('default');

    act(() => {
      result.current.setData('手動更新データ');
    });

    expect(result.current.data).toBe('手動更新データ');
  });

  // 12. clearError: Clears error state
  it('clearErrorでエラー状態をクリアする', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('テストエラー'));

    const { result } = renderHook(() =>
      useAsyncData(fetcher, null, { fetchOnMount: false }),
    );

    // エラーを発生させる
    await act(async () => {
      await result.current.fetch();
    });
    expect(result.current.error).toBe('テストエラー');

    // エラーをクリアする
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  // 13. Re-fetch updates data: Calling fetch() again updates data with new values
  it('再フェッチでデータが新しい値に更新される', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce('最初のデータ')
      .mockResolvedValueOnce('更新されたデータ');

    const { result } = renderHook(() =>
      useAsyncData(fetcher, '', { fetchOnMount: false }),
    );

    // 最初のfetch
    await act(async () => {
      await result.current.fetch();
    });
    expect(result.current.data).toBe('最初のデータ');

    // 2回目のfetchでデータが更新される
    await act(async () => {
      await result.current.fetch();
    });
    expect(result.current.data).toBe('更新されたデータ');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  // 14. Loading state during fetch: loading is true while fetching
  it('フェッチ中にloadingがtrueになる', async () => {
    let resolvePromise: (value: string) => void;
    const fetcher = vi.fn(
      () => new Promise<string>((resolve) => { resolvePromise = resolve; }),
    );

    const { result } = renderHook(() =>
      useAsyncData(fetcher, '', { fetchOnMount: false }),
    );

    // 初期状態ではloadingはtrue（initialDataがないため）
    // ただしfetchOnMount=falseなので、手動でfetchを呼ぶ
    expect(result.current.loading).toBe(true);

    // 手動fetchを開始（awaitしない）
    let fetchPromise: Promise<void>;
    act(() => {
      fetchPromise = result.current.fetch();
    });

    // フェッチ中はloadingがtrue
    expect(result.current.loading).toBe(true);

    // fetchを解決する
    await act(async () => {
      resolvePromise!('データ');
      await fetchPromise!;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe('データ');
  });
});
