'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Heart, Archive } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Video, Playlist, SubPlaylist, FavoriteVideoDetail } from '@/features/materials/types/material_types';
import { useFavoriteVideos } from '@/features/materials/hooks/useFavoriteVideos';
import { materialsService } from '@/features/materials/services/materials-service';
import { MaterialSearchInput } from '@/features/materials/components/MaterialSearchInput';
import { Search } from 'lucide-react';

export default function FavoritesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { favorites, isFavorite, toggleFavorite, isLoading: favoritesLoading } = useFavoriteVideos();
  const [favoriteVideosDetails, setFavoriteVideosDetails] = useState<FavoriteVideoDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // お気に入り動画とその関連データを取得
  useEffect(() => {
    const loadFavoriteVideos = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // バックエンドからお気に入り動画とその関連情報を取得
        const favoriteVideosDetails = await materialsService.getFavoriteVideosWithDetails();
        setFavoriteVideosDetails(favoriteVideosDetails);
      } catch (err) {
        console.error('Failed to load favorite videos:', err);
        setError(err instanceof Error ? err.message : 'データの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (!favoritesLoading) {
      loadFavoriteVideos();
    }
  }, [favoritesLoading, favorites.size]);

  // 検索でフィルタリング
  const filteredFavoriteVideosDetails = favoriteVideosDetails.filter((detail: FavoriteVideoDetail) => {
    const searchLower = searchQuery.toLowerCase();
    return searchQuery === '' ||
      detail.video.title.toLowerCase().includes(searchLower);
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

  // お気に入り切り替え（イベントハンドラー）
  const handleToggleFavorite = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleFavorite(videoId);
      // お気に入りから削除された場合は、リストからも削除
      setFavoriteVideosDetails(prev => prev.filter(detail => detail.video.id !== videoId));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
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
              {isLoading ? '読み込み中...' : `${favoriteVideosDetails.length}件のお気に入り動画`}
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

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
            検索結果 ({filteredFavoriteVideosDetails.length}件)
          </h2>

          {isLoading ? (
            <div className="text-center py-16">
              <p className="text-slate-500 text-lg">読み込み中...</p>
            </div>
          ) : filteredFavoriteVideosDetails.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFavoriteVideosDetails.map((detail) => {
                const { video, subPlaylist, playlist } = detail;

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
                        {playlist.year}年 {playlist.stage} • {video.recordedDate ? formatDate(video.recordedDate) : '日付不明'} • {subPlaylist.phase}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          ) : favoriteVideosDetails.length === 0 ? (
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


