export interface PracticeSchedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  venueId: string;
  venueName: string;
  campus: string;
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

export interface UpdatePracticeScheduleRequest {
  date?: string;
  startTime?: string;
  endTime?: string;
  venueId?: string;
  description?: string;
}

export interface PracticeScheduleListResponse {
  schedules: PracticeSchedule[];
  total: number;
}

export interface PracticeScheduleFormData {
  date: string;
  startTime: string;
  endTime: string;
  venueId: string;
  description: string;
}
