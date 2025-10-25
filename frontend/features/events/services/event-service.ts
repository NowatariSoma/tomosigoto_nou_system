import { fetchApi } from '@/lib/api';
import { API_ENDPOINTS } from '../constants';
import {
  Event,
  Round,
  CreateEventRequest,
  UpdateEventRequest,
  CreateRoundRequest,
  UpdateRoundRequest,
  EventWithRounds,
} from '../types';

/**
 * イベント管理サービスクラス
 */
export class EventService {
  private readonly basePath = API_ENDPOINTS.EVENTS;

  /**
   * すべてのイベントを取得
   */
  async getEvents(): Promise<Event[]> {
    const response = await fetchApi(this.basePath);
    return response.json();
  }

  /**
   * 指定したIDのイベントを取得（ラウンド情報を含む）
   */
  async getEvent(eventId: string): Promise<EventWithRounds> {
    const response = await fetchApi(`${this.basePath}${eventId}`);
    return response.json();
  }

  /**
   * イベントを作成
   */
  async createEvent(data: CreateEventRequest): Promise<Event> {
    const response = await fetchApi(this.basePath, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  /**
   * イベントを更新
   */
  async updateEvent(eventId: string, data: UpdateEventRequest): Promise<Event> {
    const response = await fetchApi(`${this.basePath}${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  /**
   * イベントを削除
   */
  async deleteEvent(eventId: string): Promise<void> {
    await fetchApi(`${this.basePath}${eventId}`, {
      method: 'DELETE',
    });
  }

  /**
   * 指定したイベントのラウンド一覧を取得
   */
  async getRoundsByEvent(eventId: string): Promise<Round[]> {
    const response = await fetchApi(`${this.basePath}${eventId}/rounds`);
    return response.json();
  }

  /**
   * 指定したIDのラウンドを取得
   */
  async getRound(eventId: string, roundId: string): Promise<Round> {
    const response = await fetchApi(`${this.basePath}${eventId}/rounds/${roundId}`);
    return response.json();
  }

  /**
   * ラウンドを作成
   */
  async createRound(eventId: string, data: CreateRoundRequest): Promise<Round> {
    const response = await fetchApi(`${this.basePath}${eventId}/rounds`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  /**
   * ラウンドを更新
   */
  async updateRound(eventId: string, roundId: string, data: UpdateRoundRequest): Promise<Round> {
    const response = await fetchApi(`${this.basePath}${eventId}/rounds/${roundId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  /**
   * ラウンドを削除
   */
  async deleteRound(eventId: string, roundId: string): Promise<void> {
    await fetchApi(`${this.basePath}${eventId}/rounds/${roundId}`, {
      method: 'DELETE',
    });
  }
}

// シングルトンインスタンスをエクスポート
export const eventService = new EventService();
