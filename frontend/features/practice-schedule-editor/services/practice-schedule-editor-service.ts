/**
 * 練習スケジュール編集用のサービス
 */

import { 
  PracticeScheduleDetailsApiResponse 
} from '../types/api';
import { 
  Session, 
  VenueInfo, 
  TimeSlot 
} from '../types/session-editor';
import { API_ENDPOINTS, TIME_SLOTS } from '../constants';
import { fetchApi } from '../../../lib/api';

export class PracticeScheduleEditorService {
  private readonly basePath = API_ENDPOINTS.PRACTICE_SCHEDULES;

  /**
   * 指定したスケジュールの基本情報を取得
   * @param scheduleId - スケジュールID
   * @returns スケジュール基本情報
   */
  async getBasicSchedule(scheduleId: string): Promise<any> {
    try {
      const response = await fetchApi(`${this.basePath}/${scheduleId}`);
      return response.json();
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 指定したスケジュールの詳細情報を取得
   * @param scheduleId - スケジュールID
   * @returns スケジュール詳細情報
   */
  async getScheduleDetails(scheduleId: string): Promise<PracticeScheduleDetailsApiResponse> {
    try {
      const response = await fetchApi(`${this.basePath}/${scheduleId}/details`);
      return response.json();
    } catch (error: any) {
      if (error.status === 404) {
        // 詳細情報が取得できない場合は、基本情報のみで空の詳細情報を返す
        const basicSchedule = await this.getBasicSchedule(scheduleId);
        if (!basicSchedule) {
          throw new Error('スケジュールが見つかりません');
        }
        
        return {
          id: basicSchedule.id,
          schedule_date: basicSchedule.schedule_date,
          start_time: basicSchedule.start_time,
          end_time: basicSchedule.end_time,
          title: basicSchedule.title,
          description: basicSchedule.description,
          schedule_type: basicSchedule.schedule_type,
          status: basicSchedule.status,
          created_at: basicSchedule.created_at,
          updated_at: basicSchedule.updated_at,
          available_venues: [],
          sessions: [],
        };
      }
      throw error;
    }
  }

  /**
   * 指定した日付のスケジュール詳細を取得
   * @param date - 対象日付 (YYYY-MM-DD形式)
   * @returns スケジュール詳細情報
   */
  async getScheduleDetailsByDate(date: string): Promise<PracticeScheduleDetailsApiResponse | null> {
    try {
      // まず基本情報を取得してスケジュールIDを取得
      const basicResponse = await fetchApi(`${this.basePath}/date/${date}`);
      const basicSchedule = await basicResponse.json();
      
      if (!basicSchedule || !basicSchedule.id) {
        return null;
      }
      
      // スケジュールIDを使って詳細情報を取得
      return this.getScheduleDetails(basicSchedule.id);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 時間スロットを生成
   * @param startTime - 開始時間 (HH:MM形式)
   * @param endTime - 終了時間 (HH:MM形式)
   * @returns 時間スロット一覧
   */
  generateTimeSlots(startTime: string, endTime: string): TimeSlot[] {
    const slots: TimeSlot[] = [];
    
    // 開始時間と終了時間を分に変換
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    
    // 30分間隔で時間スロットを生成
    for (let minutes = startMinutes; minutes < endMinutes; minutes += TIME_SLOTS.INTERVAL_MINUTES) {
      const timeString = this.minutesToTime(minutes);
      const nextMinutes = Math.min(minutes + TIME_SLOTS.INTERVAL_MINUTES, endMinutes);
      const nextTimeString = this.minutesToTime(nextMinutes);
      
      slots.push({
        time: timeString,
        start_time: timeString,
        end_time: nextTimeString,
        display_time: `${timeString}-${nextTimeString}`,
      });
    }
    
    return slots;
  }

  /**
   * 会場情報を取得
   * @returns 会場一覧
   */
  async getVenues(): Promise<VenueInfo[]> {
    const response = await fetchApi(API_ENDPOINTS.VENUES);
    const venues = await response.json();
    
    return venues.map((venue: any) => ({
      id: venue.id,
      name: venue.name,
      is_preferred: venue.is_preferred || false,
      priority: venue.priority || 0,
      notes: venue.notes,
    }));
  }

  /**
   * 時間文字列を分に変換
   * @param timeString - 時間文字列 (HH:MM形式)
   * @returns 分
   */
  private timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * 分を時間文字列に変換
   * @param minutes - 分
   * @returns 時間文字列 (HH:MM形式)
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}

export const practiceScheduleEditorService = new PracticeScheduleEditorService();
