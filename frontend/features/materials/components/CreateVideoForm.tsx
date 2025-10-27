import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';
import { playlistVideos } from '@/features/materials/data/playlist_data';
import { mockData } from '@/features/materials/data/material_data';

interface VideoData {
  subPlaylistId: string;
  title: string;
  videoUrl: string;
  recordedDate: string;
  thumbnailUrl: string;
}

interface CreateVideoFormProps {
  videoData: VideoData;
  setVideoData: (data: VideoData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function CreateVideoForm({
  videoData,
  setVideoData,
  onSubmit,
  onCancel,
}: CreateVideoFormProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex items-center gap-2"
        >
          ← 戻る
        </Button>
        <h1 className="text-3xl font-bold text-slate-900">新しい動画を追加</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>動画情報</CardTitle>
          <CardDescription>個別の動画情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subPlaylistId">所属プレイリスト</Label>
              <Select
                value={videoData.subPlaylistId}
                onValueChange={(value) => setVideoData({ ...videoData, subPlaylistId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="プレイリストを選択" />
                </SelectTrigger>
                <SelectContent>
                  {playlistVideos.map((playlist) => {
                    const parentPlaylist = mockData.find(p => p.id === playlist.playlistId);
                    const playlistLabel = parentPlaylist
                      ? `${parentPlaylist.year}年 ${parentPlaylist.stage} - ${playlist.title}`
                      : playlist.title;
                    return (
                      <SelectItem key={playlist.id} value={playlist.id}>
                        {playlistLabel}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

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

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onCancel}>
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
  );
}

