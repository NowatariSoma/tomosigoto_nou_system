'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Play, Heart, Archive } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Video } from '@/features/materials/types/material_types';
import { videos } from '@/features/materials/data/video_data';
import { playlistVideos } from '@/features/materials/data/playlist_data';
import { mockData } from '@/features/materials/data/material_data';
import { Playlist, SubPlaylist } from '@/features/materials/types/material_types';
import { useFavoriteVideos } from '@/features/materials/hooks/useFavoriteVideos';
import { MaterialSearchInput } from '@/features/materials/components/MaterialSearchInput';
import { Search } from 'lucide-react';

export default function FavoritesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { favorites, isFavorite, toggleFavorite } = useFavoriteVideos();

  // お気に入りの動画を取得
  const favoriteVideoIds = Array.from(favorites);
  const favoriteVideosList = videos.filter((video: Video) => 
    favoriteVideoIds.includes(video.id)
  );

  // 検索でフィルタリング
  const filteredVideos = favoriteVideosList.filter((video: Video) => {
    const searchLower = searchQuery.toLowerCase();
    return searchQuery === '' ||
      video.title.toLowerCase().includes(searchLower);
  });

  // 日付フォーマット関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 各動画の親情報を取得
  const getVideoMetadata = (video: Video) => {
    const subPlaylist = playlistVideos.find((item: SubPlaylist) => item.id === video.subPlaylistId);
    const stageData = mockData.find((item: Playlist) => item.id === subPlaylist?.playlistId);
    return { subPlaylist, stageData };
  };

  // お気に入り切り替え（イベントハンドラー）
  const handleToggleFavorite = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(videoId);
  };

  return (
    <AppTemplate
      title="能楽部資料庫"
      description="お気に入り動画一覧"
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

          <div className="mb-4">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">お気に入り動画</h1>
            <div className="text-slate-600">
              {favoriteVideosList.length}件のお気に入り動画
            </div>
          </div>
        </div>

        {/* 検索フィールド */}
        <div className="mb-8">
          <MaterialSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="お気に入り動画を検索..."
            className="h-12 text-lg"
            icon={<Search className="h-5 w-5 text-slate-400" />}
            iconPosition="left"
          />
        </div>

        {/* 動画一覧 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            検索結果 ({filteredVideos.length}件)
          </h2>

          {filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVideos.map((video) => {
                const { subPlaylist, stageData } = getVideoMetadata(video);
                if (!subPlaylist || !stageData) return null;

                return (
                  <Card
                    key={video.id}
                    className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    onClick={() => window.open(video.videoUrl, '_blank')}
                  >
                    <div className="relative h-32 overflow-hidden bg-slate-200">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      {/* お気に入りボタン */}
                      <button
                        onClick={(e) => handleToggleFavorite(video.id, e)}
                        className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white transition-all duration-200 z-10"
                        aria-label="お気に入りから削除"
                      >
                        <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                      </button>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm line-clamp-2">{video.title}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">
                        {stageData?.year}年 {stageData?.stage} • {video.recordedDate ? formatDate(video.recordedDate) : '日付不明'} • {subPlaylist.phase}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          ) : favoriteVideosList.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg mb-2">お気に入り動画がありません</p>
              <p className="text-slate-400 text-sm">動画のハートアイコンをクリックしてお気に入りに追加してください</p>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-slate-500 text-lg">該当するお気に入り動画が見つかりませんでした</p>
            </div>
          )}
        </div>
      </main>
    </AppTemplate>
  );
}

