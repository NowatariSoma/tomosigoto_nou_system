/**
 * スケジュール利用可能会場操作用のサービス
 */

import { fetchApi } from '../../../lib/api';

const API_PATH = '/schedule-available-venues/';

export interface ScheduleAvailableVenue {
  id: string;
  schedule_id: string;
  venue_id: string;
  is_preferred: boolean;
  priority: number;
  notes?: string;
  // 詳細情報（WithDetailsエンドポイントの場合）
  venue_name?: string;
  venue_address?: string;
  venue_capacity?: number;
}

export interface ScheduleAvailableVenueCreate {
  schedule_id: string;
  venue_id: string;
  is_preferred?: boolean;
  priority?: number;
  notes?: string;
}

export interface ScheduleAvailableVenueBulkCreate {
  schedule_id: string;
  venues: {
    venue_id: string;
    is_preferred?: boolean;
    priority?: number;
    notes?: string;
  }[];
}

export interface ScheduleAvailableVenueBulkResponse {
  created_count: number;
  created_items: ScheduleAvailableVenue[];
  errors: string[];
}

export class ScheduleAvailableVenueService {
  /**
   * 指定したスケジュールの利用可能会場一覧を取得
   * @param scheduleId - スケジュールID
   * @returns 利用可能会場一覧
   */
  async getBySchedule(scheduleId: string): Promise<ScheduleAvailableVenue[]> {
    const response = await fetchApi(`${API_PATH}schedule/${scheduleId}`);
    return response.json();
  }

  /**
   * スケジュール利用可能会場を作成
   * @param data - 作成データ
   * @returns 作成された会場情報
   */
  async create(data: ScheduleAvailableVenueCreate): Promise<ScheduleAvailableVenue> {
    const response = await fetchApi(API_PATH, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  /**
   * スケジュール利用可能会場を一括作成
   * @param data - 一括作成データ
   * @returns 作成結果
   */
  async createBulk(data: ScheduleAvailableVenueBulkCreate): Promise<ScheduleAvailableVenueBulkResponse> {
    const response = await fetchApi(`${API_PATH}bulk`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  /**
   * スケジュール利用可能会場を削除
   * @param scheduleVenueId - スケジュール利用可能会場ID (schedule_available_venue.id)
   */
  async delete(scheduleVenueId: string): Promise<void> {
    await fetchApi(`${API_PATH}${scheduleVenueId}`, {
      method: 'DELETE',
    });
  }

  /**
   * 指定したスケジュールの利用可能会場をすべて削除
   * @param scheduleId - スケジュールID
   */
  async deleteBySchedule(scheduleId: string): Promise<{ deleted_count: number }> {
    const response = await fetchApi(`${API_PATH}schedule/${scheduleId}`, {
      method: 'DELETE',
    });
    return response.json();
  }
}

export const scheduleAvailableVenueService = new ScheduleAvailableVenueService();
