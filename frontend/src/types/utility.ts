/**
 * ユーティリティ型定義
 * 
 * このファイルは汎用的なユーティリティ型を提供します。
 * null許容型、undefined許容型、結果型、非同期データ型などの一般的な型ユーティリティを定義しています。
 */

/**
 * null許容型
 * @template T 基本型
 */
export type Nullable<T> = T | null;

/**
 * undefined許容型
 * @template T 基本型
 */
export type Optional<T> = T | undefined;

/**
 * 結果型（成功または失敗）
 * @template T 成功時の値の型
 * @template E エラー型、デフォルトはError
 */
export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * ネストされたオブジェクトの部分的型
 * @template T 元の型
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * 非同期データの状態型
 * @template T データ型
 * @template E エラー型、デフォルトはError
 */
export type AsyncData<T, E = Error> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E }; 