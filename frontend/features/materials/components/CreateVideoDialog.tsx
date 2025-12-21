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

interface VideoFormData {
  title: string;
  videoUrl: string;
  recordedDate: string;
  thumbnailUrl: string;
}

interface CreateVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoData: VideoFormData;
  setVideoData: (data: VideoFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreateVideoDialog({
  open,
  onOpenChange,
  videoData,
  setVideoData,
  onSubmit,
}: CreateVideoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>動画を追加</DialogTitle>
          <DialogDescription>
            動画情報を入力してください
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
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

