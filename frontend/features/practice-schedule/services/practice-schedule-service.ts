import { PracticeSchedule, CreatePracticeScheduleRequest, UpdatePracticeScheduleRequest, PracticeScheduleListResponse } from '../types';
import { API_ENDPOINTS } from '../constants';
import { fetchApi } from '../../../lib/api';

export class PracticeScheduleService {
  private readonly basePath = API_ENDPOINTS.PRACTICE_SCHEDULES;

  async getPracticeSchedules(): Promise<PracticeSchedule[]> {
    const response = await fetchApi(this.basePath);
    const data = await response.json();
    return data.schedules || [];
  }

  async getPracticeSchedule(id: string): Promise<PracticeSchedule> {
    const response = await fetchApi(`${this.basePath}${id}`);
    return await response.json();
  }

  async createPracticeSchedule(data: CreatePracticeScheduleRequest): Promise<PracticeSchedule> {
    const response = await fetchApi(this.basePath, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await response.json();
  }

  async updatePracticeSchedule(id: string, data: UpdatePracticeScheduleRequest): Promise<PracticeSchedule> {
    const response = await fetchApi(`${this.basePath}${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return await response.json();
  }

  async deletePracticeSchedule(id: string): Promise<void> {
    await fetchApi(`${this.basePath}${id}`, {
      method: 'DELETE',
    });
  }
}

export const practiceScheduleService = new PracticeScheduleService();
