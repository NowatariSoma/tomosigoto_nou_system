export type AttendanceStatusType = 'present' | 'absent' | 'late' | 'no_show' | 'undecided';

export interface Attendance {
  id: string;
  practice_schedule_id: string;
  user_id: string;
  status: AttendanceStatusType;
  notes?: string;
  available_from?: string; // 参加開始時刻（HH:MM形式）
  available_to?: string; // 参加終了時刻（HH:MM形式）
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface AttendanceCreate {
  practice_schedule_id: string;
  user_id: string;
  status: AttendanceStatusType;
  notes?: string;
  available_from?: string; // 参加開始時刻（HH:MM形式）
  available_to?: string; // 参加終了時刻（HH:MM形式）
}

export interface AttendanceUpdate {
  status?: AttendanceStatusType;
  notes?: string;
  available_from?: string; // 参加開始時刻（HH:MM形式）
  available_to?: string; // 参加終了時刻（HH:MM形式）
}

export interface AttendanceResponse {
  id: string;
  practice_schedule_id: string;
  user_id: string;
  status: AttendanceStatusType;
  notes?: string;
  available_from?: string; // 参加開始時刻（HH:MM形式）
  available_to?: string; // 参加終了時刻（HH:MM形式）
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface PracticeSchedule {
  id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  division_count: number;
  title?: string;
  description?: string;
  schedule_type?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  venues?: {
    id: string;
    name: string;
    campus: string;
  }[];
}

export interface AttendanceFormData {
  practice_schedule_id: string;
  status: AttendanceStatusType;
  notes: string;
  available_from?: string; // 参加開始時刻（HH:MM形式）
  available_to?: string; // 参加終了時刻（HH:MM形式）
}

export interface User {
  id: string;
  name: string;
  email: string;
}
