export interface Attendance {
  id: string;
  practice_schedule_id: string;
  user_id: string;
  status: 'present' | 'absent' | 'late' | 'no_show';
  notes?: string;
  available_from?: string; // 参加開始時刻（HH:MM形式）
  available_to?: string; // 参加終了時刻（HH:MM形式）
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  user_name?: string; // ユーザー名
  user_email?: string; // ユーザーメールアドレス
}

export interface AttendanceCreate {
  practice_schedule_id: string;
  user_id: string;
  status: 'present' | 'absent' | 'late' | 'no_show';
  notes?: string;
  available_from?: string; // 参加開始時刻（HH:MM形式）
  available_to?: string; // 参加終了時刻（HH:MM形式）
}

export interface AttendanceUpdate {
  status?: 'present' | 'absent' | 'late' | 'no_show';
  notes?: string;
  available_from?: string; // 参加開始時刻（HH:MM形式）
  available_to?: string; // 参加終了時刻（HH:MM形式）
}

export interface AttendanceResponse {
  id: string;
  practice_schedule_id: string;
  user_id: string;
  status: 'present' | 'absent' | 'late' | 'no_show';
  notes?: string;
  available_from?: string; // 参加開始時刻（HH:MM形式）
  available_to?: string; // 参加終了時刻（HH:MM形式）
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface AttendanceSummary {
  practice_schedule_id: string;
  practice_date: string;
  practice_time: string;
  venue_name: string;
  total_users: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  no_show_count: number;
}

export interface UserAttendanceHistory {
  user_id: string;
  user_name: string;
  total_practices: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  no_show_count: number;
  attendance_rate: number;
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
  status: 'present' | 'absent' | 'late' | 'no_show';
  notes: string;
  available_from?: string; // 参加開始時刻（HH:MM形式）
  available_to?: string; // 参加終了時刻（HH:MM形式）
}

export interface AttendanceFormErrors {
  practice_schedule_id?: string;
  status?: string;
  notes?: string;
  available_from?: string;
  available_to?: string;
}
