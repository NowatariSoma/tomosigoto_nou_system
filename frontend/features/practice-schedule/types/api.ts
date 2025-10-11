export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// バックエンドのPracticeScheduleResponse型（推測）
export interface PracticeScheduleApiResponse {
  id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  division_count?: number;
  title?: string;
  description?: string;
  schedule_type?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  // 複数部屋選択対応
  venue_ids?: string[];
  venues?: {
    id: string;
    name: string;
    campus: string;
  }[];
}

// バックエンドのPracticeScheduleCreate型（推測）
export interface PracticeScheduleApiRequest {
  schedule_date: string;
  start_time: string;
  end_time: string;
  division_count?: number;
  title?: string;
  description?: string;
  schedule_type?: string;
  status?: string;
  // 複数部屋選択対応
  venue_ids?: string[];
}

// バックエンドのPracticeScheduleUpdate型（推測）
export interface PracticeScheduleApiUpdateRequest {
  schedule_date?: string;
  start_time?: string;
  end_time?: string;
  division_count?: number;
  title?: string;
  description?: string;
  schedule_type?: string;
  status?: string;
  // 複数部屋選択対応
  venue_ids?: string[];
}
