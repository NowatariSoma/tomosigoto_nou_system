/**
 * 練習スケジュールのAPIサービス
 */

import { PracticeScheduleDisplayResponse, PracticeScheduleWithDetailsResponse, IdealScheduleData } from '../types/schedule';
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
  static async getPracticeScheduleDetails(scheduleId: string): Promise<PracticeScheduleWithDetailsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/practice_slots/${scheduleId}/details`);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data: PracticeScheduleWithDetailsResponse = await response.json();
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
   * 指定した日付の練習スケジュール詳細情報を取得
   * @param date - 対象日付 (YYYY-MM-DD形式)
   * @returns 練習スケジュールの詳細情報
   */
  static async getPracticeScheduleDetailsByDate(date: string): Promise<PracticeScheduleWithDetailsResponse | null> {
    try {
      // まず基本情報を取得してスケジュールIDを取得
      const basicSchedule = await this.getPracticeScheduleByDate(date);
      if (!basicSchedule) {
        return null;
      }
      
      // スケジュールIDを使って詳細情報を取得
      const detailsData = await this.getPracticeScheduleDetails(basicSchedule.id);
      return detailsData;
    } catch (error) {
      console.error('Error fetching practice schedule details by date:', error);
      throw error;
    }
  }

  /**
   * 指定した日付の練習スケジュール表示用情報を取得
   * @param date - 対象日付 (YYYY-MM-DD形式)
   * @returns 練習スケジュールの表示用情報
   */
  static async getPracticeScheduleDisplayByDate(date: string): Promise<PracticeScheduleDisplayResponse | null> {
    try {
      // まず基本情報を取得してスケジュールIDを取得
      const basicSchedule = await this.getPracticeScheduleByDate(date);
      if (!basicSchedule) {
        return null;
      }
      
      // スケジュールIDを使って表示用情報を取得
      const response = await fetch(`${API_BASE_URL}/practice_slots/${basicSchedule.id}/display`);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data: PracticeScheduleDisplayResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching practice schedule display by date:', error);
      throw error;
    }
  }

  /**
   * 理想的な形式の練習スケジュール情報を取得
   * @param date - 対象日付 (YYYY-MM-DD形式)
   * @returns 理想的な形式の練習スケジュール情報
   */
  static async getPracticeScheduleIdealFormat(date: string): Promise<IdealScheduleData | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/practice_slots/date/${date}/ideal`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data: IdealScheduleData = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching ideal format practice schedule:', error);
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
