/**
 * EditVideoCard - 編集用動画カードコンポーネント
 * 
 * 材料編集ページ専用の動画カードコンポーネントです。
 * - 動画タイトルの編集機能
 * - タイトルの編集モードと表示モードの切り替え
 * - 削除ボタンの提供
 * - 録画日の表示オプション
 * - カスタムサイズのサムネイル表示
 */
import { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Video } from '@/features/materials/types/material_types';
import { materialsService } from '@/features/materials/services/materials-service';

interface EditVideoCardProps {
  video: Video;
  onDelete: (id: string) => void;
  showDate?: boolean;
  formatDate?: (dateString?: string) => string;
  playlistId?: string;
  subPlaylistId?: string;
  onUpdate?: (updatedVideo: Video) => void;
}

export const EditVideoCard = ({
  video,
  onDelete,
  showDate = false,
  formatDate,
  playlistId,
  subPlaylistId,
  onUpdate,
}: EditVideoCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(video.title);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!playlistId || !subPlaylistId) {
      alert('エラー: プレイリストIDまたはサブプレイリストIDが指定されていません');
      return;
    }

    setIsSaving(true);
    try {
      const updatedVideo = await materialsService.updateVideo(
        playlistId,
        subPlaylistId,
        video.id,
        { title: editTitle }
      );
      onUpdate?.(updatedVideo);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update video:', error);
      alert('動画タイトルの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(video.title);
    setIsEditing(false);
  };

  return (
    <Card className="relative">
      <div className="aspect-video bg-slate-200 rounded-t">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover rounded-t"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            No Image
          </div>
        )}
      </div>
      <CardContent className="p-3">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="動画タイトル"
              className="text-xs"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex-1 text-xs"
              >
                キャンセル
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 text-xs"
              >
                {isSaving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium line-clamp-2 mb-2">{video.title}</p>
            {showDate && video.recordedDate && formatDate && (
              <p className="text-xs text-slate-500 mb-2">{formatDate(video.recordedDate)}</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex-1 flex items-center gap-1 text-xs"
              >
                <Edit className="h-3 w-3" />
                編集
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(video.id)}
                className="flex-1 flex items-center gap-1 text-xs"
              >
                <Trash2 className="h-3 w-3" />
                削除
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

