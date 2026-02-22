/**
 * 出席者データのAPIサービス
 */

import { fetchApi } from '@/lib/api';
import { AttendanceInfo } from '../types/session-editor';

/**
 * 出席者APIサービス
 */
export class AttendanceService {
  private readonly basePath = '/attendance';

  /**
   * 指定した練習スケジュールの出席者一覧を取得
   * @param practiceScheduleId - 練習スケジュールID
   * @returns 出席者一覧
   */
  async getAttendancesByPractice(practiceScheduleId: string): Promise<AttendanceInfo[]> {
    try {
      const url = `${this.basePath}/practice/${practiceScheduleId}`;

      const response = await fetchApi(url);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error('AttendanceService.getAttendancesByPractice error:', {
        practiceScheduleId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * すべての出席者を取得
   * @returns 出席者一覧
   */
  async getAttendances(): Promise<AttendanceInfo[]> {
    try {
      const url = `${this.basePath}/`;

      const response = await fetchApi(url);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error('AttendanceService.getAttendances error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * 指定したIDの出席者を取得
   * @param attendanceId - 出席者ID
   * @returns 出席者情報
   */
  async getAttendance(attendanceId: string): Promise<AttendanceInfo> {
    try {
      const url = `${this.basePath}/${attendanceId}`;

      const response = await fetchApi(url);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error('AttendanceService.getAttendance error:', {
        attendanceId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * 指定したユーザーの出席記録を取得
   * @param userId - ユーザーID
   * @returns 出席記録一覧
   */
  async getAttendancesByUser(userId: string): Promise<AttendanceInfo[]> {
    try {
      const url = `${this.basePath}/user/${userId}`;

      const response = await fetchApi(url);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error('AttendanceService.getAttendancesByUser error:', {
        userId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}

// インスタンスをエクスポート
export const attendanceService = new AttendanceService();
