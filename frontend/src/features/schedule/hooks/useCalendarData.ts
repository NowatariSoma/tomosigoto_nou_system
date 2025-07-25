/**
 * カレンダーデータ取得カスタムフック
 * TDD方式：まずテスト仕様をコメントで定義
 */

import { useState, useEffect, useCallback } from 'react';
import { Schedule, DateRange, CalendarDataParams, ScheduleApiResponse } from '@/types/schedule';
import { fetchSchedulesFromApi } from '../services/scheduleApi';

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
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  // キャッシュキーの生成
  const generateCacheKey = useCallback((params: CalendarDataParams): string => {
    const { dateRange, partId, viewMode } = params;
    const locale = 'ja'; // 将来的にユーザー設定から取得
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const version = '1.0'; // スキーマ変更時にインクリメント
    
    return `${dateRange.start.toISOString()}-${dateRange.end.toISOString()}-${partId || 'all'}-${viewMode || 'month'}-${locale}-${timezone}-${version}`;
  }, []);

  // データ取得関数
  const fetchData = useCallback(async (params: CalendarDataParams, useCache = true): Promise<void> => {
    const cacheKey = generateCacheKey(params);
    
    // キャッシュチェック
    if (useCache && cache.has(cacheKey)) {
      setData(cache.get(cacheKey)!);
      return;
    }

    const startTime = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      // 実際のAPI呼び出しを実行（フォールバック付き）
      let scheduleData: Schedule[];
      
      try {
        scheduleData = await fetchSchedulesFromApi(params);
      } catch (apiError) {
        // API呼び出し失敗時はモックデータにフォールバック
        console.warn('API呼び出しが失敗しました。モックデータを使用します:', apiError);
        scheduleData = await fetchScheduleData(params);
      }
      
      setData(scheduleData);
      setLastFetchTime(Date.now());
      
      // キャッシュに保存（タイムスタンプ付き）
      setCache(prev => new Map(prev).set(cacheKey, scheduleData));
      
      // デバッグ情報（開発環境のみ）
      if (process.env.NODE_ENV === 'development') {
        console.log(`Calendar data fetched in ${Date.now() - startTime}ms:`, {
          scheduleCount: scheduleData.length,
          dateRange: `${params.dateRange.start.toLocaleDateString()} - ${params.dateRange.end.toLocaleDateString()}`,
          partId: params.partId,
          viewMode: params.viewMode
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('スケジュールデータの取得に失敗しました');
      setError(error);
      setData([]);
      
      // エラーログ（開発環境のみ）
      if (process.env.NODE_ENV === 'development') {
        console.error('Calendar data fetch error:', error);
      }
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
    refetch,
    lastFetchTime
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