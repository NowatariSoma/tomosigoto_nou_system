'use client';

import { useRouter } from 'next/navigation';
import { Search, Archive, Edit, Heart } from 'lucide-react';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { MaterialFilterSelects } from '@/features/materials/components/MaterialFilterSelects';
import { MaterialSearchInput } from '@/features/materials/components/MaterialSearchInput';
import { Playlist, Video, SubPlaylist } from '@/features/materials/types/material_types';
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
    filterConfigs,
    filteredPlaylists,
    filteredSubPlaylists,
    filteredVideos,
    filteredData,
    getFavoriteCount,
    handleToggleFavorite,
    isFavorite,
    playlists,
    subPlaylists,
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
          </div>
        </div>

        {searchQuery !== '' ? (
          // 検索結果を3つのカテゴリに分けて表示
          <div className="space-y-8">
            {/* 検索結果の総数と詳細 */}
            <div className="mb-4">
              <p className="text-slate-600">
                {filteredPlaylists.length + filteredSubPlaylists.length + filteredVideos.length}件の記録が見つかりました
                {(() => {
                  const details: string[] = [];
                  if (filteredPlaylists.length > 0) details.push(`プレイリスト: ${filteredPlaylists.length}件`);
                  if (filteredSubPlaylists.length > 0) details.push(`サブプレイリスト: ${filteredSubPlaylists.length}件`);
                  if (filteredVideos.length > 0) details.push(`動画: ${filteredVideos.length}件`);
                  return details.length > 0 ? (
                    <span className="text-sm text-slate-500 ml-2">({details.join('、')})</span>
                  ) : null;
                })()}
              </p>
            </div>

            {/* プレイリスト検索結果 */}
            {filteredPlaylists.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  プレイリスト ({filteredPlaylists.length}件)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPlaylists.map((item: Playlist) => (
                    <PlaylistCard
                      key={item.id}
                      playlist={item}
                      showYear={true}
                      onClick={() => router.push(`/materials/${item.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* サブプレイリスト検索結果 */}
            {filteredSubPlaylists.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  サブプレイリスト ({filteredSubPlaylists.length}件)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSubPlaylists.map((subPlaylist: SubPlaylist) => {
                    const playlist = playlists.find(p => p.id === subPlaylist.playlistId);
                    if (!playlist) return null;
                    
                    return (
                      <PlaylistCard
                        key={subPlaylist.id}
                        playlist={subPlaylist}
                        showYear={true}
                        showPhase={true}
                        customDescription={`${playlist.year}年 ${playlist.stage} • ${subPlaylist.phase} • YouTubeで視聴`}
                        onClick={() => router.push(`/materials/${subPlaylist.playlistId}/${subPlaylist.id}`)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* 動画検索結果 */}
            {filteredVideos.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  動画 ({filteredVideos.length}件)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVideos.map((video: Video) => {
                    const subPlaylist = subPlaylists.find(item => item.id === video.subPlaylistId);
                    if (!subPlaylist) return null;
                    
                    const playlist = playlists.find(item => item.id === subPlaylist.playlistId);
                    if (!playlist) return null;
                    
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
              </div>
            )}

            {/* 検索結果がない場合 */}
            {filteredPlaylists.length === 0 && filteredSubPlaylists.length === 0 && filteredVideos.length === 0 && (
              <EmptyState message="該当する記録が見つかりませんでした" />
            )}
          </div>
        ) : (
          // 検索クエリがない場合は通常のプレイリスト一覧を表示
          <>
            <SearchResultCount
              count={filteredData.length}
              isVideoSearch={false}
            />
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
            {filteredData.length === 0 && (
              <EmptyState message="該当する記録が見つかりませんでした" />
            )}
          </>
        )}
      </main>
    </AppTemplate>
  );
}
