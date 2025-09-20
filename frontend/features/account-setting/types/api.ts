// API関連の型定義
export interface ApiError {
  status: number;
  message: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
