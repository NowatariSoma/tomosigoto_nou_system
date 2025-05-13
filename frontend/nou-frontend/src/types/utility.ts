/**
 * 汎用的なユーティリティ型を提供するモジュール
 * このファイルには型操作のためのユーティリティ型定義が含まれています。
 * 
 * @module types/utility
 */

/**
 * null許容型
 * @template T ベースとなる型
 */
export type Nullable<T> = T | null;

/**
 * undefined許容型
 * @template T ベースとなる型
 */
export type Optional<T> = T | undefined;

/**
 * 結果型（成功または失敗）
 * @template T 成功時の値の型
 * @template E エラーの型
 */
export type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * ネストされたオブジェクトの部分的型
 * @template T ベースとなる型
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

/**
 * 非同期データの状態型
 * @template T データの型
 * @template E エラーの型
 */
export type AsyncData<T, E = Error> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E }; 