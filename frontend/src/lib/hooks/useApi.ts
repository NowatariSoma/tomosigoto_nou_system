/**
 * API呼び出しカスタムフック
 * 
 * このファイルはAPI呼び出しを行うReactカスタムフックを提供します。
 * APIクライアントを使った基本的なAPI呼び出しやページネーション対応API呼び出しを実装しています。
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiClient } from '@/lib/api/client';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { AsyncData } from '@/types/utility';

/**
 * 基本的なAPI呼び出しを行うカスタムフック
 * @param apiClient APIクライアントインスタンス
 * @returns API操作関数オブジェクト
 */
export const useApi = (apiClient: ApiClient) => {
  /**
   * GETリクエストを送信する
   * @param path APIパス
   * @param params クエリパラメータ
   * @returns 非同期データ状態と操作関数
   */
  const get = <T>(path: string, params?: Record<string, any>) => {
    const [state, setState] = useState<AsyncData<T>>({ status: 'idle' });

    const execute = useCallback(async () => {
      try {
        setState({ status: 'loading' });
        const response = await apiClient.get<T>(path, params);
        setState({ status: 'success', data: response.data });
        return response;
      } catch (error) {
        setState({ status: 'error', error: error as Error });
        throw error;
      }
    }, [path, JSON.stringify(params)]);

    return { state, execute };
  };

  /**
   * POSTリクエストを送信する
   * @param path APIパス
   * @param data リクエストデータ
   * @returns 非同期データ状態と操作関数
   */
  const post = <T>(path: string, data?: any) => {
    const [state, setState] = useState<AsyncData<T>>({ status: 'idle' });

    const execute = useCallback(async (executeData?: any) => {
      try {
        setState({ status: 'loading' });
        const response = await apiClient.post<T>(path, executeData || data);
        setState({ status: 'success', data: response.data });
        return response;
      } catch (error) {
        setState({ status: 'error', error: error as Error });
        throw error;
      }
    }, [path, JSON.stringify(data)]);

    return { state, execute };
  };

  /**
   * PUTリクエストを送信する
   * @param path APIパス
   * @param data リクエストデータ
   * @returns 非同期データ状態と操作関数
   */
  const put = <T>(path: string, data?: any) => {
    const [state, setState] = useState<AsyncData<T>>({ status: 'idle' });

    const execute = useCallback(async (executeData?: any) => {
      try {
        setState({ status: 'loading' });
        const response = await apiClient.put<T>(path, executeData || data);
        setState({ status: 'success', data: response.data });
        return response;
      } catch (error) {
        setState({ status: 'error', error: error as Error });
        throw error;
      }
    }, [path, JSON.stringify(data)]);

    return { state, execute };
  };

  /**
   * DELETEリクエストを送信する
   * @param path APIパス
   * @returns 非同期データ状態と操作関数
   */
  const del = <T>(path: string) => {
    const [state, setState] = useState<AsyncData<T>>({ status: 'idle' });

    const execute = useCallback(async () => {
      try {
        setState({ status: 'loading' });
        const response = await apiClient.delete<T>(path);
        setState({ status: 'success', data: response.data });
        return response;
      } catch (error) {
        setState({ status: 'error', error: error as Error });
        throw error;
      }
    }, [path]);

    return { state, execute };
  };

  return { get, post, put, delete: del };
};

/**
 * ページネーション対応API呼び出しを行うカスタムフック
 * @param apiClient APIクライアントインスタンス
 * @param path APIパス
 * @param initialPageSize 初期ページサイズ
 * @returns ページネーションデータと操作関数
 */
export const usePaginatedApi = <T>(
  apiClient: ApiClient,
  path: string,
  initialPageSize: number = 20
) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  /**
   * データを読み込む
   * @param pageToLoad 読み込むページ番号
   * @param reset データをリセットするか
   */
  const loadData = useCallback(
    async (pageToLoad: number = 1, reset: boolean = false) => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get<PaginatedResponse<T>>(path, {
          page: pageToLoad,
          pageSize: initialPageSize,
        });
        
        const { data } = response;
        
        setTotal(data.total);
        setHasMore(data.hasMore);
        setPage(pageToLoad);
        
        if (reset || pageToLoad === 1) {
          setItems(data.items);
        } else {
          setItems(prevItems => [...prevItems, ...data.items]);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [path, initialPageSize]
  );

  /**
   * 初期データ読み込み
   */
  useEffect(() => {
    loadData(1, true);
  }, [loadData]);

  /**
   * 次ページを読み込む
   */
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadData(page + 1);
    }
  }, [loading, hasMore, page, loadData]);

  /**
   * データを再読み込みする
   */
  const reload = useCallback(() => {
    loadData(1, true);
  }, [loadData]);

  return {
    data: {
      items,
      total,
      page,
      hasMore,
    },
    loading,
    error,
    loadMore,
    reload,
  };
}; 