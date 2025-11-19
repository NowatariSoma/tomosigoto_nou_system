'use client';

import { useRouter } from 'next/navigation';
import { Search, Archive, Edit, Heart } from 'lucide-react';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { MaterialFilterSelects } from '@/features/materials/components/MaterialFilterSelects';
import { MaterialSearchInput } from '@/features/materials/components/MaterialSearchInput';
import { Playlist, Video } from '@/features/materials/types/material_types';
import { playlistVideos } from '@/features/materials/data/playlist_data';
import { mockData } from '@/features/materials/data/material_data';
import { Button } from '@/components/ui/forms/button';
import { VideoCard } from '@/features/materials/components/VideoCard';
import { PlaylistCard } from '@/features/materials/components/PlaylistCard';
import { FavoriteFilterToggle } from '@/features/materials/components/FavoriteFilterToggle';
import { SearchResultCount } from '@/features/materials/components/SearchResultCount';
import { EmptyState } from '@/features/materials/components/EmptyState';
import { useMaterialListPage } from '@/features/materials/hooks/useMaterialListPage';


export default function Home() {
  const router = useRouter();

  const {
    searchQuery,
    setSearchQuery,
    showFavoritesOnly,
    setShowFavoritesOnly,
    filterConfigs,
    isVideoSearch,
    filteredVideos,
    filteredData,
    getFavoriteCount,
    handleToggleFavorite,
    isFavorite,
  } = useMaterialListPage();

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
            {filteredData.map(item => (
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
