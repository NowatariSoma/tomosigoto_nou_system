/**
 * PlaylistEditInfoCard - プレイリスト編集情報カードコンポーネント
 * 
 * プレイリスト編集ページで使用する情報カードです。
 * - 編集モードと表示モードの切り替え
 * - 年度、舞台、タイトルの編集機能
 * - 保存・キャンセル・削除アクション
 */
import { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Playlist } from '@/features/materials/types/material_types';

interface PlaylistEditInfoCardProps {
  playlist: Playlist;
  onSave: (data: { title: string; year: number; stage: string }) => void;
  onDelete: (id: string) => void;
}

export const PlaylistEditInfoCard = ({ playlist, onSave, onDelete }: PlaylistEditInfoCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(playlist.title);
  const [editYear, setEditYear] = useState(playlist.year.toString());
  const [editStage, setEditStage] = useState(playlist.stage);

  const handleSave = () => {
    onSave({
      title: editTitle,
      year: parseInt(editYear),
      stage: editStage,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(playlist.title);
    setEditYear(playlist.year.toString());
    setEditStage(playlist.stage);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg sm:text-xl">プレイリスト情報</CardTitle>
          <div className="flex flex-wrap gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  size="sm"
                  className="flex items-center gap-2 flex-1 sm:flex-initial"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="flex items-center gap-2 flex-1 sm:flex-initial"
                >
                  保存
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  className="flex items-center gap-2 flex-1 sm:flex-initial"
                >
                  <Edit className="h-4 w-4" />
                  編集
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onDelete(playlist.id)}
                  size="sm"
                  className="flex items-center gap-2 flex-1 sm:flex-initial"
                >
                  <Trash2 className="h-4 w-4" />
                  削除
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="playlist-year">年度</Label>
                <Input
                  id="playlist-year"
                  type="number"
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  min="2000"
                  max="3000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="playlist-stage">舞台</Label>
                <Input
                  id="playlist-stage"
                  type="text"
                  value={editStage}
                  onChange={(e) => setEditStage(e.target.value)}
                  placeholder="例: EVE能"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="playlist-title">タイトル</Label>
                <Input
                  id="playlist-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="例: 2025年EVE能"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="font-semibold">年度:</span> {playlist.year}年
              </div>
              <div>
                <span className="font-semibold">舞台:</span> {playlist.stage}
              </div>
              <div>
                <span className="font-semibold">タイトル:</span> {playlist.title}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

