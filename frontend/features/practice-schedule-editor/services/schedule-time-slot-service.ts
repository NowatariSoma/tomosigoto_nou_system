/**
 * スケジュール時間スロットAPIサービス
 */

import { fetchApi } from '../../../lib/api';
import { API_ENDPOINTS } from '../constants';
import { TimeSlot } from '../types/session-editor';

export interface ScheduleTimeSlotResponse {
  id: string;
  schedule_id: string;
  slot_order: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleTimeSlotCreate {
  schedule_id: string;
  slot_order: number;
  start_time: string;
  end_time: string;
}

export interface ScheduleTimeSlotBulkCreate {
  schedule_id: string;
  time_slots: Array<{
    slot_order: number;
    start_time: string;
    end_time: string;
  }>;
}

export class ScheduleTimeSlotService {
  private readonly basePath = API_ENDPOINTS.SCHEDULE_TIME_SLOTS || '/schedule-time-slots';

  /**
   * 指定したスケジュールの時間スロット一覧を取得
   * @param scheduleId - スケジュールID
   * @returns 時間スロット一覧
   */
  async getTimeSlotsBySchedule(scheduleId: string): Promise<ScheduleTimeSlotResponse[]> {
    try {
      const response = await fetchApi(`${this.basePath}/schedule/${scheduleId}`);
      return response.json();
    } catch (error: any) {
      if (error.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * 時間スロットを更新
   * @param timeSlotId - 時間スロットID
   * @param data - 更新するデータ
   */
  async updateTimeSlot(timeSlotId: string, data: { start_time: string; end_time: string }): Promise<ScheduleTimeSlotResponse> {
    const response = await fetchApi(`${this.basePath}/${timeSlotId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  /**
   * 時間スロットを一括作成
   * @param scheduleId - スケジュールID
   * @param timeSlots - 時間スロット一覧
   */
  async createTimeSlotsBulk(scheduleId: string, timeSlots: Array<{ slot_order: number; start_time: string; end_time: string }>): Promise<void> {
    const data: ScheduleTimeSlotBulkCreate = {
      schedule_id: scheduleId,
      time_slots: timeSlots,
    };
    await fetchApi(`${this.basePath}/bulk`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 指定したスケジュールの時間スロットをすべて削除
   * @param scheduleId - スケジュールID
   */
  async deleteTimeSlotsBySchedule(scheduleId: string): Promise<void> {
    await fetchApi(`${this.basePath}/schedule/${scheduleId}`, {
      method: 'DELETE',
    });
  }

  /**
   * DBから取得した時間スロットをTimeSlot形式に変換
   * @param dbTimeSlots - DBから取得した時間スロット
   * @returns TimeSlot形式の時間スロット一覧
   */
  convertToTimeSlots(dbTimeSlots: ScheduleTimeSlotResponse[]): TimeSlot[] {
    return dbTimeSlots.map(slot => {
      const startTime = slot.start_time.substring(0, 5); // HH:MM形式に変換
      const endTime = slot.end_time.substring(0, 5);
      return {
        id: slot.id,
        slot_order: slot.slot_order,
        time: startTime,
        start_time: startTime,
        end_time: endTime,
        display_time: `${startTime}-${endTime}`,
      };
    });
  }
}

export const scheduleTimeSlotService = new ScheduleTimeSlotService();

