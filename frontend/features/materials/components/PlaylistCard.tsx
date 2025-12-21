/**
 * PlaylistCard - プレイリストカードコンポーネント
 * 
 * 資料管理機能で使用するプレイリストカードを表示します。
 * - メインプレイリスト（年度+舞台）とサブプレイリストの両方に対応
 * - サムネイル画像の表示
 * - タイトルと説明文の表示
 * - カスタム説明文のオプション対応
 * - クリックで詳細ページへ遷移
 */
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Playlist, SubPlaylist } from '@/features/materials/types/material_types';

interface PlaylistCardProps {
  playlist: Playlist | SubPlaylist;
  showYear?: boolean;
  showPhase?: boolean;
  customDescription?: string;
  onClick: () => void;
}

export const PlaylistCard = ({
  playlist,
  showYear = false,
  showPhase = false,
  customDescription,
  onClick
}: PlaylistCardProps) => {
  const isSubPlaylist = 'playlistId' in playlist;
  
  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden bg-slate-200">
        {playlist.thumbnailUrl ? (
          <img
            src={playlist.thumbnailUrl}
            alt={playlist.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            No Image
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{isSubPlaylist ? playlist.title : `${(playlist as Playlist).year}年 ${(playlist as Playlist).stage}`}</span>
          {showYear && (
            <span className="text-sm font-normal text-slate-500">{(playlist as Playlist).year}年</span>
          )}
        </CardTitle>
        <CardDescription className="text-xs line-clamp-2">
          {customDescription || (
            isSubPlaylist 
              ? `${(playlist as SubPlaylist).phase} • YouTubeで視聴`
              : `${(playlist as Playlist).stage} - プレイリスト詳細を見る`
          )}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

