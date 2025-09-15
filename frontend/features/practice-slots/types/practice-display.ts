// 練習表表示用の型定義

export interface VenueDisplayInfo {
  id: string;
  name: string;
  is_preferred: boolean;
  priority: number;
  notes?: string;
}

export interface InstructorDisplayInfo {
  id: string;
  name: string;
  email?: string;
}

export interface SessionDisplayInfo {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  part_name?: string;
  venue_name?: string;
  priority: number;
  instructors: InstructorDisplayInfo[];
}

export interface PracticeScheduleDisplay {
  id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  description?: string;
  schedule_type?: string;
  status?: string;
  available_venues: VenueDisplayInfo[];
  sessions: SessionDisplayInfo[];
}

// API レスポンス型
export interface PracticeScheduleDisplayResponse extends PracticeScheduleDisplay {}

// 一覧表示用の簡略型
export interface PracticeScheduleSummary {
  id: string;
  schedule_date: string;
  description?: string;
  status?: string;
}