/**
 * 動画プレイリストの型定義
 */
export interface VideoPlaylist {
  /** プレイリストの一意ID */
  id: string;
  /** 舞台のタイトル */
  title: string;
  /** 年度 */
  year: number;
  /** フェーズ（稽古または本番） */
  phase: '稽古' | '本番';
  /** YouTubeのURL */
  youtubeUrl: string;
  /** サムネイル画像のURL */
  thumbnailUrl: string;
}