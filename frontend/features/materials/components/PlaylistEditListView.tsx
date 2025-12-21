/**
 * PlaylistEditListView - プレイリスト編集一覧ビューコンポーネント
 * 
 * 編集用のプレイリスト一覧表示コンポーネントです。
 * - フィルター機能付きプレイリスト一覧
 * - クリックで各プレイリストの編集画面へ遷移
 * - カード形式での視覚的な表示
 */
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/layout/card';
import { Playlist } from '@/features/materials/types/material_types';

interface PlaylistEditListViewProps {
  playlists: Playlist[];
  getSubPlaylistCount: (playlistId: string) => number;
  onPlaylistSelect: (playlist: Playlist) => void;
}

export const PlaylistEditListView = ({
  playlists,
  getSubPlaylistCount,
  onPlaylistSelect,
}: PlaylistEditListViewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {playlists.map((playlist) => {
        const subPlaylistCount = getSubPlaylistCount(playlist.id);
        return (
          <Card
            key={playlist.id}
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => onPlaylistSelect(playlist)}
          >
            <div className="relative h-48 overflow-hidden bg-slate-200">
              {playlist.thumbnailUrl ? (
                <img
                  src={playlist.thumbnailUrl}
                  alt={playlist.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  No Image
                </div>
              )}
            </div>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{playlist.year}年 {playlist.stage}</span>
                <span className="text-sm font-normal text-slate-500">{playlist.year}年</span>
              </CardTitle>
              <CardDescription>
                {subPlaylistCount}件のサブプレイリスト
              </CardDescription>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
};

