import { fetchApi } from '@/lib/api'
import type {
  Event,
  EventSettlement,
  EventSettlementSummary,
  EventWithSettlements,
  CreateEventInput,
  UpdateEventInput,
  CreateSettlementInput,
  UpdateSettlementInput,
} from '../types'

const API_BASE_PATH = '/events'

/**
 * イベント管理サービス
 */
class EventsService {
  // ===== Event CRUD =====

  /**
   * すべてのイベントを取得
   */
  async getEvents(limit?: number): Promise<Event[]> {
    const url = limit ? `${API_BASE_PATH}?limit=${limit}` : API_BASE_PATH
    const response = await fetchApi(url)
    return response.json()
  }

  /**
   * 指定されたIDのイベントを取得
   */
  async getEvent(eventId: string): Promise<Event> {
    const response = await fetchApi(`${API_BASE_PATH}/${eventId}`)
    return response.json()
  }

  /**
   * 新しいイベントを作成
   */
  async createEvent(eventData: CreateEventInput): Promise<Event> {
    const response = await fetchApi(API_BASE_PATH, {
      method: 'POST',
      body: JSON.stringify(eventData),
    })
    return response.json()
  }

  /**
   * イベントを更新
   */
  async updateEvent(eventId: string, eventData: UpdateEventInput): Promise<Event> {
    const response = await fetchApi(`${API_BASE_PATH}/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    })
    return response.json()
  }

  /**
   * イベントを削除
   */
  async deleteEvent(eventId: string): Promise<void> {
    await fetchApi(`${API_BASE_PATH}/${eventId}`, {
      method: 'DELETE',
    })
  }

  // ===== Event Settlement =====

  /**
   * 指定されたイベントの決済情報を取得
   */
  async getEventSettlements(eventId: string): Promise<EventSettlement[]> {
    const response = await fetchApi(`${API_BASE_PATH}/${eventId}/settlement`)
    return response.json()
  }

  /**
   * 指定されたイベントの決済サマリーを取得
   */
  async getEventSettlementSummary(eventId: string): Promise<EventSettlementSummary> {
    const response = await fetchApi(`${API_BASE_PATH}/${eventId}/settlement/summary`)
    return response.json()
  }

  /**
   * イベントの決済情報を作成
   */
  async createEventSettlement(
    eventId: string,
    settlementData: CreateSettlementInput
  ): Promise<EventSettlement> {
    const response = await fetchApi(`${API_BASE_PATH}/${eventId}/settlement`, {
      method: 'POST',
      body: JSON.stringify(settlementData),
    })
    return response.json()
  }

  /**
   * 指定されたIDの決済情報を取得
   */
  async getSettlement(settlementId: string): Promise<EventSettlement> {
    const response = await fetchApi(`${API_BASE_PATH}/settlements/${settlementId}`)
    return response.json()
  }

  /**
   * 決済情報を更新
   */
  async updateSettlement(
    settlementId: string,
    settlementData: UpdateSettlementInput
  ): Promise<EventSettlement> {
    const response = await fetchApi(`${API_BASE_PATH}/settlements/${settlementId}`, {
      method: 'PUT',
      body: JSON.stringify(settlementData),
    })
    return response.json()
  }

  /**
   * 決済情報を削除
   */
  async deleteSettlement(settlementId: string): Promise<void> {
    await fetchApi(`${API_BASE_PATH}/settlements/${settlementId}`, {
      method: 'DELETE',
    })
  }

  // ===== Combined Operations =====

  /**
   * 決済情報を含むイベントを取得
   */
  async getEventWithSettlements(eventId: string): Promise<EventWithSettlements> {
    const response = await fetchApi(`${API_BASE_PATH}/${eventId}/with-settlements`)
    return response.json()
  }
}

// シングルトンインスタンスをエクスポート
export const eventsService = new EventsService()
export default eventsService
