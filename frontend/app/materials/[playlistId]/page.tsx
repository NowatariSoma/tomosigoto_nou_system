'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ExternalLink, Search, Archive } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Playlist, SubPlaylist, Video } from '@/features/materials/types/material_types';
import { mockData } from '@/features/materials/data/material_data';
import { playlistVideos } from '@/features/materials/data/playlist_data';
import { videos } from '@/features/materials/data/video_data';
import { MaterialSearchInput } from '@/features/materials/components/MaterialSearchInput';
import { MaterialFilterSelects } from '@/features/materials/components/MaterialFilterSelects';
import { FilterOption } from '@/shared/types/filter_types';
import { useFavoriteVideos } from '@/features/materials/hooks/useFavoriteVideos';
import { VideoCard } from '@/features/materials/components/VideoCard';
import { PlaylistCard } from '@/features/materials/components/PlaylistCard';
import { FavoriteFilterToggle } from '@/features/materials/components/FavoriteFilterToggle';
import { EmptyState } from '@/features/materials/components/EmptyState';

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.playlistId as string;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { isFavorite, toggleFavorite } = useFavoriteVideos();
  
  // フェーズオプションの定義
  const phaseOptions: FilterOption[] = [
    { value: 'all', label: 'すべてのフェーズ' },
    { value: '稽古', label: '稽古' },
    { value: '本番', label: '本番' }
  ];
  
  // 年度+舞台データを取得
  const stageData = mockData.find((item: Playlist) => item.id === playlistId);
  
  // その年度+舞台のプレイリスト一覧を取得
  const stagePlaylists = playlistVideos.filter((playlist: SubPlaylist) => 
    playlist.playlistId === stageData?.id
  );
  
  if (!stageData) {
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
        <div className="text-center py-16">
          <p className="text-slate-500 text-lg">舞台が見つかりませんでした</p>
          <Button 
            onClick={() => router.push('/materials')}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            舞台一覧に戻る
          </Button>
        </div>
      </AppTemplate>
    );
  }

  // 検索クエリが演目名を含むかチェック
  const isVideoSearch = searchQuery !== '' && (
    videos.some(video => 
      video.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) && !stagePlaylists.some(playlist => 
    playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playlist.phase.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 動画検索の場合
  let filteredVideos: Video[] = [];
  if (isVideoSearch) {
    filteredVideos = videos.filter((video: Video) => {
      // 現在の年度+舞台の動画のみを対象
      const subPlaylist = playlistVideos.find(item => item.id === video.subPlaylistId);
      if (!subPlaylist || subPlaylist.playlistId !== playlistId) return false;
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = video.title.toLowerCase().includes(searchLower) ||
        subPlaylist.title.toLowerCase().includes(searchLower) ||
        stageData?.title.toLowerCase().includes(searchLower) ||
        stageData?.stage.toLowerCase().includes(searchLower);
      const matchesPhase = selectedPhase === 'all' || subPlaylist.phase === selectedPhase;
      const matchesFavorite = !showFavoritesOnly || isFavorite(video.id);
      
      return matchesSearch && matchesPhase && matchesFavorite;
    });
  }

  // プレイリスト検索の場合
  const filteredPlaylists = stagePlaylists.filter((playlist: SubPlaylist) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      playlist.title.toLowerCase().includes(searchLower) ||
      playlist.phase.toLowerCase().includes(searchLower);
    const matchesPhase = selectedPhase === 'all' || playlist.phase === selectedPhase;

    return matchesSearch && matchesPhase;
  });

  // お気に入り切り替え
  const handleToggleFavorite = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(videoId);
  };

  // フィルター設定の定義
  const filterConfigs = [
    {
      id: 'phase',
      placeholder: 'フェーズを選択',
      options: phaseOptions,
      value: selectedPhase,
      onValueChange: setSelectedPhase
    }
  ];

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
        {/* ヘッダー部分 */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/materials')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            舞台一覧に戻る
          </Button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{stageData?.title}</h1>
              <div className="flex items-center gap-4 text-slate-600">
                <span>{stageData?.year}年</span>
                <span>•</span>
                <span>{stageData?.stage}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 検索フィールドとフィルター */}
        <div className="mb-8 space-y-4">
          <MaterialSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="プレイリスト・演目名で検索..."
            className="h-12 text-lg"
            icon={<Search className="h-5 w-5 text-slate-400" />}
            iconPosition="left"
          />

          <div className="flex items-center gap-4 flex-wrap">
            <MaterialFilterSelects filters={filterConfigs} />
            <FavoriteFilterToggle
              showFavoritesOnly={showFavoritesOnly}
              onToggle={() => setShowFavoritesOnly(!showFavoritesOnly)}
            />
          </div>
        </div>

        {/* 検索結果表示 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            {isVideoSearch ? `動画一覧 (${filteredVideos.length}件)` : `プレイリスト一覧 (${filteredPlaylists.length}件)`}
            {isVideoSearch && <span className="text-sm text-slate-500 ml-2">(動画検索結果)</span>}
          </h2>

          {isVideoSearch ? (
            // 動画検索結果の表示
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVideos.map((video) => {
                const subPlaylist = playlistVideos.find(item => item.id === video.subPlaylistId);
                if (!subPlaylist) return null;
                const isFavoriteVideo = isFavorite(video.id);
                
                return (
                  <VideoCard
                    key={video.id}
                    video={video}
                    playlistTitle={stageData?.title || ''}
                    playlistYear={stageData?.year || 0}
                    playlistStage={stageData?.stage || ''}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlaylists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  customDescription={`${stageData?.year}年 ${stageData?.stage} • ${playlist.phase} • YouTubeで視聴`}
                  onClick={() => router.push(`/materials/${playlistId}/${playlist.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {(isVideoSearch ? filteredVideos.length === 0 : filteredPlaylists.length === 0) && (
          <EmptyState
            message={isVideoSearch ? '該当する動画が見つかりませんでした' : '該当するプレイリストが見つかりませんでした'}
          />
        )}
      </main>
    </AppTemplate>
  );
}