export interface Group {
  id?: string;
  name: string;
  display_name: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface GroupCreate {
  name: string;
  display_name: string;
  color?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface GroupUpdate {
  name?: string;
  display_name?: string;
  color?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}




