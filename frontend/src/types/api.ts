/**
 * APIレスポンスの型定義
 * 
 * このファイルはAPIとの通信に関わる型定義を提供します。
 * 基本的なレスポンス構造、ページネーション、エラー型などを定義しています。
 */

/**
 * API応答の基本構造
 * @template T レスポンスデータの型
 */
export interface ApiResponse<T> {
  /** レスポンスデータ */
  data: T;
  /** ステータスコード */
  status: number;
  /** メッセージ */
  message: string;
  /** タイムスタンプ */
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
  /** 現在のページ */
  page: number;
  /** ページサイズ */
  pageSize: number;
  /** 続きがあるか */
  hasMore: boolean;
}

/**
 * エラー応答構造
 */
export interface ApiError {
  /** エラーコード */
  code: string;
  /** エラーメッセージ */
  message: string;
  /** 詳細情報 */
  details: any;
} 