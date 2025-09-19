export interface PracticeSchedule {
  id: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  venueId: string;
  venueName: string;
  campus: '今出川' | '京田辺';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePracticeScheduleRequest {
  date: string;
  startTime: string;
  endTime: string;
  venueId: string;
  description?: string;
}

export interface UpdatePracticeScheduleRequest extends Partial<CreatePracticeScheduleRequest> {}

export interface PracticeScheduleListResponse {
  schedules: PracticeSchedule[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PracticeScheduleFormData {
  date: string;
  startTime: string;
  endTime: string;
  venueId: string;
  description: string;
}
