/**
 * 練習スケジュールのAPIサービス
 */

import { PracticeScheduleDisplayResponse } from '../types/schedule';
import { ApiResponse } from '../types/api';

const API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * 練習スケジュールAPIサービス
 */
export class PracticeScheduleService {
  /**
   * 指定した練習スケジュールの詳細情報を取得
   * @param scheduleId - 練習スケジュールID
   * @returns 練習スケジュールの詳細情報
   */
  static async getPracticeScheduleDetails(scheduleId: string): Promise<PracticeScheduleDisplayResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/practice_slots/${scheduleId}/details`);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data: PracticeScheduleDisplayResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching practice schedule details:', error);
      throw error;
    }
  }

  /**
   * 指定した日付の練習スケジュールを取得
   * @param date - 対象日付 (YYYY-MM-DD形式)
   * @returns 練習スケジュール情報
   */
  static async getPracticeScheduleByDate(date: string): Promise<PracticeScheduleDisplayResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/practice_slots/date/${date}`);
      
      if (response.status === 404) {
        return null; // スケジュールが存在しない場合
      }
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data: PracticeScheduleDisplayResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching practice schedule by date:', error);
      throw error;
    }
  }

  /**
   * すべての練習スケジュールを取得
   * @returns 練習スケジュールの一覧
   */
  static async getAllPracticeSchedules(): Promise<PracticeScheduleDisplayResponse[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/practice_slots/`);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data: PracticeScheduleDisplayResponse[] = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching all practice schedules:', error);
      throw error;
    }
  }
}
