/**
 * SubPlaylistEditView - サブプレイリスト編集ビューコンポーネント
 * 
 * サブプレイリストの詳細編集画面全体を表示します。
 * - サブプレイリスト情報の表示
 * - 動画一覧の表示
 * - 動画の削除操作
 * - 親プレイリストへの戻り操作
 */
import { Button } from '@/components/ui/forms/button';
import { ChevronRight, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Badge } from '@/components/ui/feedback/badge';
import { SubPlaylist, Playlist, Video } from '@/features/materials/types/material_types';
import { EditVideoCard } from './EditVideoCard';

interface SubPlaylistEditViewProps {
  subPlaylist: SubPlaylist;
  playlist: Playlist | undefined;
  videos: Video[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onMove: (id: string) => void;
  onVideoDelete: (id: string) => void;
  formatDate: (dateString?: string) => string;
}

export const SubPlaylistEditView = ({
  subPlaylist,
  playlist,
  videos,
  onBack,
  onDelete,
  onMove,
  onVideoDelete,
  formatDate,
}: SubPlaylistEditViewProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          ← 戻る
        </Button>
        <h2 className="text-2xl font-bold text-slate-900">{subPlaylist.title}</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>サブプレイリスト情報</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onMove(subPlaylist.id)}
                className="flex items-center gap-2"
              >
                <ChevronRight className="h-4 w-4" />
                移動
              </Button>
              <Button
                variant="destructive"
                onClick={() => onDelete(subPlaylist.id)}
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
              <span className="font-semibold">フェーズ:</span> <Badge>{subPlaylist.phase}</Badge>
            </div>
            <div>
              <span className="font-semibold">録画日:</span> {formatDate(subPlaylist.recordedDate)}
            </div>
            <div>
              <span className="font-semibold">動画数:</span> {videos.length}件
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">動画一覧</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((video) => (
            <EditVideoCard
              key={video.id}
              video={video}
              onDelete={onVideoDelete}
              showDate={true}
              formatDate={formatDate}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

