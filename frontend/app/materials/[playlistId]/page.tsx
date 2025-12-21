'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Search, Archive } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { MaterialSearchInput } from '@/features/materials/components/MaterialSearchInput';
import { MaterialFilterSelects } from '@/features/materials/components/MaterialFilterSelects';
import { usePlaylistDetailPage } from '@/features/materials/hooks/usePlaylistDetailPage';
import { VideoCard } from '@/features/materials/components/VideoCard';
import { PlaylistCard } from '@/features/materials/components/PlaylistCard';
import { EmptyState } from '@/features/materials/components/EmptyState';
import { Heart } from 'lucide-react';

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.playlistId as string;
  
  const {
    stageData,
    stagePlaylists,
    searchQuery,
    setSearchQuery,
    filteredSubPlaylists,
    filteredVideos,
    filteredPlaylists,
    isFavorite,
    handleToggleFavorite,
    filterConfigs,
    getFavoriteCount,
  } = usePlaylistDetailPage(playlistId);
  
  if (!stageData) {
    return (
      <AppTemplate
        title="能楽部資料庫"
        description="youtubeプレイリストのアーカイブ"
        icon={<Archive className="h-8 w-8 text-blue-600" />}
        developmentBadge={{
          level: 'alpha',
          text: '認証システム統合、UI改善',
        }}
        permissionBadge={{
          level: 'basic',
          text: '基本権限',
        }}
        maxWidth="7xl"
      >
        <div className="text-center py-16">
          <p className="text-slate-500 text-lg">舞台が見つかりませんでした</p>
          <Button onClick={() => router.push('/materials')} className="mt-4" variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            舞台一覧に戻る
          </Button>
        </div>
      </AppTemplate>
    );
  }

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

        {/* 検索結果表示 */}
        {searchQuery !== '' ? (
          // 検索結果をサブプレイリストと動画の2つのカテゴリに分けて表示
          <div className="space-y-8">
            {/* 検索結果の総数と詳細 */}
            <div className="mb-4">
              <p className="text-slate-600">
                {filteredSubPlaylists.length + filteredVideos.length}件の記録が見つかりました
                {(() => {
                  const details: string[] = [];
                  if (filteredSubPlaylists.length > 0) details.push(`サブプレイリスト: ${filteredSubPlaylists.length}件`);
                  if (filteredVideos.length > 0) details.push(`動画: ${filteredVideos.length}件`);
                  return details.length > 0 ? (
                    <span className="text-sm text-slate-500 ml-2">({details.join('、')})</span>
                  ) : null;
                })()}
              </p>
            </div>

            {/* サブプレイリスト検索結果 */}
            {filteredSubPlaylists.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  サブプレイリスト ({filteredSubPlaylists.length}件)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSubPlaylists.map((playlist) => (
                    <PlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      customDescription={`${stageData.year}年 ${stageData.stage} • ${playlist.phase} • YouTubeで視聴`}
                      onClick={() => router.push(`/materials/${playlistId}/${playlist.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 動画検索結果 */}
            {filteredVideos.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  動画 ({filteredVideos.length}件)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVideos.map((video) => {
                    const subPlaylist = filteredSubPlaylists.find(item => item.id === video.subPlaylistId) || 
                                      stagePlaylists.find(item => item.id === video.subPlaylistId);
                    if (!subPlaylist) return null;
                    
                    return (
                      <VideoCard
                        key={video.id}
                        video={video}
                        playlistTitle={stageData.title}
                        playlistYear={stageData.year}
                        playlistStage={stageData.stage}
                        subPlaylistPhase={subPlaylist.phase}
                        recordedDate={video.recordedDate}
                        showFavorite={true}
                        isFavorite={isFavorite(video.id)}
                        onToggleFavorite={(e) => handleToggleFavorite(video.id, e)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* 検索結果がない場合 */}
            {filteredSubPlaylists.length === 0 && filteredVideos.length === 0 && (
              <EmptyState message="該当する記録が見つかりませんでした" />
            )}
          </div>
        ) : (
          // 検索クエリがない場合は通常のサブプレイリスト一覧を表示
          <>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              サブプレイリスト一覧 ({filteredPlaylists.length}件)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlaylists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  customDescription={`${stageData.year}年 ${stageData.stage} • ${playlist.phase} • YouTubeで視聴`}
                  onClick={() => router.push(`/materials/${playlistId}/${playlist.id}`)}
                />
              ))}
            </div>
            {filteredPlaylists.length === 0 && (
              <EmptyState message="該当するプレイリストが見つかりませんでした" />
            )}
          </>
        )}
      </main>
    </AppTemplate>
  );
}