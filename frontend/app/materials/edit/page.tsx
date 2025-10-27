'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Playlist, SubPlaylist, Video } from '@/features/materials/types/material_types';
import { mockData } from '@/features/materials/data/material_data';
import { MaterialFilterSelects } from '@/features/materials/components/MaterialFilterSelects';
import { FilterOption } from '@/shared/types/filter_types';
import { PlaylistEditView } from '@/features/materials/components/PlaylistEditView';
import { SubPlaylistEditView } from '@/features/materials/components/SubPlaylistEditView';
import { PlaylistEditListView } from '@/features/materials/components/PlaylistEditListView';

type EditMode = 'list' | 'playlist' | 'subPlaylist' | null;

export default function EditMaterialPage() {
  const router = useRouter();
  const [editMode, setEditMode] = useState<EditMode>('list');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [selectedSubPlaylist, setSelectedSubPlaylist] = useState<SubPlaylist | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  const handleSavePlaylist = (data: { title: string; year: number; stage: string }) => {
    // TODO: API integration
    console.log('Saving playlist:', {
      id: selectedPlaylist?.id,
      ...data,
    });
    alert('プレイリスト情報を保存しました\n（実際のAPI連携は未実装）');
  };

  const handleDeletePlaylist = (playlistId: string) => {
    if (confirm('本当にこのプレイリストを削除しますか？\nこの操作は取り消せません。')) {
      // TODO: API integration
      console.log('Deleting playlist:', playlistId);
      alert('プレイリストを削除しました\n（実際のAPI連携は未実装）');
      setEditMode('list');
      setSelectedPlaylist(null);
    }
  };

  const handleDeleteSubPlaylist = (subPlaylistId: string) => {
    if (confirm('本当にこのサブプレイリストを削除しますか？\nこの操作は取り消せません。')) {
      // TODO: API integration
      console.log('Deleting sub-playlist:', subPlaylistId);
      alert('サブプレイリストを削除しました\n（実際のAPI連携は未実装）');
    }
  };

  const handleDeleteVideo = (videoId: string) => {
    if (confirm('本当にこの動画を削除しますか？\nこの操作は取り消せません。')) {
      // TODO: API integration
      console.log('Deleting video:', videoId);
      alert('動画を削除しました\n（実際のAPI連携は未実装）');
    }
  };

  const handleMoveSubPlaylist = (subPlaylistId: string) => {
    // TODO: API integration
    console.log('Moving sub-playlist:', subPlaylistId);
    alert('別のプレイリストに移動しますか？\n（実際のAPI連携は未実装）');
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

  // 表示するデータを取得
  const getSubPlaylistsForPlaylist = (playlistId: string) => {
    // TODO: APIから実際のデータを取得
    const { playlistVideos } = require('@/features/materials/data/playlist_data');
    return playlistVideos.filter((sp: SubPlaylist) => sp.playlistId === playlistId);
  };

  const getVideosForSubPlaylist = (subPlaylistId: string) => {
    // TODO: APIから実際のデータを取得
    const { videos } = require('@/features/materials/data/video_data');
    return videos.filter((v: Video) => v.subPlaylistId === subPlaylistId);
  };

  // フィルター設定
  const years = Array.from(new Set(mockData.map((item: Playlist) => item.year))).sort((a: number, b: number) => b - a);
  const stages = Array.from(new Set(mockData.map((item: Playlist) => item.stage))).sort();

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
  const filteredPlaylists = mockData.filter((playlist) => {
    const matchesYear = selectedYear === 'all' || playlist.year.toString() === selectedYear;
    const matchesStage = selectedStage === 'all' || playlist.stage === selectedStage;
    return matchesYear && matchesStage;
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
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="outline"
                onClick={() => router.push('/materials')}
                className="flex items-center gap-2"
              >
                ← 戻る
              </Button>
              <h1 className="text-3xl font-bold text-slate-900">プレイリストを編集</h1>
            </div>

            <MaterialFilterSelects filters={filterConfigs} />

            <PlaylistEditListView
              playlists={filteredPlaylists}
              getSubPlaylistCount={(playlistId: string) => getSubPlaylistsForPlaylist(playlistId).length}
              onPlaylistSelect={(playlist) => {
                setSelectedPlaylist(playlist);
                setEditMode('playlist');
              }}
            />
          </div>
        )}

        {editMode === 'playlist' && selectedPlaylist && (
          <PlaylistEditView
            playlist={selectedPlaylist}
            subPlaylists={getSubPlaylistsForPlaylist(selectedPlaylist.id)}
            getVideosForSubPlaylist={getVideosForSubPlaylist}
            onBack={() => setEditMode('list')}
            onSavePlaylist={handleSavePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onDeleteSubPlaylist={handleDeleteSubPlaylist}
            onDeleteVideo={handleDeleteVideo}
            onMoveSubPlaylist={handleMoveSubPlaylist}
            formatDate={formatDate}
          />
        )}

        {editMode === 'subPlaylist' && selectedSubPlaylist && (
          <SubPlaylistEditView
            subPlaylist={selectedSubPlaylist}
            playlist={mockData.find(p => p.id === selectedSubPlaylist.playlistId)}
            videos={getVideosForSubPlaylist(selectedSubPlaylist.id)}
            onBack={() => setEditMode('playlist')}
            onDelete={handleDeleteSubPlaylist}
            onMove={handleMoveSubPlaylist}
            onVideoDelete={handleDeleteVideo}
            formatDate={formatDate}
          />
        )}
      </main>
    </AppTemplate>
  );
}

