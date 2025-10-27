'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Archive, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Playlist, SubPlaylist, Video } from '@/features/materials/types/material_types';
import { mockData } from '@/features/materials/data/material_data';
import { playlistVideos } from '@/features/materials/data/playlist_data';
import { videos } from '@/features/materials/data/video_data';
import { Badge } from '@/components/ui/feedback/badge';

type EditMode = 'list' | 'playlist' | 'subPlaylist' | null;

export default function EditMaterialPage() {
  const router = useRouter();
  const [editMode, setEditMode] = useState<EditMode>('list');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [selectedSubPlaylist, setSelectedSubPlaylist] = useState<SubPlaylist | null>(null);

  const handleDeletePlaylist = (playlistId: string) => {
    // TODO: API integration
    console.log('Deleting playlist:', playlistId);
    alert('プレイリストを削除しますか？\n（実際のAPI連携は未実装）');
  };

  const handleDeleteSubPlaylist = (subPlaylistId: string) => {
    // TODO: API integration
    console.log('Deleting sub-playlist:', subPlaylistId);
    alert('サブプレイリストを削除しますか？\n（実際のAPI連携は未実装）');
  };

  const handleDeleteVideo = (videoId: string) => {
    // TODO: API integration
    console.log('Deleting video:', videoId);
    alert('動画を削除しますか？\n（実際のAPI連携は未実装）');
  };

  const handleMoveSubPlaylist = (subPlaylistId: string) => {
    // TODO: API integration
    console.log('Moving sub-playlist:', subPlaylistId);
    alert('別のプレイリストに移動しますか？\n（実際のAPI連携は未実装）');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '日付未設定';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 表示するデータを取得
  const getSubPlaylistsForPlaylist = (playlistId: string) => {
    return playlistVideos.filter(sp => sp.playlistId === playlistId);
  };

  const getVideosForSubPlaylist = (subPlaylistId: string) => {
    return videos.filter(v => v.subPlaylistId === subPlaylistId);
  };

  // 特定のプレイリストの編集画面
  const PlaylistEditView = () => {
    if (!selectedPlaylist) return null;
    
    const subPlaylists = getSubPlaylistsForPlaylist(selectedPlaylist.id);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setEditMode('list')}
            className="flex items-center gap-2"
          >
            ← 戻る
          </Button>
          <h2 className="text-2xl font-bold text-slate-900">{selectedPlaylist.title}</h2>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>プレイリスト情報</CardTitle>
              <Button
                variant="destructive"
                onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                削除
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <span className="font-semibold">年度:</span> {selectedPlaylist.year}年
              </div>
              <div>
                <span className="font-semibold">舞台:</span> {selectedPlaylist.stage}
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-4">サブプレイリスト一覧</h3>
          <div className="space-y-4">
            {subPlaylists.map((subPlaylist) => {
              const videoCount = getVideosForSubPlaylist(subPlaylist.id).length;
              return (
                <Card key={subPlaylist.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{subPlaylist.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <Badge variant="secondary">{subPlaylist.phase}</Badge>
                          <span>•</span>
                          <span>{formatDate(subPlaylist.recordedDate)}</span>
                          <span>•</span>
                          <span>{videoCount}件の動画</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => handleMoveSubPlaylist(subPlaylist.id)}
                          className="flex items-center gap-2"
                        >
                          <ChevronRight className="h-4 w-4" />
                          移動
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteSubPlaylist(subPlaylist.id)}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          削除
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {getVideosForSubPlaylist(subPlaylist.id).slice(0, 4).map((video) => (
                        <Card key={video.id} className="relative">
                          <div className="aspect-video bg-slate-200 rounded-t">
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-full h-full object-cover rounded-t"
                            />
                          </div>
                          <CardContent className="p-3">
                            <p className="text-sm font-medium line-clamp-2">{video.title}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVideo(video.id)}
                              className="mt-2 w-full flex items-center gap-1 text-xs"
                            >
                              <Trash2 className="h-3 w-3" />
                              削除
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                      {getVideosForSubPlaylist(subPlaylist.id).length > 4 && (
                        <Card className="flex items-center justify-center">
                          <CardContent className="p-3">
                            <p className="text-sm text-slate-500">
                              +{getVideosForSubPlaylist(subPlaylist.id).length - 4}件
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // サブプレイリストの詳細編集画面
  const SubPlaylistEditView = () => {
    if (!selectedSubPlaylist) return null;
    
    const playlist = mockData.find(p => p.id === selectedSubPlaylist.playlistId);
    const videoList = getVideosForSubPlaylist(selectedSubPlaylist.id);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setEditMode('playlist')}
            className="flex items-center gap-2"
          >
            ← 戻る
          </Button>
          <h2 className="text-2xl font-bold text-slate-900">{selectedSubPlaylist.title}</h2>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>サブプレイリスト情報</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleMoveSubPlaylist(selectedSubPlaylist.id)}
                  className="flex items-center gap-2"
                >
                  <ChevronRight className="h-4 w-4" />
                  移動
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteSubPlaylist(selectedSubPlaylist.id)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  削除
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <span className="font-semibold">親プレイリスト:</span> {playlist?.title}
              </div>
              <div>
                <span className="font-semibold">フェーズ:</span> <Badge>{selectedSubPlaylist.phase}</Badge>
              </div>
              <div>
                <span className="font-semibold">録画日:</span> {formatDate(selectedSubPlaylist.recordedDate)}
              </div>
              <div>
                <span className="font-semibold">動画数:</span> {videoList.length}件
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-4">動画一覧</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videoList.map((video) => (
              <Card key={video.id}>
                <div className="aspect-video bg-slate-200 rounded-t">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover rounded-t"
                  />
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium line-clamp-2 mb-2">{video.title}</p>
                  <p className="text-xs text-slate-500 mb-3">{formatDate(video.recordedDate)}</p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteVideo(video.id)}
                    className="w-full flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    削除
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppTemplate
      title="能楽部資料庫"
      description="材料の編集"
      icon={<Archive className="h-8 w-8 text-blue-600" />}
      maxWidth="7xl"
    >
      <main className="container mx-auto px-4 py-8">
        {editMode === 'list' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-slate-900">材料を編集</h1>
              <Button variant="outline" onClick={() => router.push('/materials')}>
                戻る
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockData.map((playlist) => {
                const subPlaylistCount = getSubPlaylistsForPlaylist(playlist.id).length;
                return (
                  <Card
                    key={playlist.id}
                    className="cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => {
                      setSelectedPlaylist(playlist);
                      setEditMode('playlist');
                    }}
                  >
                    <div className="relative h-48 overflow-hidden bg-slate-200">
                      <img
                        src={playlist.thumbnailUrl}
                        alt={playlist.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{playlist.year}年 {playlist.stage}</span>
                        <span className="text-sm font-normal text-slate-500">{playlist.year}年</span>
                      </CardTitle>
                      <CardDescription>
                        {subPlaylistCount}件のサブプレイリスト
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {editMode === 'playlist' && <PlaylistEditView />}
        {editMode === 'subPlaylist' && <SubPlaylistEditView />}
      </main>
    </AppTemplate>
  );
}

