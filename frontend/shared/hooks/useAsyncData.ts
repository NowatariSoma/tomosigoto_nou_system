'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UseAsyncDataOptions<T> {
  /** 初期化時に自動フェッチするか (default: true) */
  fetchOnMount?: boolean;
  /** 初期データ（指定時はフェッチ結果で上書きされる） */
  initialData?: T;
  /** エラーメッセージのフォールバック */
  defaultErrorMessage?: string;
}

export interface UseAsyncDataReturn<T> {
  data: T;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T>>;
  clearError: () => void;
}

/**
 * データ取得の共通パターンを抽象化するフック
 *
 * @param fetcher データ取得関数
 * @param defaultValue データの初期値
 * @param options オプション
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  defaultValue: T,
  options: UseAsyncDataOptions<T> = {},
): UseAsyncDataReturn<T> {
  const {
    fetchOnMount = true,
    initialData,
    defaultErrorMessage = 'データの取得に失敗しました',
  } = options;

  const [data, setData] = useState<T>(initialData ?? defaultValue);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : defaultErrorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetcher, defaultErrorMessage]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { data, loading, error, fetch: fetchData, setData, clearError };
}
