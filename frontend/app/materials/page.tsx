'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Archive, Plus, Edit, Heart } from 'lucide-react';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { MaterialFilterSelects } from '@/features/materials/components/MaterialFilterSelects';
import { MaterialSearchInput } from '@/features/materials/components/MaterialSearchInput';
import { FilterOption } from '@/shared/types/filter_types';
import { Playlist, Video } from '@/features/materials/types/material_types';
import { mockData } from '@/features/materials/data/material_data';
import { playlistVideos } from '@/features/materials/data/playlist_data';
import { videos } from '@/features/materials/data/video_data';
import { Button } from '@/components/ui/forms/button';
import { useFavoriteVideos } from '@/features/materials/hooks/useFavoriteVideos';
import { SubPlaylist } from '@/features/materials/types/material_types';
import { VideoCard } from '@/features/materials/components/VideoCard';
import { PlaylistCard } from '@/features/materials/components/PlaylistCard';
import { FavoriteFilterToggle } from '@/features/materials/components/FavoriteFilterToggle';
import { SearchResultCount } from '@/features/materials/components/SearchResultCount';
import { EmptyState } from '@/features/materials/components/EmptyState';


export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { isFavorite, toggleFavorite, getFavoriteCount } = useFavoriteVideos();

  // お気に入り切り替え
  const handleToggleFavorite = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(videoId);
  };


  const years = Array.from(new Set(mockData.map((item: Playlist) => item.year))).sort((a: number, b: number) => b - a);
  const stages = Array.from(new Set(mockData.map((item: Playlist) => item.stage))).sort();

  // フィルター設定の定義
  const yearOptions: FilterOption[] = [
    { value: 'all', label: 'すべての年度' },
    ...years.map((year: number) => ({ value: year.toString(), label: `${year}年` }))
  ];

  const stageOptions: FilterOption[] = [
    { value: 'all', label: 'すべての舞台' },
    ...stages.map((stage: string) => ({ value: stage, label: stage }))
  ];

  const phaseOptions: FilterOption[] = [
    { value: 'all', label: 'すべてのフェーズ' },
    { value: '稽古', label: '稽古' },
    { value: '本番', label: '本番' }
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
    },
    {      
      id: 'phase',
      placeholder: 'フェーズを選択',
      options: phaseOptions,
      value: selectedPhase,
      onValueChange: setSelectedPhase
    }
  ];

  // 検索クエリが演目名を含むかチェック
  const isVideoSearch = searchQuery !== '' && (
    videos.some(video => 
      video.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) && !mockData.some(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.stage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // デバッグ用ログ
  console.log('Search Query:', searchQuery);
  console.log('Is Video Search:', isVideoSearch);

  // 動画検索の場合
  let filteredVideos: Video[] = [];
  if (isVideoSearch) {
    filteredVideos = videos.filter((video: Video) => {
      // subPlaylistIdでプレイリストを検索
      const subPlaylist = playlistVideos.find(item => item.id === video.subPlaylistId);
      if (!subPlaylist) return false;
      
      const playlist = mockData.find(item => item.id === subPlaylist.playlistId);
      if (!playlist) return false;
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = video.title.toLowerCase().includes(searchLower) ||
        subPlaylist.title.toLowerCase().includes(searchLower) ||
        playlist.title.toLowerCase().includes(searchLower) ||
        playlist.stage.toLowerCase().includes(searchLower);
      const matchesYear = selectedYear === 'all' || playlist.year.toString() === selectedYear;
      const matchesStage = selectedStage === 'all' || playlist.stage === selectedStage;
      const matchesPhase = selectedPhase === 'all' || subPlaylist.phase === selectedPhase;
      const matchesFavorite = !showFavoritesOnly || isFavorite(video.id);
      
      return matchesSearch && matchesYear && matchesStage && matchesPhase && matchesFavorite;
    });
    
    // デバッグ用ログ
    console.log('Filtered Videos:', filteredVideos.length);
    console.log('Sample Video:', filteredVideos[0]);
  }

  // プレイリスト検索の場合
  const filteredData = mockData.filter((item: Playlist) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchLower) || 
      (item.stage && item.stage.toLowerCase().includes(searchLower));
    const matchesYear = selectedYear === 'all' || item.year.toString() === selectedYear;
    const matchesStage = selectedStage === 'all' || (item.stage && item.stage === selectedStage);
    const matchesPhase = selectedPhase === 'all' || true; // プレイリスト検索ではフェーズフィルターは無視
    return matchesSearch && matchesYear && matchesStage && matchesPhase;
  });

  return (
    <AppTemplate
      title="能楽部資料庫"
      description="youtubeプレイリストのアーカイブ"
      icon={<Archive className="h-8 w-8 text-blue-600" />}
      developmentBadge={{
        level: 'alpha',
        text: '認証システム統合、UI改善'
      }}
      permissionBadge={{
        level: 'basic',
        text: '基本権限'
      }}
      maxWidth="7xl"
    >

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">youtubeプレイリスト</h1>
              <div className="flex items-center gap-4 text-slate-600">
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push('/materials/new')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                新しく追加
              </Button>
              <Button
                onClick={() => router.push('/materials/edit')}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                編集
              </Button>
            </div>
          </div>
          <MaterialSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="舞台名・タイトル・演目名で検索..."
            className="h-12 text-lg"
            icon={<Search className="h-5 w-5 text-slate-400" />}
            iconPosition="left"
          />

          <div className="flex items-center gap-4 flex-wrap">
            <MaterialFilterSelects filters={filterConfigs} />
            
            <Button
              onClick={() => router.push('/materials/favorites')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Heart className="h-4 w-4" />
              お気に入り ({getFavoriteCount()})
            </Button>
            
            {isVideoSearch && (
              <FavoriteFilterToggle
                showFavoritesOnly={showFavoritesOnly}
                onToggle={() => setShowFavoritesOnly(!showFavoritesOnly)}
              />
            )}
          </div>
        </div>

        <SearchResultCount
          count={isVideoSearch ? filteredVideos.length : filteredData.length}
          isVideoSearch={isVideoSearch}
        />

        {isVideoSearch ? (
          // 動画検索結果の表示
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video: Video) => {
              const subPlaylist = playlistVideos.find(item => item.id === video.subPlaylistId);
              const playlist = mockData.find(item => item.id === subPlaylist?.playlistId);
              if (!playlist || !subPlaylist) return null;
              
              const isFavoriteVideo = isFavorite(video.id);
              
              return (
                <VideoCard
                  key={video.id}
                  video={video}
                  playlistTitle={playlist.title}
                  playlistYear={playlist.year}
                  playlistStage={playlist.stage}
                  subPlaylistPhase={subPlaylist.phase}
                  recordedDate={video.recordedDate}
                  showFavorite={true}
                  isFavorite={isFavoriteVideo}
                  onToggleFavorite={(e) => handleToggleFavorite(video.id, e)}
                />
              );
            })}
          </div>
        ) : (
          // プレイリスト検索結果の表示
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map((item: Playlist) => (
              <PlaylistCard
                key={item.id}
                playlist={item}
                showYear={true}
                onClick={() => router.push(`/materials/${item.id}`)}
              />
            ))}
          </div>
        )}

        {(isVideoSearch ? filteredVideos.length === 0 : filteredData.length === 0) && (
          <EmptyState message="該当する記録が見つかりませんでした" />
        )}
      </main>
    </AppTemplate>
  );
}
