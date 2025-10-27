'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Archive } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Textarea } from '@/components/ui/inputs/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';
import { AppTemplate } from '@/shared/components/layout/AppTemplate';

type FormType = 'playlist' | 'subPlaylist' | 'video' | null;

export default function NewMaterialPage() {
  const router = useRouter();
  const [formType, setFormType] = useState<FormType>(null);
  const [playlistData, setPlaylistData] = useState({
    title: '',
    year: '',
    stage: '',
    thumbnailUrl: '',
  });
  const [subPlaylistData, setSubPlaylistData] = useState({
    title: '',
    recordedDate: '',
    phase: '',
    playlistUrl: '',
    thumbnailUrl: '',
  });
  const [videoData, setVideoData] = useState({
    title: '',
    videoUrl: '',
    recordedDate: '',
    thumbnailUrl: '',
  });

  const handlePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API integration
    console.log('Creating playlist:', playlistData);
    router.push('/materials');
  };

  const handleSubPlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API integration
    console.log('Creating sub-playlist:', subPlaylistData);
    router.push('/materials');
  };

  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API integration
    console.log('Creating video:', videoData);
    router.push('/materials');
  };

  const handleCancel = () => {
    if (formType) {
      // フォームタイプをリセットしてカード選択画面に戻る
      setFormType(null);
    } else {
      // カード選択画面からは材料一覧に戻る
      router.push('/materials');
    }
  };

  return (
    <AppTemplate
      title="能楽部資料庫"
      description="新しい資料を追加"
      icon={<Archive className="h-8 w-8 text-blue-600" />}
      maxWidth="7xl"
    >
      <main className="container mx-auto px-4 py-8">
        {!formType ? (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">新しく追加</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setFormType('playlist')}
              >
                <CardHeader>
                  <CardTitle>新しいプレイリスト</CardTitle>
                  <CardDescription>
                    年度と舞台の組み合わせで新しいプレイリストを作成します
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <Plus className="h-16 w-16 text-slate-400" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setFormType('subPlaylist')}
              >
                <CardHeader>
                  <CardTitle>本番・稽古プレイリスト</CardTitle>
                  <CardDescription>
                    本番または稽古のプレイリストを追加します
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <Plus className="h-16 w-16 text-slate-400" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setFormType('video')}
              >
                <CardHeader>
                  <CardTitle>新規動画</CardTitle>
                  <CardDescription>
                    個別の動画を追加します
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <Plus className="h-16 w-16 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 flex justify-end">
              <Button variant="outline" onClick={handleCancel}>
                キャンセル
              </Button>
            </div>
          </div>
        ) : formType === 'playlist' ? (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">新しいプレイリストを追加</h1>
            <Card>
              <CardHeader>
                <CardTitle>プレイリスト情報</CardTitle>
                <CardDescription>年度と舞台の情報を入力してください</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePlaylistSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">タイトル</Label>
                    <Input
                      id="title"
                      value={playlistData.title}
                      onChange={(e) => setPlaylistData({ ...playlistData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">年度</Label>
                    <Input
                      id="year"
                      type="number"
                      value={playlistData.year}
                      onChange={(e) => setPlaylistData({ ...playlistData, year: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stage">舞台</Label>
                    <Input
                      id="stage"
                      value={playlistData.stage}
                      onChange={(e) => setPlaylistData({ ...playlistData, stage: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thumbnailUrl">サムネイルURL</Label>
                    <Input
                      id="thumbnailUrl"
                      type="url"
                      value={playlistData.thumbnailUrl}
                      onChange={(e) => setPlaylistData({ ...playlistData, thumbnailUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      キャンセル
                    </Button>
                    <Button type="submit">
                      作成
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : formType === 'subPlaylist' ? (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">本番・稽古プレイリストを追加</h1>
            <Card>
              <CardHeader>
                <CardTitle>プレイリスト情報</CardTitle>
                <CardDescription>本番または稽古のプレイリスト情報を入力してください</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubPlaylistSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="subTitle">タイトル</Label>
                    <Input
                      id="subTitle"
                      value={subPlaylistData.title}
                      onChange={(e) => setSubPlaylistData({ ...subPlaylistData, title: e.target.value })}
                      placeholder="例: 2025年1月20日 - 本番"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recordedDate">録画日</Label>
                    <Input
                      id="recordedDate"
                      type="date"
                      value={subPlaylistData.recordedDate}
                      onChange={(e) => setSubPlaylistData({ ...subPlaylistData, recordedDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phase">フェーズ</Label>
                    <Select
                      value={subPlaylistData.phase}
                      onValueChange={(value) => setSubPlaylistData({ ...subPlaylistData, phase: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="フェーズを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="本番">本番</SelectItem>
                        <SelectItem value="稽古">稽古</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="playlistUrl">プレイリストURL</Label>
                    <Input
                      id="playlistUrl"
                      type="url"
                      value={subPlaylistData.playlistUrl}
                      onChange={(e) => setSubPlaylistData({ ...subPlaylistData, playlistUrl: e.target.value })}
                      placeholder="https://youtube.com/playlist?list=..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subThumbnailUrl">サムネイルURL</Label>
                    <Input
                      id="subThumbnailUrl"
                      type="url"
                      value={subPlaylistData.thumbnailUrl}
                      onChange={(e) => setSubPlaylistData({ ...subPlaylistData, thumbnailUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      キャンセル
                    </Button>
                    <Button type="submit">
                      作成
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">新しい動画を追加</h1>
            <Card>
              <CardHeader>
                <CardTitle>動画情報</CardTitle>
                <CardDescription>個別の動画情報を入力してください</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVideoSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="videoTitle">タイトル</Label>
                    <Input
                      id="videoTitle"
                      value={videoData.title}
                      onChange={(e) => setVideoData({ ...videoData, title: e.target.value })}
                      placeholder="例: 高砂"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">動画URL</Label>
                    <Input
                      id="videoUrl"
                      type="url"
                      value={videoData.videoUrl}
                      onChange={(e) => setVideoData({ ...videoData, videoUrl: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videoRecordedDate">録画日</Label>
                    <Input
                      id="videoRecordedDate"
                      type="date"
                      value={videoData.recordedDate}
                      onChange={(e) => setVideoData({ ...videoData, recordedDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videoThumbnailUrl">サムネイルURL</Label>
                    <Input
                      id="videoThumbnailUrl"
                      type="url"
                      value={videoData.thumbnailUrl}
                      onChange={(e) => setVideoData({ ...videoData, thumbnailUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      キャンセル
                    </Button>
                    <Button type="submit">
                      作成
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </AppTemplate>
  );
}

