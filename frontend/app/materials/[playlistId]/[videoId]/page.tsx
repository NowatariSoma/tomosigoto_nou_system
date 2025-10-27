'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Search, Archive } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { MaterialSearchInput } from '@/features/materials/components/MaterialSearchInput';
import { FavoriteFilterToggle } from '@/features/materials/components/FavoriteFilterToggle';
import { EmptyState } from '@/features/materials/components/EmptyState';
import { VideoCard } from '@/features/materials/components/VideoCard';
import { useSubPlaylistPage } from '@/features/materials/hooks/useSubPlaylistPage';

export default function VideoListPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.playlistId as string;
  const videoId = params.videoId as string;

  const {
    stageData,
    playlistData,
    filteredVideos,
    searchQuery,
    setSearchQuery,
    showFavoritesOnly,
    setShowFavoritesOnly,
    isFavorite,
    handleToggleFavorite,
  } = useSubPlaylistPage(playlistId, videoId);
  if (!stageData || !playlistData) {
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
          <p className="text-slate-500 text-lg">プレイリストが見つかりませんでした</p>
          <div className="flex gap-2 justify-center mt-4">
            <Button onClick={() => router.push('/materials')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              舞台一覧に戻る
            </Button>
            <Button onClick={() => router.push(`/materials/${playlistId}`)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              プレイリスト一覧に戻る
            </Button>
          </div>
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
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => router.push('/materials')}
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              舞台一覧に戻る
            </Button>
            <Button
              onClick={() => router.push(`/materials/${playlistId}`)}
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              プレイリスト一覧に戻る
            </Button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{playlistData.title}</h1>
              <div className="flex items-center gap-4 text-slate-600">
                <span>{stageData.year}年</span>
                <span>•</span>
                <span>{stageData.stage}</span>
                <span>•</span>
                <span className="text-slate-600 font-medium">
                  {playlistData.phase}
                </span>
              </div>
            </div>
            <Button
              onClick={() => window.open(playlistData.playlistUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              YouTubeで開く
            </Button>
          </div>
        </div>

        {/* 検索フィールドとフィルタ */}
        <div className="mb-8 space-y-4">
          <MaterialSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="動画を検索... (演目名)"
            className="h-12 text-lg"
            icon={<Search className="h-5 w-5 text-slate-400" />}
            iconPosition="left"
          />
          
          <div className="flex items-center gap-4">
            <FavoriteFilterToggle
              showFavoritesOnly={showFavoritesOnly}
              onToggle={() => setShowFavoritesOnly(!showFavoritesOnly)}
            />
          </div>
        </div>

        {/* 動画一覧 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            動画一覧 ({filteredVideos.length}件)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                playlistTitle={stageData.title}
                playlistYear={stageData.year}
                playlistStage={stageData.stage}
                subPlaylistPhase={playlistData.phase}
                recordedDate={video.recordedDate}
                showFavorite={true}
                isFavorite={isFavorite(video.id)}
                onToggleFavorite={(e) => handleToggleFavorite(video.id, e)}
              />
            ))}
          </div>
        </div>

        {filteredVideos.length === 0 && (
          <EmptyState message="該当する動画が見つかりませんでした" />
        )}
      </main>
    </AppTemplate>
  );
}