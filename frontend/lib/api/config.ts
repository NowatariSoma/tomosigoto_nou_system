/**
 * API設定の統一管理
 * 全てのAPIクライアントでこの設定を使用する
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
  AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:8001',
} as const;

/**
 * API URLを構築するヘルパー関数
 * @param endpoint - エンドポイントパス（例: '/practice_slots'）
 * @returns 完全なAPI URL
 */
export function buildApiUrl(endpoint: string): string {
  // エンドポイントが既に完全なURLの場合はそのまま返す
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // エンドポイントが/で始まらない場合は/を追加
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${API_CONFIG.BASE_URL}${normalizedEndpoint}`;
}

/**
 * 認証URLを構築するヘルパー関数
 * @param endpoint - エンドポイントパス（例: '/auth/login'）
 * @returns 完全な認証URL
 */
export function buildAuthUrl(endpoint: string): string {
  // エンドポイントが既に完全なURLの場合はそのまま返す
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // エンドポイントが/で始まらない場合は/を追加
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${API_CONFIG.AUTH_URL}${normalizedEndpoint}`;
}
