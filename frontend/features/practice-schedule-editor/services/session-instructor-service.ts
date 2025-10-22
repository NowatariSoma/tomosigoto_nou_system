/**
 * セッション指導者のAPIサービス
 * session_instructors APIエンドポイントとの通信を担当
 */

import { fetchApi } from '@/lib/api';

/**
 * セッション指導者の基本情報（APIレスポンス用）
 */
export interface SessionInstructor {
  id: string;
  attendance_id: string;
  schedule_id: string;
  schedule_available_venue_id?: string;
  slot_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * セッション指導者の詳細情報（APIレスポンス用）
 */
export interface SessionInstructorWithDetails extends SessionInstructor {
  // 出席者情報
  user_name?: string; // 漢字の姓と名が組み合わされた値（例: "田中 太郎"）
  user_email?: string;
  // 会場情報
  venue_name?: string;
  // スケジュール情報
  schedule_date?: string;
  schedule_title?: string;
}

/**
 * セッション指導者作成用データ
 */
export interface SessionInstructorCreate {
  attendance_id: string;
  schedule_id: string;
  schedule_available_venue_id?: string;
  slot_order: number;
}

/**
 * セッション指導者一括作成用データ
 */
export interface SessionInstructorBulkCreate {
  schedule_id: string;
  schedule_available_venue_id?: string;
  slot_order: number;
  attendance_ids: string[];
}

/**
 * セッション指導者一括作成レスポンス
 */
export interface SessionInstructorBulkResponse {
  created_count: number;
  created_items: SessionInstructor[];
  errors: string[];
}

/**
 * 指導者表示用情報
 */
export interface InstructorDisplayInfo {
  id: string;
  name: string;
  email?: string;
}

/**
 * インストラクター候補情報
 */
export interface InstructorCandidate {
  user_id: string;
  email: string;
  first_name_kanji: string;
  last_name_kanji: string;
  student_id: string;
  grade: number;
  attendance_id: string;
  attendance_status: string;
}

/**
 * セッション指導者APIサービス
 */
export class SessionInstructorService {
  private readonly basePath = '/session-instructors';

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
    try {
      const params = new URLSearchParams();
      if (scheduleId) params.append('schedule_id', scheduleId);
      if (slotOrder !== undefined) params.append('slot_order', slotOrder.toString());
      
      const queryString = params.toString();
      const url = queryString ? `${this.basePath}/?${queryString}` : `${this.basePath}/`;
      
      console.log('SessionInstructorService.getSessionInstructors called with:', {
        scheduleId,
        slotOrder,
        url
      });
      
      const response = await fetchApi(url);
      const data = await response.json();
      
      console.log('SessionInstructorService.getSessionInstructors response:', {
        url,
        status: response.status,
        dataLength: Array.isArray(data) ? data.length : 'not array',
        data
      });
      
      return data;
    } catch (error) {
      console.error('SessionInstructorService.getSessionInstructors error:', {
        scheduleId,
        slotOrder,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
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
    console.log('SessionInstructorService.createSessionInstructor called with:', {
      data,
      basePath: this.basePath,
      url: `${this.basePath}/`
    });
    
    const response = await fetchApi(`${this.basePath}/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    console.log('SessionInstructorService.createSessionInstructor response:', {
      status: response.status,
      ok: response.ok
    });
    
    return await response.json();
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
    return await response.json();
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
    return await response.json();
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
    return await response.json();
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
    return await response.json();
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
    return await response.json();
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

  /**
   * インストラクター候補を取得（学年4かつ出席記録があるユーザー）
   * @param practiceScheduleId - 練習スケジュールID
   * @returns インストラクター候補一覧
   */
  async getInstructorCandidates(practiceScheduleId: string): Promise<InstructorCandidate[]> {
    try {
      const url = `${this.basePath}/candidates?practice_schedule_id=${practiceScheduleId}`;
      console.log('SessionInstructorService.getInstructorCandidates called with:', {
        practiceScheduleId,
        url
      });
      
      const response = await fetchApi(url);
      const data = await response.json();
      
      console.log('SessionInstructorService.getInstructorCandidates response:', {
        url,
        status: response.status,
        dataLength: Array.isArray(data) ? data.length : 'not array',
        data
      });
      
      return data;
    } catch (error) {
      console.error('SessionInstructorService.getInstructorCandidates error:', {
        practiceScheduleId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}

// インスタンスをエクスポート
export const sessionInstructorService = new SessionInstructorService();
