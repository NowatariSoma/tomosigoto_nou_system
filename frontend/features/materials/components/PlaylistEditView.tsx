/**
 * PlaylistEditView - プレイリスト編集ビューコンポーネント
 * 
 * プレイリストの詳細編集画面全体を表示します。
 * - プレイリスト情報の編集
 * - サブプレイリスト一覧の表示
 * - 各サブプレイリストの編集・削除・移動操作
 */
import { Button } from '@/components/ui/forms/button';
import { Playlist, SubPlaylist, Video } from '@/features/materials/types/material_types';
import { EditSubPlaylistCard } from './EditSubPlaylistCard';
import { PlaylistEditInfoCard } from './PlaylistEditInfoCard';

interface PlaylistEditViewProps {
  playlist: Playlist;
  subPlaylists: SubPlaylist[];
  getVideosForSubPlaylist: (subPlaylistId: string) => Video[];
  onBack: () => void;
  onSavePlaylist: (data: { title: string; year: number; stage: string }) => void;
  onDeletePlaylist: (id: string) => void;
  onDeleteSubPlaylist: (id: string) => void;
  onDeleteVideo: (id: string) => void;
  onMoveSubPlaylist: (id: string) => void;
  formatDate: (dateString?: string) => string;
}

export const PlaylistEditView = ({
  playlist,
  subPlaylists,
  getVideosForSubPlaylist,
  onBack,
  onSavePlaylist,
  onDeletePlaylist,
  onDeleteSubPlaylist,
  onDeleteVideo,
  onMoveSubPlaylist,
  formatDate,
}: PlaylistEditViewProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          ← 戻る
        </Button>
        <h2 className="text-2xl font-bold text-slate-900">{playlist.title}</h2>
      </div>

      <PlaylistEditInfoCard
        playlist={playlist}
        onSave={onSavePlaylist}
        onDelete={onDeletePlaylist}
      />

      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">サブプレイリスト一覧</h3>
        <div className="space-y-4">
          {subPlaylists.map((subPlaylist) => {
            const videoCount = getVideosForSubPlaylist(subPlaylist.id).length;
            return (
              <EditSubPlaylistCard
                key={subPlaylist.id}
                subPlaylist={subPlaylist}
                videoCount={videoCount}
                onMove={onMoveSubPlaylist}
                onDelete={onDeleteSubPlaylist}
                formatDate={formatDate}
                getVideosForSubPlaylist={getVideosForSubPlaylist}
                onVideoDelete={onDeleteVideo}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

