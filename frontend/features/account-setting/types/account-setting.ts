export interface AccountSettingProfile {
  id: string;
  user_id: string;
  student_id: string;
  first_name_kanji: string;
  first_name_katakana: string;
  last_name_kanji: string;
  last_name_katakana: string;
  year: number;
  department_code: string;
  department_name?: string;
  email: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface AccountSettingUpdateRequest {
  student_id?: string;
  first_name_kanji?: string;
  first_name_katakana?: string;
  last_name_kanji?: string;
  last_name_katakana?: string;
  year?: number;
  department_code?: string;
  email?: string;
  avatar_url?: string;
  change_reason?: string;
}

export interface Department {
  id: string;
  department_code: string;
  department_name: string;
  is_active: boolean;
  campus?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: string;
}

export interface ValidationResponse {
  is_valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}
