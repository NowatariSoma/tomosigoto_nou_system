'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Archive, Play } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Badge } from '@/components/ui/feedback/badge';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { MaterialFilterSelects } from '@/features/materials/components/MaterialFilterSelects';
import { MaterialSearchInput } from '@/features/materials/components/MaterialSearchInput';
import { FilterOption } from '@/shared/types/filter_types';
import { Playlist, Video } from '@/features/materials/types/material_types';
import { mockData } from '@/features/materials/data/material_data';
import { playlistVideos } from '@/features/materials/data/playlist_data';
import { videos } from '@/features/materials/data/video_data';


export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');

  // 日付フォーマット関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
      
      return matchesSearch && matchesYear && matchesStage && matchesPhase;
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
          <MaterialSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="舞台名・タイトル・演目名で検索..."
            className="h-12 text-lg"
            icon={<Search className="h-5 w-5 text-slate-400" />}
            iconPosition="left"
          />

          <MaterialFilterSelects filters={filterConfigs} />
        </div>

        <div className="mb-4">
          <p className="text-slate-600">
            {isVideoSearch ? filteredVideos.length : filteredData.length}件の記録が見つかりました
            {isVideoSearch && <span className="text-sm text-slate-500 ml-2">(動画検索結果)</span>}
          </p>
          {/* デバッグ用 */}
          {/* {isVideoSearch && (
            <p className="text-xs text-slate-400">
              デバッグ: 検索クエリ="{searchQuery}", 動画検索={isVideoSearch ? 'Yes' : 'No'}, 結果数={filteredVideos.length}
            </p>
          )} */}
        </div>

        {isVideoSearch ? (
          // 動画検索結果の表示
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video: Video) => {
              const subPlaylist = playlistVideos.find(item => item.id === video.subPlaylistId);
              const playlist = mockData.find(item => item.id === subPlaylist?.playlistId);
              if (!playlist || !subPlaylist) return null;
              
              return (
                <Card
                  key={video.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  onClick={() => window.open(video.videoUrl, '_blank')}
                >
                  <div className="relative h-48 overflow-hidden bg-slate-200">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{video.title}</span>
                      <span className="text-sm font-normal text-slate-500">{playlist.year}年</span>
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {playlist.year}年 {playlist.stage} • {formatDate(video.recordedDate)} • {subPlaylist.phase} • YouTubeで視聴
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        ) : (
          // プレイリスト検索結果の表示
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map((item: Playlist) => (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => router.push(`/materials/${item.id}`)}
              >
                <div className="relative h-48 overflow-hidden bg-slate-200">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{item.year}年 {item.stage}</span>
                    <span className="text-sm font-normal text-slate-500">{item.year}年</span>
                  </CardTitle>
                  <CardDescription>
                    {item.stage} - プレイリスト詳細を見る
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {(isVideoSearch ? filteredVideos.length === 0 : filteredData.length === 0) && (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">該当する記録が見つかりませんでした</p>
          </div>
        )}
      </main>
    </AppTemplate>
  );
}
