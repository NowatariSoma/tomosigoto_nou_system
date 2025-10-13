import { Room } from '../../room-settings/types';

export interface PracticeSchedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  venueId: string;
  venueName: string;
  campus: string;
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  // 複数部屋選択対応
  venueIds?: string[];
  venues?: {
    id: string;
    name: string;
    campus: string;
  }[];
}

export interface CreatePracticeScheduleRequest {
  date: string;
  startTime: string;
  endTime: string;
  venueId: string;
  divisionCount?: number;
  title?: string;
  description?: string;
  // 複数部屋選択対応
  venueIds?: string[];
  scheduleType?: string;
  status?: string;
}

export interface UpdatePracticeScheduleRequest {
  date?: string;
  startTime?: string;
  endTime?: string;
  venueId?: string;
  divisionCount?: number;
  title?: string;
  description?: string;
  // 複数部屋選択対応
  venueIds?: string[];
  scheduleType?: string;
  status?: string;
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
  title: string;
  description: string;
  // 複数部屋選択対応
  venueIds: string[];
  selectedVenues: Room[];
}