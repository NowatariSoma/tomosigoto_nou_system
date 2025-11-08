import { Attendance, AttendanceCreate, UserWithAttendanceResponse } from '../types';
import { API_ENDPOINTS } from '../constants';
import { fetchApi } from '../../../lib/api';

export class AdminAttendanceService {
  private readonly basePath = API_ENDPOINTS.ATTENDANCE;

  async getAttendancesByPractice(practiceScheduleId: string): Promise<Attendance[]> {
    const response = await fetchApi(`${this.basePath}practice/${practiceScheduleId}`);
    return await response.json();
  }

  async getUsersWithAttendance(params?: {
    practice_schedule_id?: string;
    status?: string;
    user_name?: string;
    page?: number;
    limit?: number;
  }): Promise<UserWithAttendanceResponse[]> {
    const queryParams = new URLSearchParams();
    if (params?.practice_schedule_id) {
      queryParams.append('practice_schedule_id', params.practice_schedule_id);
    }
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    if (params?.user_name) {
      queryParams.append('user_name', params.user_name);
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    const queryString = queryParams.toString();
    const url = `${this.basePath}admin/list${queryString ? `?${queryString}` : ''}`;
    const response = await fetchApi(url);
    return await response.json();
  }

  async bulkUpdateAttendances(
    practiceScheduleId: string,
    attendances: AttendanceCreate[]
  ): Promise<Attendance[]> {
    const response = await fetchApi(`${this.basePath}bulk/${practiceScheduleId}`, {
      method: 'POST',
      body: JSON.stringify(attendances),
    });
    return await response.json();
  }

  async upsertAttendance(data: AttendanceCreate): Promise<Attendance> {
    const response = await fetchApi(`${this.basePath}upsert`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await response.json();
  }
}

export const adminAttendanceService = new AdminAttendanceService();

