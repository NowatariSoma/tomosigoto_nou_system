/**
 * セッション操作用のサービス
 */

import { 
  Session, 
  CreateSessionRequest, 
  UpdateSessionRequest 
} from '../types/session-editor';
import { 
  SessionApiResponse, 
  SessionApiCreateRequest, 
  SessionApiUpdateRequest 
} from '../types/api';
import { API_ENDPOINTS } from '../constants';
import { fetchApi } from '../../../lib/api';

export class SessionService {
  private readonly basePath = API_ENDPOINTS.SESSIONS;

  /**
   * 指定したスケジュールのセッション一覧を取得
   * @param scheduleId - スケジュールID
   * @returns セッション一覧
   */
  async getSessionsBySchedule(scheduleId: string): Promise<Session[]> {
    const response = await fetchApi(`${API_ENDPOINTS.PRACTICE_SCHEDULES}${scheduleId}/sessions`);
    const apiSessions: SessionApiResponse[] = await response.json();
    
    return apiSessions.map(apiSession => this.mapApiResponseToSession(apiSession));
  }

  /**
   * 指定したIDのセッションを取得
   * @param sessionId - セッションID
   * @returns セッション情報
   */
  async getSession(sessionId: string): Promise<Session> {
    const response = await fetchApi(`${this.basePath}/${sessionId}`);
    const apiSession: SessionApiResponse = await response.json();
    return this.mapApiResponseToSession(apiSession);
  }

  /**
   * 新しいセッションを作成
   * @param data - セッション作成データ
   * @returns 作成されたセッション
   */
  async createSession(data: CreateSessionRequest): Promise<Session> {
    const apiRequest = this.mapCreateRequestToApiRequest(data);
    const response = await fetchApi(this.basePath, {
      method: 'POST',
      body: JSON.stringify(apiRequest),
    });
    const apiSession: SessionApiResponse = await response.json();
    return this.mapApiResponseToSession(apiSession);
  }

  /**
   * セッションを更新
   * @param sessionId - セッションID
   * @param data - セッション更新データ
   * @returns 更新されたセッション
   */
  async updateSession(sessionId: string, data: UpdateSessionRequest): Promise<Session> {
    const apiRequest = this.mapUpdateRequestToApiRequest(data);
    const response = await fetchApi(`${this.basePath}/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(apiRequest),
    });
    const apiSession: SessionApiResponse = await response.json();
    return this.mapApiResponseToSession(apiSession);
  }

  /**
   * セッションを削除
   * @param sessionId - セッションID
   */
  async deleteSession(sessionId: string): Promise<void> {
    await fetchApi(`${this.basePath}/${sessionId}`, {
      method: 'DELETE',
    });
  }

  /**
   * セッションの位置を変更（ドラッグ&ドロップ用）
   * @param sessionId - セッションID
   * @param venueId - 新しい会場ID
   * @param timeSlot - 新しい時間スロット
   * @param slotOrder - 新しいスロット順序
   */
  async moveSession(
    sessionId: string,
    venueId: string,
    slotOrder: number
  ): Promise<Session> {
    const response = await fetchApi(`${this.basePath}/${sessionId}/move?target_venue_id=${venueId}&target_slot_order=${slotOrder}`, {
      method: 'PUT',
    });
    const apiSession: SessionApiResponse = await response.json();
    return this.mapApiResponseToSession(apiSession);
  }

  /**
   * APIレスポンスをSession型にマッピング
   */
  private mapApiResponseToSession(apiResponse: SessionApiResponse): Session {
    return {
      id: apiResponse.id,
      schedule_id: apiResponse.schedule_id,
      part_id: apiResponse.part_id,
      part_name: apiResponse.part_name,
      slot_order: apiResponse.slot_order,
      schedule_available_venue_id: apiResponse.schedule_available_venue_id,
      priority: apiResponse.priority,
      created_at: apiResponse.created_at,
      updated_at: apiResponse.updated_at,
    };
  }

  /**
   * CreateSessionRequestをAPIリクエストにマッピング
   */
  private mapCreateRequestToApiRequest(request: CreateSessionRequest): SessionApiCreateRequest {
    const apiRequest: SessionApiCreateRequest = {
      schedule_id: request.schedule_id,
      slot_order: request.slot_order,
      priority: request.priority,
    };

    if (request.part_id !== undefined) apiRequest.part_id = request.part_id;
    if (request.schedule_available_venue_id !== undefined) apiRequest.schedule_available_venue_id = request.schedule_available_venue_id;

    return apiRequest;
  }

  /**
   * UpdateSessionRequestをAPIリクエストにマッピング
   */
  private mapUpdateRequestToApiRequest(request: UpdateSessionRequest): SessionApiUpdateRequest {
    const apiRequest: SessionApiUpdateRequest = {};
    
    if (request.part_id !== undefined) apiRequest.part_id = request.part_id;
    if (request.slot_order !== undefined) apiRequest.slot_order = request.slot_order;
    if (request.schedule_available_venue_id !== undefined) apiRequest.schedule_available_venue_id = request.schedule_available_venue_id;
    if (request.priority !== undefined) apiRequest.priority = request.priority;
    
    return apiRequest;
  }
}

export const sessionService = new SessionService();
