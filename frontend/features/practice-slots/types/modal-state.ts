/**
 * モーダル状態とナビゲーション関連の型定義
 */

/**
 * 日付の移動方向
 */
export type DateDirection = 'prev' | 'next';

/**
 * 日付変更ハンドラーの型
 * @param direction - 移動方向
 */
export type DateChangeHandler = (direction: DateDirection) => void;

/**
 * 日付設定ハンドラーの型
 * @param date - 設定する日付
 */
export type DateSetHandler = (date: Date) => void;
