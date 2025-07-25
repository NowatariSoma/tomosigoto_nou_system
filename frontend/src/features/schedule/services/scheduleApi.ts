/**
 * スケジュールAPI統合サービス
 * 実際のAPIエンドポイントとの結合用
 */

import { Schedule, DateRange, CalendarDataParams } from '@/types/schedule';

/**
 * APIエンドポイント設定
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
const SCHEDULE_ENDPOINTS = {
  list: `${API_BASE_URL}/schedules`,
  create: `${API_BASE_URL}/schedules`,
  update: (id: string) => `${API_BASE_URL}/schedules/${id}`,
  delete: (id: string) => `${API_BASE_URL}/schedules/${id}`,
  byDateRange: `${API_BASE_URL}/schedules/range`,
  byPart: (partId: number) => `${API_BASE_URL}/schedules/part/${partId}`,
} as const;

/**
 * HTTP クライアント設定
 */
interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

/**
 * API リクエスト共通関数
 */
async function apiRequest<T>(
  url: string, 
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 10000
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('API request timeout');
      }
      throw error;
    }
    
    throw new Error('Unknown API error');
  }
}

/**
 * スケジュールデータ取得API（実装準備）
 * 
 * TODO: 実際のバックエンドAPIと接続
 * - 認証ヘッダーの追加
 * - エラーハンドリングの詳細化
 * - レスポンス形式の統一
 */
export async function fetchSchedulesFromApi(
  params: CalendarDataParams
): Promise<Schedule[]> {
  const queryParams = new URLSearchParams({
    startDate: params.dateRange.start.toISOString(),
    endDate: params.dateRange.end.toISOString(),
    viewMode: params.viewMode || 'month',
    ...(params.partId && { partId: params.partId.toString() })
  });

  const url = `${SCHEDULE_ENDPOINTS.byDateRange}?${queryParams}`;
  
  try {
    const response = await apiRequest<{
      schedules: any[];
      total: number;
      message?: string;
    }>(url);

    // レスポンスデータをSchedule型に変換
    return response.schedules.map(transformApiScheduleToSchedule);
  } catch (error) {
    console.error('Schedule API fetch error:', error);
    
    // 開発環境では詳細なエラー情報を表示
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using mock data due to API error:', error);
    }
    
    // APIエラー時はエラーを再スロー（フックでキャッチ）
    throw error;
  }
}

/**
 * APIレスポンスをSchedule型に変換
 */
function transformApiScheduleToSchedule(apiSchedule: any): Schedule {
  return {
    id: apiSchedule.id.toString(),
    title: apiSchedule.title || '無題',
    startDate: new Date(apiSchedule.start_date || apiSchedule.startDate),
    endDate: new Date(apiSchedule.end_date || apiSchedule.endDate),
    partId: apiSchedule.part_id || apiSchedule.partId,
    partName: apiSchedule.part_name || apiSchedule.partName,
    location: apiSchedule.location || null,
    color: apiSchedule.color || '#3b82f6',
    description: apiSchedule.description || null,
    createdAt: apiSchedule.created_at ? new Date(apiSchedule.created_at) : undefined,
    updatedAt: apiSchedule.updated_at ? new Date(apiSchedule.updated_at) : undefined
  };
}

/**
 * スケジュール作成API（実装準備）
 */
export async function createScheduleApi(
  scheduleData: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Schedule> {
  const response = await apiRequest<{ schedule: any }>(
    SCHEDULE_ENDPOINTS.create,
    {
      method: 'POST',
      body: {
        title: scheduleData.title,
        start_date: scheduleData.startDate.toISOString(),
        end_date: scheduleData.endDate.toISOString(),
        part_id: scheduleData.partId,
        location: scheduleData.location,
        color: scheduleData.color,
        description: scheduleData.description
      }
    }
  );

  return transformApiScheduleToSchedule(response.schedule);
}

/**
 * スケジュール更新API（実装準備）
 */
export async function updateScheduleApi(
  id: string,
  scheduleData: Partial<Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Schedule> {
  const response = await apiRequest<{ schedule: any }>(
    SCHEDULE_ENDPOINTS.update(id),
    {
      method: 'PUT',
      body: {
        ...(scheduleData.title && { title: scheduleData.title }),
        ...(scheduleData.startDate && { start_date: scheduleData.startDate.toISOString() }),
        ...(scheduleData.endDate && { end_date: scheduleData.endDate.toISOString() }),
        ...(scheduleData.partId && { part_id: scheduleData.partId }),
        ...(scheduleData.location !== undefined && { location: scheduleData.location }),
        ...(scheduleData.color && { color: scheduleData.color }),
        ...(scheduleData.description !== undefined && { description: scheduleData.description })
      }
    }
  );

  return transformApiScheduleToSchedule(response.schedule);
}

/**
 * スケジュール削除API（実装準備）
 */
export async function deleteScheduleApi(id: string): Promise<void> {
  await apiRequest(SCHEDULE_ENDPOINTS.delete(id), {
    method: 'DELETE'
  });
}

/**
 * 健全性チェック用API
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    await apiRequest(`${API_BASE_URL}/health`, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}