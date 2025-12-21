/**
 * SubPlaylistEditView - サブプレイリスト編集ビューコンポーネント
 * 
 * サブプレイリストの詳細編集画面全体を表示します。
 * - サブプレイリスト情報の表示
 * - 動画一覧の表示
 * - 動画の削除操作
 * - 親プレイリストへの戻り操作
 * - サブプレイリストの追加・編集機能
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/forms/button';
import { ChevronRight, Trash2, Plus, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Badge } from '@/components/ui/feedback/badge';
import { SubPlaylist, Playlist, Video } from '@/features/materials/types/material_types';
import { EditVideoCard } from './EditVideoCard';
import { CreateSubPlaylistDialog } from './CreateSubPlaylistDialog';
import { CreateVideoDialog } from './CreateVideoDialog';
import { materialsService } from '@/features/materials/services/materials-service';

interface SubPlaylistEditViewProps {
  subPlaylist: SubPlaylist;
  playlist: Playlist | undefined;
  videos: Video[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onMove: (id: string) => void;
  onVideoDelete: (id: string) => void;
  formatDate: (dateString?: string) => string;
  onSubPlaylistCreate?: (data: { title: string; recordedDate: string; phase: string; playlistUrl: string }) => void;
  onSubPlaylistUpdate?: (id: string, data: { title: string; recordedDate: string; phase: string; playlistUrl: string }) => void;
  onVideoAdd?: (playlistId: string, subPlaylistId: string, data: { title: string; videoUrl: string; recordedDate: string; thumbnailUrl?: string }) => Promise<void>;
}

export const SubPlaylistEditView = ({
  subPlaylist,
  playlist,
  videos,
  onBack,
  onDelete,
  onMove,
  onVideoDelete,
  formatDate,
  onSubPlaylistCreate,
  onSubPlaylistUpdate,
  onVideoAdd,
}: SubPlaylistEditViewProps) => {
  const [isSubPlaylistDialogOpen, setIsSubPlaylistDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingSubPlaylists, setExistingSubPlaylists] = useState<SubPlaylist[]>([]);
  const [subPlaylistData, setSubPlaylistData] = useState({
    playlistId: '',
    title: '',
    recordedDate: '',
    phase: '',
    playlistUrl: '',
  });
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [videoData, setVideoData] = useState({
    title: '',
    videoUrl: '',
    recordedDate: '',
    thumbnailUrl: '',
  });

  // 編集モードの初期化
  useEffect(() => {
    if (isEditMode && subPlaylist) {
      setSubPlaylistData({
        playlistId: subPlaylist.playlistId,
        title: subPlaylist.title,
        recordedDate: subPlaylist.recordedDate || '',
        phase: subPlaylist.phase || '',
        playlistUrl: subPlaylist.playlistUrl || '',
      });
    }
  }, [isEditMode, subPlaylist]);

  // 既存のサブプレイリスト一覧を取得
  useEffect(() => {
    const loadSubPlaylists = async () => {
      if (playlist?.id) {
        try {
          const subPlaylists = await materialsService.getSubPlaylists(playlist.id);
          setExistingSubPlaylists(subPlaylists);
        } catch (error) {
          console.error('Failed to load sub-playlists:', error);
          setExistingSubPlaylists([]);
        }
      }
    };
    loadSubPlaylists();
  }, [playlist?.id]);

  // ダイアログが開かれたときに、親プレイリストIDを確実に設定
  useEffect(() => {
    if (isSubPlaylistDialogOpen && playlist?.id) {
      setSubPlaylistData(prev => ({ ...prev, playlistId: playlist.id }));
    }
  }, [isSubPlaylistDialogOpen, playlist?.id]);

  const handleSubPlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && onSubPlaylistUpdate) {
      onSubPlaylistUpdate(subPlaylist.id, {
        title: subPlaylistData.title,
        recordedDate: subPlaylistData.recordedDate,
        phase: subPlaylistData.phase,
        playlistUrl: subPlaylistData.playlistUrl,
      });
    } else if (!isEditMode && onSubPlaylistCreate) {
      const dataToSubmit = {
        ...subPlaylistData,
        playlistId: subPlaylistData.playlistId || playlist?.id || '',
      };
      onSubPlaylistCreate(dataToSubmit);
    }
    
    // Reset form
    setSubPlaylistData({ playlistId: playlist?.id || '', title: '', recordedDate: '', phase: '', playlistUrl: '' });
    setIsSubPlaylistDialogOpen(false);
    setIsEditMode(false);
  };

  const handleAddClick = () => {
    setIsEditMode(false);
    setSubPlaylistData({ playlistId: playlist?.id || '', title: '', recordedDate: '', phase: '', playlistUrl: '' });
    setIsSubPlaylistDialogOpen(true);
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    setIsSubPlaylistDialogOpen(true);
  };

  const handleVideoAddClick = () => {
    setVideoData({ title: '', videoUrl: '', recordedDate: '', thumbnailUrl: '' });
    setIsVideoDialogOpen(true);
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onVideoAdd && playlist?.id) {
      try {
        await onVideoAdd(playlist.id, subPlaylist.id, {
          title: videoData.title,
          videoUrl: videoData.videoUrl,
          recordedDate: videoData.recordedDate,
          thumbnailUrl: videoData.thumbnailUrl || undefined,
        });
        // Reset form
        setVideoData({ title: '', videoUrl: '', recordedDate: '', thumbnailUrl: '' });
        setIsVideoDialogOpen(false);
      } catch (error) {
        console.error('Failed to add video:', error);
        alert('動画の追加に失敗しました');
      }
    }
  };

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
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 break-words">{subPlaylist.title}</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg sm:text-xl">サブプレイリスト情報</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                onClick={() => onMove(subPlaylist.id)}
                size="sm"
                className="flex items-center gap-2 flex-1 sm:flex-initial"
              >
                <ChevronRight className="h-4 w-4" />
                移動
              </Button>
              {onSubPlaylistUpdate && (
                <Button
                  variant="outline"
                  onClick={handleEditClick}
                  size="sm"
                  className="flex items-center gap-2 flex-1 sm:flex-initial"
                >
                  <Edit className="h-4 w-4" />
                  編集
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => onDelete(subPlaylist.id)}
                size="sm"
                className="flex items-center gap-2 flex-1 sm:flex-initial"
              >
                <Trash2 className="h-4 w-4" />
                削除
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <span className="font-semibold">親プレイリスト:</span> {playlist?.title}
            </div>
            <div>
              <span className="font-semibold">フェーズ:</span> <Badge variant="secondary">{subPlaylist.phase}</Badge>
            </div>
            <div>
              <span className="font-semibold">録画日:</span> {formatDate(subPlaylist.recordedDate)}
            </div>
            <div>
              <span className="font-semibold">動画数:</span> {videos.length}件
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">動画一覧</h3>
          {onVideoAdd && (
            <Button
              onClick={handleVideoAddClick}
              className="flex items-center gap-2 w-full sm:w-auto"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              動画を追加
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((video) => (
            <EditVideoCard
              key={video.id}
              video={video}
              onDelete={onVideoDelete}
              showDate={true}
              formatDate={formatDate}
              playlistId={playlist?.id}
              subPlaylistId={subPlaylist.id}
            />
          ))}
        </div>
      </div>

      <CreateSubPlaylistDialog
        open={isSubPlaylistDialogOpen}
        onOpenChange={setIsSubPlaylistDialogOpen}
        subPlaylistData={subPlaylistData}
        setSubPlaylistData={setSubPlaylistData}
        onSubmit={handleSubPlaylistSubmit}
        parentPlaylist={playlist || undefined}
        isEditMode={isEditMode}
        existingSubPlaylists={existingSubPlaylists}
        currentSubPlaylistId={isEditMode ? subPlaylist.id : undefined}
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

