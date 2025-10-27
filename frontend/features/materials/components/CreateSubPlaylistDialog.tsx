import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/overlays/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/inputs/select';
import { mockData } from '@/features/materials/data/material_data';

interface SubPlaylistFormData {
  playlistId: string;
  title: string;
  recordedDate: string;
  phase: string;
  playlistUrl: string;
}

interface CreateSubPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subPlaylistData: SubPlaylistFormData;
  setSubPlaylistData: (data: SubPlaylistFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreateSubPlaylistDialog({
  open,
  onOpenChange,
  subPlaylistData,
  setSubPlaylistData,
  onSubmit,
}: CreateSubPlaylistDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>本番・稽古プレイリストを追加</DialogTitle>
          <DialogDescription>
            本番または稽古のプレイリスト情報を入力してください
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playlistSelect">親プレイリスト（年度と舞台）</Label>
            <Select
              value={subPlaylistData.playlistId}
              onValueChange={(value) => setSubPlaylistData({ ...subPlaylistData, playlistId: value })}
              required
            >
              <SelectTrigger id="playlistSelect">
                <SelectValue placeholder="年度と舞台を選択" />
              </SelectTrigger>
              <SelectContent>
                {mockData.map((playlist) => (
                  <SelectItem key={playlist.id} value={playlist.id}>
                    {playlist.year}年 {playlist.stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit">
              作成
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

