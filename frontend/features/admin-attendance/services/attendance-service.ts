import { Attendance, AttendanceCreate } from '../types';
import { API_ENDPOINTS } from '../constants';
import { fetchApi } from '../../../lib/api';

export class AdminAttendanceService {
  private readonly basePath = API_ENDPOINTS.ATTENDANCE;

  async getAttendancesByPractice(practiceScheduleId: string): Promise<Attendance[]> {
    const response = await fetchApi(`${this.basePath}practice/${practiceScheduleId}`);
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

