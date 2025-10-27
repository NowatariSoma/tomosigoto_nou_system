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

interface PlaylistFormData {
  title: string;
  year: string;
  stage: string;
}

interface CreatePlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlistData: PlaylistFormData;
  setPlaylistData: (data: PlaylistFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreatePlaylistDialog({
  open,
  onOpenChange,
  playlistData,
  setPlaylistData,
  onSubmit,
}: CreatePlaylistDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新しいプレイリストを追加</DialogTitle>
          <DialogDescription>
            年度と舞台の情報を入力してください
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
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

