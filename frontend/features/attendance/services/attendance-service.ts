import { Attendance, AttendanceCreate, AttendanceUpdate, AttendanceResponse, PracticeSchedule } from '../types';
import { API_ENDPOINTS } from '../constants';
import { fetchApi } from '../../../lib/api';

export class AttendanceService {
  private readonly basePath = API_ENDPOINTS.ATTENDANCE;

  async getAttendances(): Promise<Attendance[]> {
    const response = await fetchApi(this.basePath);
    const data = await response.json();
    return data || [];
  }

  async getAttendance(id: string): Promise<Attendance> {
    const response = await fetchApi(`${this.basePath}${id}`);
    return await response.json();
  }

  async getAttendancesByUser(userId: string): Promise<Attendance[]> {
    const response = await fetchApi(`${this.basePath}user/${userId}`);
    return await response.json();
  }

  async getAttendancesByPractice(practiceScheduleId: string): Promise<Attendance[]> {
    const response = await fetchApi(`${this.basePath}practice/${practiceScheduleId}`);
    return await response.json();
  }

  async createAttendance(data: AttendanceCreate): Promise<Attendance> {
    const response = await fetchApi(this.basePath, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await response.json();
  }

  async updateAttendance(id: string, data: AttendanceUpdate): Promise<Attendance> {
    const response = await fetchApi(`${this.basePath}${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
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

  async deleteAttendance(id: string): Promise<void> {
    await fetchApi(`${this.basePath}${id}`, {
      method: 'DELETE',
    });
  }
}

export const attendanceService = new AttendanceService();
