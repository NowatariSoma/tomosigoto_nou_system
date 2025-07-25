import { useState, useCallback, useEffect } from 'react';
import { ApiResponse, ApiError, PaginatedResponse } from '@/types/api';
import { AsyncState, Result } from '@/types/utility';
import { ApiClient } from '@/lib/api/client';

export interface UseApiOptions {
  immediate?: boolean;
  dependencies?: any[];
}

export interface UseApiReturn<T> extends AsyncState<T> {
  execute: () => Promise<Result<ApiResponse<T>, ApiError>>;
  reset: () => void;
}

export function useApi<T>(
  apiCall: () => Promise<Result<ApiResponse<T>, ApiError>>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const { immediate = false, dependencies = [] } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
    status: 'idle',
  });

  const execute = useCallback(async (): Promise<Result<ApiResponse<T>, ApiError>> => {
    setState(prev => ({ ...prev, loading: true, status: 'loading', error: null }));

    try {
      const result = await apiCall();

      if (result.success) {
        setState({
          data: result.value.data,
          loading: false,
          error: null,
          status: 'success',
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: result.error,
          status: 'error',
        });
      }

      return result;
    } catch (error) {
      const apiError: ApiError = {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error,
      };

      setState({
        data: null,
        loading: false,
        error: apiError,
        status: 'error',
      });

      return { success: false, error: apiError };
    }
  }, [apiCall]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      status: 'idle',
    });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute, ...dependencies]);

  return {
    ...state,
    execute,
    reset,
  };
}

export interface UsePaginatedApiOptions extends UseApiOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export interface UsePaginatedApiReturn<T> extends AsyncState<T[]> {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  reload: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export function usePaginatedApi<T>(
  apiCall: (page: number, pageSize: number) => Promise<Result<ApiResponse<PaginatedResponse<T>>, ApiError>>,
  options: UsePaginatedApiOptions = {}
): UsePaginatedApiReturn<T> {
  const { immediate = false, initialPage = 1, initialPageSize = 10, dependencies = [] } = options;

  const [state, setState] = useState<AsyncState<T[]> & {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  }>({
    data: [],
    loading: false,
    error: null,
    status: 'idle',
    page: initialPage,
    pageSize: initialPageSize,
    total: 0,
    hasMore: false,
  });

  const execute = useCallback(async (page: number = state.page, pageSize: number = state.pageSize, append: boolean = false) => {
    setState(prev => ({ ...prev, loading: true, status: 'loading', error: null }));

    try {
      const result = await apiCall(page, pageSize);

      if (result.success) {
        const paginatedData = result.value.data;
        setState(prev => ({
          ...prev,
          data: append ? [...(prev.data || []), ...paginatedData.items] : paginatedData.items,
          loading: false,
          error: null,
          status: 'success',
          page: paginatedData.page,
          pageSize: paginatedData.pageSize,
          total: paginatedData.total,
          hasMore: paginatedData.hasMore,
        }));
      } else {
        setState(prev => ({
          ...prev,
          data: [],
          loading: false,
          error: result.error,
          status: 'error',
        }));
      }
    } catch (error) {
      const apiError: ApiError = {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error,
      };

      setState(prev => ({
        ...prev,
        data: [],
        loading: false,
        error: apiError,
        status: 'error',
      }));
    }
  }, [apiCall, state.page, state.pageSize]);

  const loadMore = useCallback(async () => {
    if (state.hasMore && !state.loading) {
      await execute(state.page + 1, state.pageSize, true);
    }
  }, [execute, state.hasMore, state.loading, state.page, state.pageSize]);

  const reload = useCallback(async () => {
    await execute(1, state.pageSize, false);
  }, [execute, state.pageSize]);

  const setPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, page }));
    execute(page, state.pageSize, false);
  }, [execute, state.pageSize]);

  const setPageSize = useCallback((pageSize: number) => {
    setState(prev => ({ ...prev, pageSize, page: 1 }));
    execute(1, pageSize, false);
  }, [execute]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute, ...dependencies]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    status: state.status,
    page: state.page,
    pageSize: state.pageSize,
    total: state.total,
    hasMore: state.hasMore,
    loadMore,
    reload,
    setPage,
    setPageSize,
  };
}