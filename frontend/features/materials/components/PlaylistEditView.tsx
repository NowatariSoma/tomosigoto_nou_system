/**
 * PlaylistEditView - プレイリスト編集ビューコンポーネント
 * 
 * プレイリストの詳細編集画面全体を表示します。
 * - プレイリスト情報の編集
 * - サブプレイリスト一覧の表示
 * - 各サブプレイリストの編集・削除・移動操作
 */
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { Playlist, SubPlaylist, Video } from '@/features/materials/types/material_types';
import { EditSubPlaylistCard } from './EditSubPlaylistCard';
import { PlaylistEditInfoCard } from './PlaylistEditInfoCard';
import { CreateSubPlaylistDialog } from './CreateSubPlaylistDialog';
import { CreateVideoDialog } from './CreateVideoDialog';

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
  onSubPlaylistCreate?: (data: { title: string; recordedDate: string; phase: string; playlistUrl: string }) => void;
  onVideoAdd?: boolean;
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
  onSubPlaylistCreate,
  onVideoAdd,
  formatDate,
}: PlaylistEditViewProps) => {
  const [isSubPlaylistDialogOpen, setIsSubPlaylistDialogOpen] = useState(false);
  const [subPlaylistData, setSubPlaylistData] = useState({
    playlistId: '',
    title: '',
    recordedDate: '',
    phase: '',
    playlistUrl: '',
  });

  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [selectedSubPlaylistId, setSelectedSubPlaylistId] = useState<string | null>(null);
  const [videoData, setVideoData] = useState({
    title: '',
    videoUrl: '',
    recordedDate: '',
    thumbnailUrl: '',
  });

  const handleSubPlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubPlaylistCreate) {
      onSubPlaylistCreate(subPlaylistData);
    }
    // TODO: API integration
    console.log('Creating sub-playlist:', subPlaylistData);
    alert('サブプレイリストを作成しました\n（実際のAPI連携は未実装）');
    
    // Reset form
    setSubPlaylistData({ playlistId: '', title: '', recordedDate: '', phase: '', playlistUrl: '' });
    setIsSubPlaylistDialogOpen(false);
  };

  const handleVideoAddClick = (subPlaylistId: string) => {
    setSelectedSubPlaylistId(subPlaylistId);
    setVideoData({ title: '', videoUrl: '', recordedDate: '', thumbnailUrl: '' });
    setIsVideoDialogOpen(true);
  };

  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onVideoAdd && selectedSubPlaylistId) {
      // TODO: API integration
      console.log('Creating video:', videoData, 'for subPlaylist:', selectedSubPlaylistId);
      alert('動画を追加しました\n（実際のAPI連携は未実装）');
    }
    
    // Reset form
    setVideoData({ title: '', videoUrl: '', recordedDate: '', thumbnailUrl: '' });
    setSelectedSubPlaylistId(null);
    setIsVideoDialogOpen(false);
  };

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

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900">サブプレイリスト一覧</h3>
          <Button
            onClick={() => {
              setSubPlaylistData({ ...subPlaylistData, playlistId: playlist.id });
              setIsSubPlaylistDialogOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            サブプレイリストを追加
          </Button>
        </div>
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
                onVideoAdd={onVideoAdd !== false ? () => handleVideoAddClick(subPlaylist.id) : undefined}
                formatDate={formatDate}
                getVideosForSubPlaylist={getVideosForSubPlaylist}
                onVideoDelete={onDeleteVideo}
              />
            );
          })}
        </div>
      </div>

      <CreateSubPlaylistDialog
        open={isSubPlaylistDialogOpen}
        onOpenChange={setIsSubPlaylistDialogOpen}
        subPlaylistData={subPlaylistData}
        setSubPlaylistData={setSubPlaylistData}
        onSubmit={handleSubPlaylistSubmit}
      />

      <CreateVideoDialog
        open={isVideoDialogOpen}
        onOpenChange={setIsVideoDialogOpen}
        videoData={videoData}
        setVideoData={setVideoData}
        onSubmit={handleVideoSubmit}
      />
    </div>
  );
};

