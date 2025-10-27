import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';

interface SubPlaylistData {
  title: string;
  recordedDate: string;
  phase: string;
  playlistUrl: string;
  thumbnailUrl: string;
}

interface CreateSubPlaylistFormProps {
  subPlaylistData: SubPlaylistData;
  setSubPlaylistData: (data: SubPlaylistData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function CreateSubPlaylistForm({
  subPlaylistData,
  setSubPlaylistData,
  onSubmit,
  onCancel,
}: CreateSubPlaylistFormProps) {
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
        <h1 className="text-3xl font-bold text-slate-900">本番・稽古プレイリストを追加</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>プレイリスト情報</CardTitle>
          <CardDescription>本番または稽古のプレイリスト情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
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

