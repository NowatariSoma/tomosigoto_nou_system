/**
 * セッション指導者のAPIサービス
 * session_instructors APIエンドポイントとの通信を担当
 */

import {
  SessionInstructor,
  SessionInstructorWithDetails,
  SessionInstructorCreate,
  SessionInstructorBulkCreate,
  SessionInstructorBulkResponse
} from '../types/practice-schedule-types';
import { fetchApi } from '../../../lib/api';
import { API_ENDPOINTS } from '../constants/practice-schedule-constants';

/**
 * セッション指導者APIサービス
 */
export class SessionInstructorService {
  private readonly basePath = API_ENDPOINTS.SESSION_INSTRUCTORS;

  /**
   * セッション指導者一覧を取得
   * @param scheduleId - 練習スケジュールIDでフィルタ（オプション）
   * @param slotOrder - コマ順序でフィルタ（オプション）
   * @returns セッション指導者一覧
   */
  async getSessionInstructors(
    scheduleId?: string, 
    slotOrder?: number
  ): Promise<SessionInstructorWithDetails[]> {
    const params = new URLSearchParams();
    if (scheduleId) params.append('schedule_id', scheduleId);
    if (slotOrder !== undefined) params.append('slot_order', slotOrder.toString());
    
    const queryString = params.toString();
    const url = queryString ? `${this.basePath}/?${queryString}` : `${this.basePath}/`;
    
    const response = await fetchApi(url);
    return response.json();
  }

  /**
   * 指定したIDのセッション指導者を取得
   * @param sessionInstructorId - セッション指導者ID
   * @returns セッション指導者情報
   */
  async getSessionInstructor(sessionInstructorId: string): Promise<SessionInstructor> {
    const response = await fetchApi(`${this.basePath}/${sessionInstructorId}`);
    return response.json();
  }

  /**
   * 指定したスケジュールの指導者一覧を取得
   * @param scheduleId - 練習スケジュールID
   * @returns セッション指導者一覧
   */
  async getSessionInstructorsBySchedule(scheduleId: string): Promise<SessionInstructor[]> {
    const response = await fetchApi(`${this.basePath}/schedule/${scheduleId}`);
    return response.json();
  }

  /**
   * 指定したスケジュールとコマの指導者一覧を取得
   * @param scheduleId - 練習スケジュールID
   * @param slotOrder - コマ順序
   * @returns セッション指導者一覧
   */
  async getSessionInstructorsByScheduleAndSlot(
    scheduleId: string, 
    slotOrder: number
  ): Promise<SessionInstructor[]> {
    const response = await fetchApi(`${this.basePath}/schedule/${scheduleId}/slot/${slotOrder}`);
    return response.json();
  }

  /**
   * 指定した出席IDの指導者割り当て一覧を取得
   * @param attendanceId - 出席ID
   * @returns セッション指導者一覧
   */
  async getSessionInstructorsByAttendance(attendanceId: string): Promise<SessionInstructor[]> {
    const response = await fetchApi(`${this.basePath}/attendance/${attendanceId}`);
    return response.json();
  }

  /**
   * セッション指導者を作成
   * @param data - セッション指導者作成データ
   * @returns 作成されたセッション指導者
   */
  async createSessionInstructor(data: SessionInstructorCreate): Promise<SessionInstructor> {
    const response = await fetchApi(`${this.basePath}/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  /**
   * セッション指導者を一括作成
   * @param data - セッション指導者一括作成データ
   * @returns 一括作成結果
   */
  async createSessionInstructorsBulk(data: SessionInstructorBulkCreate): Promise<SessionInstructorBulkResponse> {
    const response = await fetchApi(`${this.basePath}/bulk`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  /**
   * セッション指導者を更新
   * @param sessionInstructorId - セッション指導者ID
   * @param data - 更新データ
   * @returns 更新されたセッション指導者
   */
  async updateSessionInstructor(
    sessionInstructorId: string, 
    data: Partial<SessionInstructorCreate>
  ): Promise<SessionInstructor> {
    const response = await fetchApi(`${this.basePath}/${sessionInstructorId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  /**
   * セッション指導者を削除
   * @param sessionInstructorId - セッション指導者ID
   * @returns 削除結果メッセージ
   */
  async deleteSessionInstructor(sessionInstructorId: string): Promise<{ message: string }> {
    const response = await fetchApi(`${this.basePath}/${sessionInstructorId}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  /**
   * 指定したスケジュールの指導者割り当てをすべて削除
   * @param scheduleId - 練習スケジュールID
   * @returns 削除結果
   */
  async deleteSessionInstructorsBySchedule(scheduleId: string): Promise<{ message: string; deleted_count: number }> {
    const response = await fetchApi(`${this.basePath}/schedule/${scheduleId}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  /**
   * 指定したスケジュールとコマの指導者割り当てをすべて削除
   * @param scheduleId - 練習スケジュールID
   * @param slotOrder - コマ順序
   * @returns 削除結果
   */
  async deleteSessionInstructorsByScheduleAndSlot(
    scheduleId: string, 
    slotOrder: number
  ): Promise<{ message: string; deleted_count: number }> {
    const response = await fetchApi(`${this.basePath}/schedule/${scheduleId}/slot/${slotOrder}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  /**
   * 指定したスケジュールとコマの指導者情報を取得（表示用）
   * 練習スロット表示で使用する主要メソッド
   * @param scheduleId - 練習スケジュールID
   * @param slotOrder - コマ順序
   * @returns 指導者の詳細情報一覧
   */
  async getInstructorsForSlot(
    scheduleId: string, 
    slotOrder: number
  ): Promise<SessionInstructorWithDetails[]> {
    return this.getSessionInstructors(scheduleId, slotOrder);
  }
}

// インスタンスをエクスポート
export const sessionInstructorService = new SessionInstructorService();
