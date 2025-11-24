/**
 * PlaylistEditView - プレイリスト編集ビューコンポーネント
 * 
 * プレイリストの詳細編集画面全体を表示します。
 * - プレイリスト情報の編集
 * - サブプレイリスト一覧の表示
 * - 各サブプレイリストの編集・削除・移動操作
 */
import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { Playlist, SubPlaylist, Video } from '@/features/materials/types/material_types';
import { EditSubPlaylistCard } from './EditSubPlaylistCard';
import { PlaylistEditInfoCard } from './PlaylistEditInfoCard';
import { CreateSubPlaylistDialog } from './CreateSubPlaylistDialog';
import { CreateVideoDialog } from './CreateVideoDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';

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
  onSubPlaylistClick?: (subPlaylist: SubPlaylist) => void;
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
  onSubPlaylistClick,
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

  const [sortBy, setSortBy] = useState<'recordedDate' | 'createdAt'>('createdAt');

  // ダイアログが開かれたときに、親プレイリストIDを確実に設定
  useEffect(() => {
    if (isSubPlaylistDialogOpen && playlist.id) {
      setSubPlaylistData(prev => ({ ...prev, playlistId: playlist.id }));
    }
  }, [isSubPlaylistDialogOpen, playlist.id]);

  const handleSubPlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubPlaylistCreate) {
      // 親プレイリストIDが設定されていない場合は、現在のプレイリストIDを使用
      const dataToSubmit = {
        ...subPlaylistData,
        playlistId: subPlaylistData.playlistId || playlist.id,
      };
      onSubPlaylistCreate(dataToSubmit);
    }
    
    // Reset form
    setSubPlaylistData({ playlistId: playlist.id, title: '', recordedDate: '', phase: '', playlistUrl: '' });
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
      // API連携は親コンポーネントで処理
    }
    
    // Reset form
    setVideoData({ title: '', videoUrl: '', recordedDate: '', thumbnailUrl: '' });
    setSelectedSubPlaylistId(null);
    setIsVideoDialogOpen(false);
  };

  // ソートされたサブプレイリスト一覧
  const sortedSubPlaylists = useMemo(() => {
    return [...subPlaylists].sort((a, b) => {
      if (sortBy === 'recordedDate') {
        // 録画日順（降順：新しいものが上、空の場合は最後）
        if (!a.recordedDate && !b.recordedDate) return 0;
        if (!a.recordedDate) return 1;
        if (!b.recordedDate) return -1;
        const dateA = new Date(a.recordedDate).getTime();
        const dateB = new Date(b.recordedDate).getTime();
        return dateB - dateA;
      } else {
        // 作成日時順（降順：新しいものが上）
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      }
    });
  }, [subPlaylists, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2 w-full sm:w-auto"
          size="sm"
        >
          ← 戻る
        </Button>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 break-words">{playlist.title}</h2>
      </div>

      <PlaylistEditInfoCard
        playlist={playlist}
        onSave={onSavePlaylist}
        onDelete={onDeletePlaylist}
      />

      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">サブプレイリスト一覧</h3>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="sub-playlist-sort-select" className="text-sm text-slate-600 whitespace-nowrap">
                並び順:
              </label>
              <Select value={sortBy} onValueChange={(value: 'recordedDate' | 'createdAt') => setSortBy(value)}>
                <SelectTrigger id="sub-playlist-sort-select" className="w-[180px]">
                  <SelectValue placeholder="並び順を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">作成日時</SelectItem>
                  <SelectItem value="recordedDate">録画日</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                setSubPlaylistData({ playlistId: playlist.id, title: '', recordedDate: '', phase: '', playlistUrl: '' });
                setIsSubPlaylistDialogOpen(true);
              }}
              className="flex items-center gap-2 w-full sm:w-auto"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              サブプレイリストを追加
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {sortedSubPlaylists.map((subPlaylist) => {
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
                onClick={onSubPlaylistClick ? () => onSubPlaylistClick(subPlaylist) : undefined}
                playlistId={playlist.id}
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
        parentPlaylist={playlist}
        existingSubPlaylists={subPlaylists}
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

