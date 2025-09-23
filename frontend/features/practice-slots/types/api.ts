/**
 * API関連の型定義
 */

/**
 * APIエラー
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

/**
 * APIレスポンスの基本型
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/**
 * HTTP エラーレスポンス
 */
export interface HttpErrorResponse {
  status: number;
  statusText: string;
  message: string;
  details?: any;
}
