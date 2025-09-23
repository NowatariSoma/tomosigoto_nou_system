import { PracticeSchedule } from '../types';
import { API_ENDPOINTS } from '../constants';
import { fetchApi } from '../../../lib/api';

export class PracticeScheduleService {
  private readonly basePath = API_ENDPOINTS.PRACTICE_SCHEDULES;

  async getPracticeSchedule(id: string): Promise<PracticeSchedule> {
    const response = await fetchApi(`${this.basePath}${id}`);
    return await response.json();
  }

  async getPracticeSchedules(): Promise<PracticeSchedule[]> {
    const response = await fetchApi(this.basePath);
    const data = await response.json();
    return data || [];
  }

  async getUpcomingPracticeSchedules(): Promise<PracticeSchedule[]> {
    const response = await fetchApi(`${this.basePath}upcoming`);
    const data = await response.json();
    return data || [];
  }
}

export const practiceScheduleService = new PracticeScheduleService();
