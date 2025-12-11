export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// PracticeScheduleApiResponseはschemas.tsで定義されているため、ここでは定義しない
// schemas.ts の PracticeScheduleApiResponseSchema から推論された型を使用する

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
