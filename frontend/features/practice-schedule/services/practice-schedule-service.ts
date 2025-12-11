import { PracticeSchedule, CreatePracticeScheduleRequest, UpdatePracticeScheduleRequest, PracticeScheduleApiResponse } from '../types';
import { mapApiResponseToPracticeSchedule, mapCreateRequestToApiRequest, mapUpdateRequestToApiRequest } from '../mappers';
import { API_ENDPOINTS } from '../constants';
import { fetchApi } from '../../../lib/api';

export class PracticeScheduleService {
  private readonly basePath = API_ENDPOINTS.PRACTICE_SCHEDULES;

  async getPracticeSchedules(): Promise<PracticeSchedule[]> {
    const response = await fetchApi(this.basePath);
    const apiSchedules: PracticeScheduleApiResponse[] = await response.json();
    
    // 会場情報を取得してマッピング（簡易実装）
    return apiSchedules.map(apiSchedule => 
      mapApiResponseToPracticeSchedule(apiSchedule)
    );
  }

  async getPracticeSchedule(id: string): Promise<PracticeSchedule> {
    const response = await fetchApi(`${this.basePath}${id}`);
    const apiSchedule: PracticeScheduleApiResponse = await response.json();
    return mapApiResponseToPracticeSchedule(apiSchedule);
  }

  async createPracticeSchedule(data: CreatePracticeScheduleRequest): Promise<PracticeSchedule> {
    const apiRequest = mapCreateRequestToApiRequest(data);
    const response = await fetchApi(this.basePath, {
      method: 'POST',
      body: JSON.stringify(apiRequest),
    });
    const apiSchedule: PracticeScheduleApiResponse = await response.json();
    return mapApiResponseToPracticeSchedule(apiSchedule);
  }

  async updatePracticeSchedule(id: string, data: UpdatePracticeScheduleRequest): Promise<PracticeSchedule> {
    const apiRequest = mapUpdateRequestToApiRequest(data);
    const response = await fetchApi(`${this.basePath}${id}`, {
      method: 'PUT',
      body: JSON.stringify(apiRequest),
    });
    const apiSchedule: PracticeScheduleApiResponse = await response.json();
    return mapApiResponseToPracticeSchedule(apiSchedule);
  }

  async deletePracticeSchedule(id: string): Promise<void> {
    await fetchApi(`${this.basePath}${id}`, {
      method: 'DELETE',
    });
  }
}

export const practiceScheduleService = new PracticeScheduleService();
