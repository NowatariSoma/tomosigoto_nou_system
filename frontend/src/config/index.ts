/**
 * アプリケーション設定
 * 
 * このファイルはアプリケーション全体の設定値を一元管理します。
 * API設定、認証設定、ページネーション設定、日付フォーマット設定などを提供します。
 */

/**
 * 環境変数から値を取得する
 * @param key 環境変数キー
 * @param defaultValue デフォルト値
 * @returns 環境変数の値またはデフォルト値
 */
const getEnvValue = (key: string, defaultValue: string = ''): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
};

/**
 * 環境変数名の接頭辞
 */
const ENV_PREFIX = 'NEXT_PUBLIC_';

/**
 * アプリケーション設定オブジェクト
 */
export const config = {
  /** API基本URL */
  apiBaseUrl: getEnvValue(`${ENV_PREFIX}API_BASE_URL`, 'http://localhost:3001/api'),
  
  /** APIタイムアウト(ミリ秒) */
  apiTimeout: 30000,
  
  /** 認証トークン保存キー */
  authTokenKey: 'auth_token',
  
  /** ページネーション初期設定 */
  paginationDefaults: {
    /** デフォルトページサイズ */
    pageSize: 20,
    /** 最初のページ番号 */
    firstPage: 1,
  },
  
  /** 日付フォーマット設定 */
  dateFormat: {
    /** 標準フォーマット */
    standard: 'YYYY-MM-DD',
    /** 日時フォーマット */
    dateTime: 'YYYY-MM-DD HH:mm',
    /** 表示用フォーマット */
    display: 'YYYY年MM月DD日',
  },
  
  /** 実行環境情報 */
  environment: {
    /** 環境名（development/production/test） */
    name: getEnvValue(`${ENV_PREFIX}ENV`, 'development'),
    /** 開発モードか */
    isDevelopment: getEnvValue(`${ENV_PREFIX}ENV`, 'development') === 'development',
    /** 本番モードか */
    isProduction: getEnvValue(`${ENV_PREFIX}ENV`, 'development') === 'production',
    /** テストモードか */
    isTest: getEnvValue(`${ENV_PREFIX}ENV`, 'development') === 'test',
  },
}; 