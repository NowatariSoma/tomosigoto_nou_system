export interface Attendance {
  id: string;
  practice_schedule_id: string;
  user_id: string;
  status: 'present' | 'absent' | 'late' | 'no_show';
  notes?: string;
  available_from?: string;
  available_to?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface AttendanceCreate {
  practice_schedule_id: string;
  user_id: string;
  status: 'present' | 'absent' | 'late' | 'no_show';
  notes?: string;
  available_from?: string | null;
  available_to?: string | null;
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

export interface User {
  id: string;
  name: string;
  email: string;
  first_name_kanji?: string;
  last_name_kanji?: string;
  first_name_katakana?: string;
  last_name_katakana?: string;
}

export interface UserWithAttendance extends User {
  attendance?: Attendance;
}

export interface AttendanceTableRow {
  user: User;
  attendance?: Attendance;
}

