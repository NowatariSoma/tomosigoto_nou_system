/**
 * VideoCard - 動画カードコンポーネント
 * 
 * 資料管理機能で使用する動画カードを表示します。
 * - YouTubeサムネイル画像の表示
 * - 動画タイトルとメタ情報（年度、舞台、日付、フェーズなど）の表示
 * - お気に入り機能のサポート
 * - ホバー時のプレイアイコンの表示
 * - クリックでYouTube動画を新しいタブで開く
 */
import { Heart, Play } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Video } from '@/features/materials/types/material_types';

interface VideoCardProps {
  video: Video;
  playlistTitle: string;
  playlistYear: number;
  playlistStage: string;
  subPlaylistPhase?: string;
  recordedDate?: string;
  showFavorite?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

export const VideoCard = ({
  video,
  playlistTitle,
  playlistYear,
  playlistStage,
  subPlaylistPhase,
  recordedDate,
  showFavorite = false,
  isFavorite = false,
  onToggleFavorite
}: VideoCardProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '日付未設定';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={() => window.open(video.videoUrl, '_blank')}
    >
      <div className="relative h-48 overflow-hidden bg-slate-200">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        {showFavorite && onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white transition-all duration-200 z-10"
            aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
          >
            <Heart 
              className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-500'}`} 
            />
          </button>
        )}
      </div>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{video.title}</span>
          <span className="text-sm font-normal text-slate-500">{playlistYear}年</span>
        </CardTitle>
        <CardDescription className="text-xs line-clamp-2">
          {playlistYear}年 {playlistStage} • {formatDate(recordedDate)} • {subPlaylistPhase && `${subPlaylistPhase} • `}YouTubeで視聴
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

