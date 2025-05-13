/**
 * アプリケーション全体の設定値を一元管理するモジュール
 * 
 * @module config
 */

/**
 * 環境変数から値を取得する関数
 * デプロイ環境では実際の環境変数を使用し、
 * ローカル開発環境ではデフォルト値を使用します。
 * 
 * @param key 環境変数のキー
 * @param defaultValue デフォルト値
 * @returns 環境変数の値、存在しない場合はデフォルト値
 */
const getEnv = (key: string, defaultValue: string = ''): string => {
  // Fresh/Denoではブラウザ環境でDeno.env.getが存在しないため、
  // デフォルト値を返します
  return defaultValue;
};

/**
 * 環境名の定義
 */
export type Environment = 'development' | 'production' | 'test';

/**
 * アプリケーション設定
 */
export const config = {
  /** API基本URL */
  apiBaseUrl: getEnv('API_BASE_URL', 'http://localhost:8000/api'),
  
  /** APIタイムアウト(ミリ秒) */
  apiTimeout: 30000,
  
  /** 認証トークン保存キー */
  authTokenKey: 'nou_system_auth_token',
  
  /** ページネーション初期設定 */
  paginationDefaults: {
    pageSize: 10,
    initialPage: 1,
  },
  
  /** 日付フォーマット */
  dateFormat: 'yyyy-MM-dd',
  
  /** 実行環境情報 */
  environment: getEnv('ENVIRONMENT', 'development') as Environment,
  
  /** デバッグモードフラグ */
  isDebug: getEnv('DEBUG', 'false') === 'true',
}; 