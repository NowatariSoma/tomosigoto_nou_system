/**
 * カレンダーデータ取得カスタムフック
 * TDD方式：まずテスト仕様をコメントで定義
 */

import { useState, useEffect, useCallback } from 'react';
import { Schedule, DateRange, CalendarDataParams, ScheduleApiResponse } from '@/types/schedule';

/**
 * カレンダーデータ取得フック
 * 
 * テスト仕様:
 * - 初期状態: data=[], isLoading=false, error=null
 * - データ取得開始時: isLoading=true
 * - データ取得成功時: data=取得データ, isLoading=false, error=null
 * - データ取得失敗時: data=[], isLoading=false, error=エラー情報
 * - 同一パラメータでの重複取得はキャッシュから返す
 * - refetch()実行時は強制的に再取得
 */
export function useCalendarData(params: CalendarDataParams) {
  // 状態管理
  const [data, setData] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cache, setCache] = useState<Map<string, Schedule[]>>(new Map());

  // キャッシュキーの生成
  const generateCacheKey = useCallback((params: CalendarDataParams): string => {
    const { dateRange, partId, viewMode } = params;
    return `${dateRange.start.toISOString()}-${dateRange.end.toISOString()}-${partId || 'all'}-${viewMode || 'month'}`;
  }, []);

  // データ取得関数
  const fetchData = useCallback(async (params: CalendarDataParams, useCache = true): Promise<void> => {
    const cacheKey = generateCacheKey(params);
    
    // キャッシュチェック
    if (useCache && cache.has(cacheKey)) {
      setData(cache.get(cacheKey)!);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: 実際のAPI呼び出しを実装
      // 現在はモックデータを返す
      const mockData = await fetchScheduleData(params);
      
      setData(mockData);
      
      // キャッシュに保存
      setCache(prev => new Map(prev).set(cacheKey, mockData));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [cache, generateCacheKey]);

  // refetch関数（強制再取得）
  const refetch = useCallback(async (): Promise<void> => {
    await fetchData(params, false);
  }, [fetchData, params]);

  // パラメータ変更時の自動取得
  useEffect(() => {
    fetchData(params);
  }, [fetchData, params]);

  return {
    data,
    isLoading,
    error,
    refetch
  };
}

/**
 * スケジュールデータ取得API関数（モック実装）
 * 
 * テスト仕様:
 * - 正常時: 指定期間のスケジュールデータを返す
 * - partId指定時: 該当パートのデータのみ返す
 * - ネットワークエラー時: Error をthrow
 * - レスポンス時間: 500ms〜1000ms をシミュレート
 */
async function fetchScheduleData(params: CalendarDataParams): Promise<Schedule[]> {
  // モック遅延
  await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 500));

  // モックデータ生成
  const mockSchedules: Schedule[] = [
    {
      id: '1',
      title: '全体練習',
      startDate: new Date(2024, 0, 15, 19, 0),
      endDate: new Date(2024, 0, 15, 21, 0),
      partId: 1,
      partName: '管楽器',
      location: '音楽室',
      color: '#3b82f6'
    },
    {
      id: '2',
      title: 'パート練習',
      startDate: new Date(2024, 0, 16, 18, 30),
      endDate: new Date(2024, 0, 16, 20, 30),
      partId: 2,
      partName: '弦楽器',
      location: '小練習室',
      color: '#ef4444'
    },
    {
      id: '3',
      title: '個人練習',
      startDate: new Date(2024, 0, 17, 17, 0),
      endDate: new Date(2024, 0, 17, 19, 0),
      location: '個人練習室',
      color: '#10b981'
    }
  ];

  // 期間フィルタリング
  const filteredSchedules = mockSchedules.filter(schedule => {
    const scheduleDate = schedule.startDate;
    return scheduleDate >= params.dateRange.start && scheduleDate <= params.dateRange.end;
  });

  // パートフィルタリング
  const finalSchedules = params.partId 
    ? filteredSchedules.filter(schedule => schedule.partId === params.partId)
    : filteredSchedules;

  return finalSchedules;
}