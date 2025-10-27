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

interface EditVideoCardProps {
  video: Video;
  onDelete: (id: string) => void;
  showDate?: boolean;
  formatDate?: (dateString?: string) => string;
}

export const EditVideoCard = ({ 
  video, 
  onDelete,
  showDate = false,
  formatDate
}: EditVideoCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(video.title);

  const handleSave = () => {
    // TODO: API integration
    console.log('Saving video:', {
      id: video.id,
      title: editTitle,
    });
    alert('動画タイトルを保存しました\n（実際のAPI連携は未実装）');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(video.title);
    setIsEditing(false);
  };

  return (
    <Card className="relative">
      <div className="aspect-video bg-slate-200 rounded-t">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover rounded-t"
        />
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
                className="flex-1 text-xs"
              >
                保存
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

