export interface Attendance {
  id: string;
  practice_schedule_id: string;
  user_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface AttendanceCreate {
  practice_schedule_id: string;
  user_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface AttendanceUpdate {
  status?: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface AttendanceResponse {
  id: string;
  practice_schedule_id: string;
  user_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
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
  excused_count: number;
}

export interface UserAttendanceHistory {
  user_id: string;
  user_name: string;
  total_practices: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_rate: number;
}

export interface PracticeSchedule {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  venue_id: string;
  venue_name: string;
  campus: '今出川' | '京田辺';
  description?: string;
}

export interface AttendanceFormData {
  practice_schedule_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string;
}
