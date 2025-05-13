/**
 * ドメインモデルの型定義
 * 
 * このファイルはアプリケーションで使用するドメインモデルの型定義を提供します。
 * ユーザー、ロール、スケジュール、セッションなどの基本的なエンティティを定義しています。
 */

/**
 * ユーザーモデル
 */
export interface User {
  /** ユーザーID */
  id: string;
  /** メールアドレス */
  email: string;
  /** 表示名 */
  displayName: string;
  /** ロールリスト */
  roles: Role[];
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

/**
 * ロールモデル
 */
export interface Role {
  /** ロールID */
  id: string;
  /** ロール名 */
  name: string;
  /** 権限リスト */
  permissions: string[];
}

/**
 * スケジュールモデル
 */
export interface Schedule {
  /** スケジュールID */
  id: string;
  /** タイトル */
  title: string;
  /** 開始日 */
  startDate: Date;
  /** 終了日 */
  endDate: Date;
  /** 場所 */
  location: string;
  /** セッションリスト */
  sessions: Session[];
  /** 作成者ID */
  createdBy: string;
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

/**
 * セッションモデル
 */
export interface Session {
  /** セッションID */
  id: string;
  /** タイトル */
  title: string;
  /** 開始時間 */
  startTime: Date;
  /** 終了時間 */
  endTime: Date;
  /** 説明 */
  description: string;
  /** 参加者リスト */
  participants: User[];
  /** 監督者リスト */
  supervisors: User[];
} 