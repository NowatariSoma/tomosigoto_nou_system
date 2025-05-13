/**
 * APIレスポンスに関する型定義を提供するモジュール
 * このファイルにはAPIとの通信で使用する共通型定義が含まれています。
 * 
 * @module types/api
 */

/**
 * API応答の基本構造
 * @template T レスポンスデータの型
 */
export interface ApiResponse<T> {
  /** 応答データ */
  data: T;
  /** HTTPステータスコード */
  status: number;
  /** 応答メッセージ */
  message: string;
  /** レスポンスのタイムスタンプ */
  timestamp: Date;
}

/**
 * ページネーション応答構造
 * @template T アイテムの型
 */
export interface PaginatedResponse<T> {
  /** アイテムリスト */
  items: T[];
  /** 合計アイテム数 */
  total: number;
  /** 現在のページ番号 */
  page: number;
  /** ページあたりのアイテム数 */
  pageSize: number;
  /** 続きがあるかどうか */
  hasMore: boolean;
}

/**
 * APIエラー応答構造
 */
export interface ApiError {
  /** エラーコード */
  code: string;
  /** エラーメッセージ */
  message: string;
  /** エラーの詳細情報 */
  details: any;
} 