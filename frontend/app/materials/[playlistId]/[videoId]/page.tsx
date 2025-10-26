'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ExternalLink, Play, Search, Archive } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Playlist, SubPlaylist, Video } from '@/features/materials/types/material_types';
import { mockData } from '@/features/materials/data/material_data';
import { playlistVideos } from '@/features/materials/data/playlist_data';
import { videos } from '@/features/materials/data/video_data';
import { MaterialSearchInput } from '@/features/materials/components/MaterialSearchInput';
import { MaterialFilterSelects } from '@/features/materials/components/MaterialFilterSelects';
import { FilterOption } from '@/shared/types/filter_types';

export default function VideoListPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.playlistId as string;
  const videoId = params.videoId as string;
  const [searchQuery, setSearchQuery] = useState('');
  
  // 年度+舞台データを取得
  const stageData = mockData.find((item: Playlist) => item.id === playlistId);
  
  // プレイリストデータを取得（videoIdは実際にはプレイリストID）
  const playlistData = playlistVideos.find((playlist: SubPlaylist) => 
    playlist.id === videoId
  );
  
  // そのプレイリストの動画一覧を取得
  const playlistVideosList = videos.filter((video: Video) => 
    video.subPlaylistId === videoId
  );
  
  console.log('Debug info:', {
    playlistId,
    videoId,
    stageData,
    playlistData,
    playlistVideosList: playlistVideosList.length
  });
  
  if (!stageData || !playlistData) {
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
          <p className="text-slate-500 text-lg">プレイリストが見つかりませんでした</p>
          <div className="flex gap-2 justify-center mt-4">
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
        </div>
      </AppTemplate>
    );
  }

  // 検索でフィルタリング
  const filteredVideos = playlistVideosList.filter((video: Video) => {
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

        {/* 検索フィールド */}
        <div className="mb-8 space-y-4">
          <MaterialSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="動画を検索... (演目名)"
            className="h-12 text-lg"
            icon={<Search className="h-5 w-5 text-slate-400" />}
            iconPosition="left"
          />
        </div>

        {/* 動画一覧 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            動画一覧 ({filteredVideos.length}件)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((video) => (
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
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm line-clamp-2">{video.title}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {stageData?.year}年 {stageData?.stage} • {formatDate(video.recordedDate)} • {playlistData.phase} • YouTubeで視聴
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">該当する動画が見つかりませんでした</p>
          </div>
        )}
      </main>
    </AppTemplate>
  );
}