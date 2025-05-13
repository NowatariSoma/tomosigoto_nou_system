/**
 * APIエンドポイント定義
 * 
 * このファイルはAPIエンドポイントの定数を提供します。
 * アプリケーション全体でAPIパスを一元管理することで、変更が容易になります。
 */

/**
 * ユーザー関連エンドポイント
 */
export const UserEndpoints = {
  /** ユーザー一覧取得 */
  LIST: '/users',
  /** ユーザー詳細取得 */
  DETAIL: (id: string) => `/users/${id}`,
  /** ユーザー作成 */
  CREATE: '/users',
  /** ユーザー更新 */
  UPDATE: (id: string) => `/users/${id}`,
  /** ユーザー削除 */
  DELETE: (id: string) => `/users/${id}`,
};

/**
 * 認証関連エンドポイント
 */
export const AuthEndpoints = {
  /** ログイン */
  LOGIN: '/auth/login',
  /** ログアウト */
  LOGOUT: '/auth/logout',
  /** パスワードリセット要求 */
  RESET_PASSWORD: '/auth/reset-password',
  /** 現在のユーザー情報取得 */
  CURRENT_USER: '/auth/me',
};

/**
 * スケジュール関連エンドポイント
 */
export const ScheduleEndpoints = {
  /** スケジュール一覧取得 */
  LIST: '/schedules',
  /** スケジュール詳細取得 */
  DETAIL: (id: string) => `/schedules/${id}`,
  /** スケジュール作成 */
  CREATE: '/schedules',
  /** スケジュール更新 */
  UPDATE: (id: string) => `/schedules/${id}`,
  /** スケジュール削除 */
  DELETE: (id: string) => `/schedules/${id}`,
  /** スケジュールセッション一覧取得 */
  SESSIONS: (id: string) => `/schedules/${id}/sessions`,
};

/**
 * セッション関連エンドポイント
 */
export const SessionEndpoints = {
  /** セッション一覧取得 */
  LIST: '/sessions',
  /** セッション詳細取得 */
  DETAIL: (id: string) => `/sessions/${id}`,
  /** セッション作成 */
  CREATE: '/sessions',
  /** セッション更新 */
  UPDATE: (id: string) => `/sessions/${id}`,
  /** セッション削除 */
  DELETE: (id: string) => `/sessions/${id}`,
}; 