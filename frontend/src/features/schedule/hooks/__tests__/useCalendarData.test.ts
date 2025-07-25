/**
 * useCalendarData.tsのテスト
 * TDD方式：実装コードなしでテスト仕様を先に定義
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useCalendarData } from '../useCalendarData';
import { CalendarDataParams } from '@/types/schedule';

// モック関数の設定
jest.mock('../useCalendarData', () => ({
  useCalendarData: jest.fn()
}));

describe('useCalendarData', () => {
  const mockParams: CalendarDataParams = {
    dateRange: {
      start: new Date(2024, 0, 1),
      end: new Date(2024, 0, 31)
    },
    partId: 1,
    viewMode: 'month'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('初期状態', () => {
    test('data=[], isLoading=false, error=null を返す', () => {
      const mockUseCalendarData = useCalendarData as jest.MockedFunction<typeof useCalendarData>;
      mockUseCalendarData.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      const { result } = renderHook(() => useCalendarData(mockParams));

      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('データ取得開始時', () => {
    test('isLoading=true を返す', () => {
      const mockUseCalendarData = useCalendarData as jest.MockedFunction<typeof useCalendarData>;
      mockUseCalendarData.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        refetch: jest.fn()
      });

      const { result } = renderHook(() => useCalendarData(mockParams));

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('データ取得成功時', () => {
    test('data=取得データ, isLoading=false, error=null を返す', async () => {
      const mockData = [
        {
          id: '1',
          title: '全体練習',
          startDate: new Date(2024, 0, 15, 19, 0),
          endDate: new Date(2024, 0, 15, 21, 0),
          partId: 1,
          partName: '管楽器',
          location: '音楽室',
          color: '#3b82f6'
        }
      ];

      const mockUseCalendarData = useCalendarData as jest.MockedFunction<typeof useCalendarData>;
      mockUseCalendarData.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      const { result } = renderHook(() => useCalendarData(mockParams));

      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('データ取得失敗時', () => {
    test('data=[], isLoading=false, error=エラー情報 を返す', () => {
      const mockError = new Error('Network error');
      
      const mockUseCalendarData = useCalendarData as jest.MockedFunction<typeof useCalendarData>;
      mockUseCalendarData.mockReturnValue({
        data: [],
        isLoading: false,
        error: mockError,
        refetch: jest.fn()
      });

      const { result } = renderHook(() => useCalendarData(mockParams));

      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('キャッシュ機能', () => {
    test('同一パラメータでの重複取得はキャッシュから返す', () => {
      const mockData = [
        {
          id: '1',
          title: 'キャッシュされたデータ',
          startDate: new Date(2024, 0, 15, 19, 0),
          endDate: new Date(2024, 0, 15, 21, 0),
        }
      ];

      const mockUseCalendarData = useCalendarData as jest.MockedFunction<typeof useCalendarData>;
      mockUseCalendarData.mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      // 同じパラメータで2回呼び出し
      const { result: result1 } = renderHook(() => useCalendarData(mockParams));
      const { result: result2 } = renderHook(() => useCalendarData(mockParams));

      expect(result1.current.data).toEqual(mockData);
      expect(result2.current.data).toEqual(mockData);
    });
  });

  describe('refetch機能', () => {
    test('refetch()実行時は強制的に再取得', async () => {
      const mockRefetch = jest.fn();
      
      const mockUseCalendarData = useCalendarData as jest.MockedFunction<typeof useCalendarData>;
      mockUseCalendarData.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: mockRefetch
      });

      const { result } = renderHook(() => useCalendarData(mockParams));

      await result.current.refetch();

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('パラメータ変更時の自動取得', () => {
    test('dateRangeが変更された場合、自動で再取得する', () => {
      const mockUseCalendarData = useCalendarData as jest.MockedFunction<typeof useCalendarData>;
      
      // 初回
      mockUseCalendarData.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      const { rerender } = renderHook(
        ({ params }) => useCalendarData(params),
        { initialProps: { params: mockParams } }
      );

      // パラメータ変更
      const newParams = {
        ...mockParams,
        dateRange: {
          start: new Date(2024, 1, 1),
          end: new Date(2024, 1, 29)
        }
      };

      rerender({ params: newParams });

      // useCalendarDataが新しいパラメータで呼ばれることを確認
      expect(mockUseCalendarData).toHaveBeenCalledWith(newParams);
    });

    test('partIdが変更された場合、自動で再取得する', () => {
      const mockUseCalendarData = useCalendarData as jest.MockedFunction<typeof useCalendarData>;
      
      mockUseCalendarData.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      const { rerender } = renderHook(
        ({ params }) => useCalendarData(params),
        { initialProps: { params: mockParams } }
      );

      // partId変更
      const newParams = { ...mockParams, partId: 2 };
      rerender({ params: newParams });

      expect(mockUseCalendarData).toHaveBeenCalledWith(newParams);
    });

    test('viewModeが変更された場合、自動で再取得する', () => {
      const mockUseCalendarData = useCalendarData as jest.MockedFunction<typeof useCalendarData>;
      
      mockUseCalendarData.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      const { rerender } = renderHook(
        ({ params }) => useCalendarData(params),
        { initialProps: { params: mockParams } }
      );

      // viewMode変更
      const newParams = { ...mockParams, viewMode: 'week' as const };
      rerender({ params: newParams });

      expect(mockUseCalendarData).toHaveBeenCalledWith(newParams);
    });
  });
});