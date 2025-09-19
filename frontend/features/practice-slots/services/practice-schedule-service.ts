/**
 * 練習スケジュールのAPIサービス
 * room-settingsパターンに合わせて統一的なAPIアプローチを採用
 */

import { PracticeScheduleDisplayResponse, PracticeScheduleWithDetailsResponse, IdealScheduleData } from '../types/schedule';
import { ApiResponse } from '../types/api';
import { API_ENDPOINTS } from '../constants';
import { fetchApi } from '../../../lib/api';

// practice-slots.tsから移行された型定義
export interface ScheduleItem {
  id?: string;
  practice_slot_id?: string;
  time: string;
  duration: string;
  activity: string;
  columns: string[];
  created_at?: string;
  updated_at?: string;
}

export interface PracticeSlot {
  id?: string;
  date: string;
  title?: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  schedule_items?: ScheduleItem[];
}

/**
 * 練習スケジュールAPIサービス
 */
export class PracticeScheduleService {
  private readonly basePath = API_ENDPOINTS.PRACTICE_SLOTS;

  /**
   * 指定した練習スケジュールの詳細情報を取得
   * @param scheduleId - 練習スケジュールID
   * @returns 練習スケジュールの詳細情報
   */
  async getPracticeScheduleDetails(scheduleId: string): Promise<any> {
    const response = await fetchApi(`${this.basePath}/${scheduleId}/details`);
    return response.json();
  }

  /**
   * 指定した日付の練習スケジュールを取得
   * @param date - 対象日付 (YYYY-MM-DD形式)
   * @returns 練習スケジュール情報
   */
  async getPracticeScheduleByDate(date: string): Promise<PracticeScheduleDisplayResponse | null> {
    try {
      const response = await fetchApi(`${this.basePath}/date/${date}`);
      const data: PracticeScheduleDisplayResponse = await response.json();
      return data;
    } catch (error: any) {
      if (error.status === 404) {
        return null; // スケジュールが存在しない場合
      }
      throw error;
    }
  }

  // getPracticeScheduleDetailsByDate メソッドは削除 - idealエンドポイントを使用

  /**
   * 指定した日付の練習スケジュール表示用情報を取得
   * @param date - 対象日付 (YYYY-MM-DD形式)
   * @returns 練習スケジュールの表示用情報
   */
  async getPracticeScheduleDisplayByDate(date: string): Promise<PracticeScheduleDisplayResponse | null> {
    // まず基本情報を取得してスケジュールIDを取得
    const basicSchedule = await this.getPracticeScheduleByDate(date);
    if (!basicSchedule) {
      return null;
    }
    
    // スケジュールIDを使って表示用情報を取得
    const response = await fetchApi(`${this.basePath}/${basicSchedule.id}/display`);
    const data: PracticeScheduleDisplayResponse = await response.json();
    return data;
  }

  /**
   * 理想的な形式の練習スケジュール情報を取得
   * @param date - 対象日付 (YYYY-MM-DD形式)
   * @returns 理想的な形式の練習スケジュール情報
   */
  async getPracticeScheduleIdealFormat(date: string): Promise<IdealScheduleData | null> {
    try {
      const response = await fetchApi(`${this.basePath}/date/${date}/ideal`);
      const data: IdealScheduleData = await response.json();
      return data;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * すべての練習スケジュールを取得
   * @returns 練習スケジュールの一覧
   */
  async getAllPracticeSchedules(): Promise<PracticeScheduleDisplayResponse[]> {
    const response = await fetchApi(`${this.basePath}/`);
    const data: PracticeScheduleDisplayResponse[] = await response.json();
    return data;
  }

  // ===== practice-slots.tsから統合されたメソッド =====

  /**
   * 指定した日付のPracticeSlotを取得 (practice-slots.ts互換)
   * @param targetDate - 対象日付 (YYYY-MM-DD形式)
   * @returns PracticeSlot情報
   */
  async getPracticeSlotByDate(targetDate: string): Promise<ApiResponse<PracticeSlot>> {
    const response = await fetchApi(`${this.basePath}/date/${targetDate}`);
    return response.json();
  }

  /**
   * サンプルデータ付きでPracticeSlotを作成 (practice-slots.ts互換)
   * @param targetDate - 対象日付
   * @returns 作成されたPracticeSlot
   */
  async createPracticeSlotWithSampleData(targetDate: string): Promise<ApiResponse<PracticeSlot>> {
    const response = await fetchApi(`${this.basePath}/with-sample-data?target_date=${targetDate}`, {
      method: 'POST',
    });
    return response.json();
  }
}

// room-settingsパターンに合わせてインスタンスをエクスポート
export const practiceScheduleService = new PracticeScheduleService();
