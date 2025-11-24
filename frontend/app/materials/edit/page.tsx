'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Plus } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Playlist, SubPlaylist, Video } from '@/features/materials/types/material_types';
import { MaterialFilterSelects } from '@/features/materials/components/MaterialFilterSelects';
import { FilterOption } from '@/shared/types/filter_types';
import { PlaylistEditView } from '@/features/materials/components/PlaylistEditView';
import { SubPlaylistEditView } from '@/features/materials/components/SubPlaylistEditView';
import { PlaylistEditListView } from '@/features/materials/components/PlaylistEditListView';
import { CreatePlaylistDialog } from '@/features/materials/components/CreatePlaylistDialog';
import { materialsService } from '@/features/materials/services/materials-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';

type EditMode = 'list' | 'playlist' | 'subPlaylist' | null;

// 非同期データ取得を処理するラッパーコンポーネント（プレイリスト編集用）
function PlaylistEditViewAsyncWrapper({
  playlist,
  onBack,
  onSavePlaylist,
  onDeletePlaylist,
  onDeleteSubPlaylist,
  onDeleteVideo,
  onMoveSubPlaylist,
  onSubPlaylistCreate,
  formatDate,
  onSubPlaylistClick,
}: {
  playlist: Playlist;
  onBack: () => void;
  onSavePlaylist: (data: { title: string; year: number; stage: string }) => void;
  onDeletePlaylist: (id: string) => void;
  onDeleteSubPlaylist: (id: string) => void;
  onDeleteVideo: (id: string) => void;
  onMoveSubPlaylist: (id: string) => void;
  onSubPlaylistCreate?: (data: { title: string; recordedDate: string; phase: string; playlistUrl: string }) => void;
  formatDate: (dateString?: string) => string;
  onSubPlaylistClick?: (subPlaylist: SubPlaylist) => void;
}) {
  const [subPlaylists, setSubPlaylists] = useState<SubPlaylist[]>([]);
  const [videosBySubPlaylist, setVideosBySubPlaylist] = useState<Record<string, Video[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await materialsService.getSubPlaylists(playlist.id);
        setSubPlaylists(data);
        
        // 各サブプレイリストの動画を取得
        const videosMap: Record<string, Video[]> = {};
        for (const subPlaylist of data) {
          try {
            const videos = await materialsService.getVideos(playlist.id, subPlaylist.id);
            videosMap[subPlaylist.id] = videos;
          } catch (err) {
            console.error(`Failed to load videos for sub-playlist ${subPlaylist.id}:`, err);
            videosMap[subPlaylist.id] = [];
          }
        }
        setVideosBySubPlaylist(videosMap);
      } catch (error) {
        console.error('Failed to load sub-playlists:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [playlist.id]);

  const getVideosForSubPlaylist = (subPlaylistId: string): Video[] => {
    return videosBySubPlaylist[subPlaylistId] || [];
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  return (
    <PlaylistEditView
      playlist={playlist}
      subPlaylists={subPlaylists}
      getVideosForSubPlaylist={getVideosForSubPlaylist}
      onBack={onBack}
      onSavePlaylist={onSavePlaylist}
      onDeletePlaylist={onDeletePlaylist}
      onDeleteSubPlaylist={onDeleteSubPlaylist}
      onDeleteVideo={onDeleteVideo}
      onMoveSubPlaylist={onMoveSubPlaylist}
      onSubPlaylistCreate={onSubPlaylistCreate}
      onVideoAdd={true}
      formatDate={formatDate}
      onSubPlaylistClick={onSubPlaylistClick}
    />
  );
}

// 非同期データ取得を処理するラッパーコンポーネント（サブプレイリスト編集用）
function SubPlaylistEditViewAsyncWrapper({
  subPlaylist,
  playlist,
  onBack,
  onDelete,
  onMove,
  onVideoDelete,
  formatDate,
  onSubPlaylistCreate,
  onSubPlaylistUpdate,
}: {
  subPlaylist: SubPlaylist;
  playlist: Playlist;
  onBack: () => void;
  onDelete: (id: string) => void;
  onMove: (id: string) => void;
  onVideoDelete: (id: string) => void;
  formatDate: (dateString?: string) => string;
  onSubPlaylistCreate?: (data: { title: string; recordedDate: string; phase: string; playlistUrl: string }) => void;
  onSubPlaylistUpdate?: (id: string, data: { title: string; recordedDate: string; phase: string; playlistUrl: string }) => void;
}) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setIsLoading(true);
        const data = await materialsService.getVideos(playlist.id, subPlaylist.id);
        setVideos(data);
      } catch (error) {
        console.error('Failed to load videos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadVideos();
  }, [playlist.id, subPlaylist.id]);

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  return (
    <SubPlaylistEditView
      subPlaylist={subPlaylist}
      playlist={playlist}
      videos={videos}
      onBack={onBack}
      onDelete={onDelete}
      onMove={onMove}
      onVideoDelete={onVideoDelete}
      formatDate={formatDate}
      onSubPlaylistCreate={onSubPlaylistCreate}
      onSubPlaylistUpdate={onSubPlaylistUpdate}
    />
  );
}

export default function EditMaterialPage() {
  const router = useRouter();
  const [editMode, setEditMode] = useState<EditMode>('list');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [selectedSubPlaylist, setSelectedSubPlaylist] = useState<SubPlaylist | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [subPlaylistCounts, setSubPlaylistCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'year'>('createdAt');
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const [playlistFormData, setPlaylistFormData] = useState({
    title: '',
    year: '',
    stage: '',
  });

  // データ取得
  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        setIsLoading(true);
        const data = await materialsService.getPlaylists();
        setPlaylists(data);
        
        // 各プレイリストのサブプレイリスト数を取得
        const counts: Record<string, number> = {};
        for (const playlist of data) {
          try {
            const subPlaylists = await materialsService.getSubPlaylists(playlist.id);
            counts[playlist.id] = subPlaylists.length;
          } catch (err) {
            console.error(`Failed to load sub-playlists count for ${playlist.id}:`, err);
            counts[playlist.id] = 0;
          }
        }
        setSubPlaylistCounts(counts);
      } catch (error) {
        console.error('Failed to load playlists:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlaylists();
  }, []);

  const handleSavePlaylist = async (data: { title: string; year: number; stage: string }) => {
    if (!selectedPlaylist) return;
    try {
      await materialsService.updatePlaylist(selectedPlaylist.id, {
        title: data.title,
        year: data.year,
        stage: data.stage,
      });
      // プレイリスト一覧を再取得
      const updatedPlaylists = await materialsService.getPlaylists();
      setPlaylists(updatedPlaylists);
      const updated = updatedPlaylists.find(p => p.id === selectedPlaylist.id);
      if (updated) setSelectedPlaylist(updated);
      alert('プレイリスト情報を保存しました');
    } catch (error) {
      console.error('Failed to save playlist:', error);
      alert('プレイリストの保存に失敗しました');
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (confirm('本当にこのプレイリストを削除しますか？\nこの操作は取り消せません。')) {
      try {
        await materialsService.deletePlaylist(playlistId);
        const updatedPlaylists = await materialsService.getPlaylists();
        setPlaylists(updatedPlaylists);
        setEditMode('list');
        setSelectedPlaylist(null);
        alert('プレイリストを削除しました');
      } catch (error) {
        console.error('Failed to delete playlist:', error);
        alert('プレイリストの削除に失敗しました');
      }
    }
  };

  const handleDeleteSubPlaylist = async (subPlaylistId: string) => {
    if (!selectedPlaylist) return;
    if (confirm('本当にこのサブプレイリストを削除しますか？\nこの操作は取り消せません。')) {
      try {
        await materialsService.deleteSubPlaylist(selectedPlaylist.id, subPlaylistId);
        alert('サブプレイリストを削除しました');
        // プレイリスト情報を再取得
        const updated = await materialsService.getPlaylist(selectedPlaylist.id);
        setSelectedPlaylist(updated);
      } catch (error) {
        console.error('Failed to delete sub-playlist:', error);
        alert('サブプレイリストの削除に失敗しました');
      }
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!selectedPlaylist) return;
    // サブプレイリストIDを取得する必要がある
    // ここでは簡略化のため、すべてのサブプレイリストから探す
    try {
      const subPlaylists = await materialsService.getSubPlaylists(selectedPlaylist.id);
      for (const subPlaylist of subPlaylists) {
        try {
          const videos = await materialsService.getVideos(selectedPlaylist.id, subPlaylist.id);
          const video = videos.find(v => v.id === videoId);
          if (video) {
            await materialsService.deleteVideo(selectedPlaylist.id, subPlaylist.id, videoId);
            alert('動画を削除しました');
            // プレイリスト情報を再取得
            const updated = await materialsService.getPlaylist(selectedPlaylist.id);
            setSelectedPlaylist(updated);
            return;
          }
        } catch (err) {
          // エラーを無視して続行
        }
      }
      alert('動画が見つかりませんでした');
    } catch (error) {
      console.error('Failed to delete video:', error);
      alert('動画の削除に失敗しました');
    }
  };

  const handleMoveSubPlaylist = (subPlaylistId: string) => {
    // TODO: この機能は後で実装
    alert('別のプレイリストに移動しますか？\n（この機能は未実装です）');
  };

  const handleCreatePlaylistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await materialsService.createPlaylist({
        title: playlistFormData.title,
        stage: playlistFormData.stage,
        year: parseInt(playlistFormData.year, 10),
      });
      const updatedPlaylists = await materialsService.getPlaylists();
      setPlaylists(updatedPlaylists);
      setPlaylistFormData({ title: '', year: '', stage: '' });
      setIsPlaylistDialogOpen(false);
      alert('プレイリストを作成しました');
    } catch (error) {
      console.error('Failed to create playlist:', error);
      alert('プレイリストの作成に失敗しました');
    }
  };

  const handleCreateSubPlaylist = async (data: { title: string; recordedDate: string; phase: string; playlistUrl: string }) => {
    if (!selectedPlaylist) return;
    try {
      await materialsService.createSubPlaylist(selectedPlaylist.id, {
        title: data.title,
        recordedDate: data.recordedDate,
        phase: data.phase,
        playlistUrl: data.playlistUrl,
      });
      // プレイリスト情報を再取得
      const updated = await materialsService.getPlaylist(selectedPlaylist.id);
      setSelectedPlaylist(updated);
      // サブプレイリスト画面にいる場合は、サブプレイリストも更新
      if (selectedSubPlaylist) {
        const subPlaylists = await materialsService.getSubPlaylists(selectedPlaylist.id);
        const updatedSubPlaylist = subPlaylists.find(sp => sp.id === selectedSubPlaylist.id);
        if (updatedSubPlaylist) {
          setSelectedSubPlaylist(updatedSubPlaylist);
        }
      }
      alert('サブプレイリストを作成しました');
    } catch (error) {
      console.error('Failed to create sub-playlist:', error);
      alert('サブプレイリストの作成に失敗しました');
    }
  };

  const handleUpdateSubPlaylist = async (subPlaylistId: string, data: { title: string; recordedDate: string; phase: string; playlistUrl: string }) => {
    if (!selectedPlaylist) return;
    try {
      await materialsService.updateSubPlaylist(selectedPlaylist.id, subPlaylistId, {
        title: data.title,
        recordedDate: data.recordedDate,
        phase: data.phase,
        playlistUrl: data.playlistUrl,
      });
      // プレイリスト情報を再取得
      const updated = await materialsService.getPlaylist(selectedPlaylist.id);
      setSelectedPlaylist(updated);
      // サブプレイリスト情報を再取得
      const subPlaylists = await materialsService.getSubPlaylists(selectedPlaylist.id);
      const updatedSubPlaylist = subPlaylists.find(sp => sp.id === subPlaylistId);
      if (updatedSubPlaylist) {
        setSelectedSubPlaylist(updatedSubPlaylist);
      }
      alert('サブプレイリストを更新しました');
    } catch (error) {
      console.error('Failed to update sub-playlist:', error);
      alert('サブプレイリストの更新に失敗しました');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '日付未設定';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // フィルター設定
  const years = Array.from(new Set(playlists.map((item: Playlist) => item.year))).sort((a: number, b: number) => b - a);
  const stages = Array.from(new Set(playlists.map((item: Playlist) => item.stage))).sort();

  const yearOptions: FilterOption[] = [
    { value: 'all', label: 'すべての年度' },
    ...years.map((year: number) => ({ value: year.toString(), label: `${year}年` }))
  ];

  const stageOptions: FilterOption[] = [
    { value: 'all', label: 'すべての舞台' },
    ...stages.map((stage: string) => ({ value: stage, label: stage }))
  ];

  const filterConfigs = [
    {
      id: 'year',
      placeholder: '年度を選択',
      options: yearOptions,
      value: selectedYear,
      onValueChange: setSelectedYear
    },
    {
      id: 'stage',
      placeholder: '舞台を選択',
      options: stageOptions,
      value: selectedStage,
      onValueChange: setSelectedStage
    }
  ];

  // フィルターされたプレイリストを取得
  const filteredPlaylists = playlists
    .filter((playlist) => {
      const matchesYear = selectedYear === 'all' || playlist.year.toString() === selectedYear;
      const matchesStage = selectedStage === 'all' || playlist.stage === selectedStage;
      return matchesYear && matchesStage;
    })
    .sort((a, b) => {
      if (sortBy === 'createdAt') {
        // 作成日時順（降順：新しいものが上）
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      } else {
        // 年度順（降順：新しい年度が上）
        return b.year - a.year;
      }
    });


  return (
    <AppTemplate
      title="能楽部資料庫"
      description="プレイリストの編集"
      icon={<Archive className="h-8 w-8 text-blue-600" />}
      maxWidth="7xl"
    >
      <main className="container mx-auto px-4 py-8">
        {editMode === 'list' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/materials')}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  ← 戻る
                </Button>
                <h1 className="text-xl sm:text-3xl font-bold text-slate-900">プレイリストを編集</h1>
              </div>
              <Button
                onClick={() => setIsPlaylistDialogOpen(true)}
                className="flex items-center gap-2 w-full sm:w-auto"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                プレイリストを追加
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <MaterialFilterSelects filters={filterConfigs} />
              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-sm text-slate-600 whitespace-nowrap">
                  並び順:
                </label>
                <Select value={sortBy} onValueChange={(value: 'createdAt' | 'year') => setSortBy(value)}>
                  <SelectTrigger id="sort-select" className="w-[180px]">
                    <SelectValue placeholder="並び順を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">作成日時</SelectItem>
                    <SelectItem value="year">年度</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <PlaylistEditListView
              playlists={filteredPlaylists}
              getSubPlaylistCount={(playlistId: string) => subPlaylistCounts[playlistId] || 0}
              onPlaylistSelect={(playlist) => {
                setSelectedPlaylist(playlist);
                setEditMode('playlist');
              }}
            />
          </div>
        )}

        {editMode === 'playlist' && selectedPlaylist && (
          <PlaylistEditViewAsyncWrapper
            playlist={selectedPlaylist}
            onBack={() => setEditMode('list')}
            onSavePlaylist={handleSavePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onDeleteSubPlaylist={handleDeleteSubPlaylist}
            onDeleteVideo={handleDeleteVideo}
            onMoveSubPlaylist={handleMoveSubPlaylist}
            onSubPlaylistCreate={handleCreateSubPlaylist}
            formatDate={formatDate}
            onSubPlaylistClick={(subPlaylist) => {
              setSelectedSubPlaylist(subPlaylist);
              setEditMode('subPlaylist');
            }}
          />
        )}

        {editMode === 'subPlaylist' && selectedSubPlaylist && selectedPlaylist && (
          <SubPlaylistEditViewAsyncWrapper
            subPlaylist={selectedSubPlaylist}
            playlist={selectedPlaylist}
            onBack={() => setEditMode('playlist')}
            onDelete={handleDeleteSubPlaylist}
            onMove={handleMoveSubPlaylist}
            onVideoDelete={handleDeleteVideo}
            formatDate={formatDate}
            onSubPlaylistCreate={handleCreateSubPlaylist}
            onSubPlaylistUpdate={handleUpdateSubPlaylist}
          />
        )}
      </main>

      <CreatePlaylistDialog
        open={isPlaylistDialogOpen}
        onOpenChange={setIsPlaylistDialogOpen}
        playlistData={playlistFormData}
        setPlaylistData={setPlaylistFormData}
        onSubmit={handleCreatePlaylistSubmit}
      />
    </AppTemplate>
  );
}

