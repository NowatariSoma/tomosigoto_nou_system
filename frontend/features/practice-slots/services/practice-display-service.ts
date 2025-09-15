import {
  PracticeScheduleDisplay,
  PracticeScheduleSummary,
  PracticeScheduleDisplayResponse
} from '../types/practice-display';
import { API_ENDPOINTS } from '../constants';
import { fetchApi } from '../../../lib/api';

export class PracticeDisplayService {
  private readonly basePath = API_ENDPOINTS.PRACTICE_SCHEDULES;

  async getPracticeSchedules(): Promise<PracticeScheduleSummary[]> {
    const response = await fetchApi(this.basePath);
    const schedules = await response.json();

    // サマリー形式に変換
    return schedules.map((schedule: any) => ({
      id: schedule.id,
      schedule_date: schedule.schedule_date,
      description: schedule.description,
      status: schedule.status,
    }));
  }

  async getPracticeScheduleForDisplay(id: string): Promise<PracticeScheduleDisplay> {
    const response = await fetchApi(API_ENDPOINTS.PRACTICE_SCHEDULE_DISPLAY(id));
    const schedule: PracticeScheduleDisplayResponse = await response.json();
    return schedule;
  }
}

export const practiceDisplayService = new PracticeDisplayService();