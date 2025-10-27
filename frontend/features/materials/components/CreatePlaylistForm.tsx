import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';

interface PlaylistData {
  title: string;
  year: string;
  stage: string;
  thumbnailUrl: string;
}

interface CreatePlaylistFormProps {
  playlistData: PlaylistData;
  setPlaylistData: (data: PlaylistData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function CreatePlaylistForm({
  playlistData,
  setPlaylistData,
  onSubmit,
  onCancel,
}: CreatePlaylistFormProps) {
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
        <h1 className="text-3xl font-bold text-slate-900">新しいプレイリストを追加</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>プレイリスト情報</CardTitle>
          <CardDescription>年度と舞台の情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
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

