/**
 * EditSubPlaylistCard - 編集用サブプレイリストカードコンポーネント
 * 
 * 材料編集ページ専用のサブプレイリストカードコンポーネントです。
 * - サブプレイリスト情報の表示と編集
 * - タイトル、録画日、フェーズの編集機能
 * - 編集モードと表示モードの切り替え
 * - 移動・削除ボタンの提供
 * - 含まれる動画のプレビュー表示（最大4件）
 * - 動画数のカウント表示
 */
import { useState } from 'react';
import { Edit, Trash2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Badge } from '@/components/ui/feedback/badge';
import { SubPlaylist } from '@/features/materials/types/material_types';

interface EditSubPlaylistCardProps {
  subPlaylist: SubPlaylist;
  videoCount: number;
  onMove: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate?: (dateString?: string) => string;
  getVideosForSubPlaylist: (subPlaylistId: string) => any[];
  onVideoDelete: (id: string) => void;
}

export const EditSubPlaylistCard = ({
  subPlaylist,
  videoCount,
  onMove,
  onDelete,
  formatDate,
  getVideosForSubPlaylist,
  onVideoDelete
}: EditSubPlaylistCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subPlaylist.title);
  const [editDate, setEditDate] = useState(subPlaylist.recordedDate);
  const [editPhase, setEditPhase] = useState(subPlaylist.phase);

  const handleSave = () => {
    // TODO: API integration
    console.log('Saving sub-playlist:', {
      id: subPlaylist.id,
      title: editTitle,
      recordedDate: editDate,
      phase: editPhase,
    });
    alert('サブプレイリスト情報を保存しました\n（実際のAPI連携は未実装）');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(subPlaylist.title);
    setEditDate(subPlaylist.recordedDate);
    setEditPhase(subPlaylist.phase);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-3 flex-1">
            <CardTitle className="text-lg">{subPlaylist.title}</CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">フェーズ</div>
                <Badge variant="secondary">{subPlaylist.phase}</Badge>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">録画日</div>
                <div className="font-medium">{formatDate ? formatDate(subPlaylist.recordedDate) : subPlaylist.recordedDate}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">動画数</div>
                <div className="font-medium">{videoCount}件</div>
              </div>
            </div>
          </div>
          <div className="flex justify-start sm:justify-end gap-2 flex-shrink-0 sm:ml-4">
            <Button
              variant="ghost"
              onClick={() => onMove(subPlaylist.id)}
              size="sm"
              className="flex items-center gap-2"
            >
              <ChevronRight className="h-4 w-4" />
              移動
            </Button>
            <Button
              variant="outline"
              onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              編集
            </Button>
            <Button
              variant="destructive"
              onClick={() => onDelete(subPlaylist.id)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              削除
            </Button>
          </div>
        </div>
      </CardHeader>
      {isEditing ? (
        <CardContent className="border-t pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`sub-title-${subPlaylist.id}`}>タイトル</Label>
              <Input
                id={`sub-title-${subPlaylist.id}`}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="例: 2025年1月20日 - 本番"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`sub-date-${subPlaylist.id}`}>録画日</Label>
                <Input
                  id={`sub-date-${subPlaylist.id}`}
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`sub-phase-${subPlaylist.id}`}>フェーズ</Label>
                <select
                  id={`sub-phase-${subPlaylist.id}`}
                  value={editPhase}
                  onChange={(e) => setEditPhase(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="本番">本番</option>
                  <option value="稽古">稽古</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleSave}
              >
                保存
              </Button>
            </div>
          </div>
        </CardContent>
      ) : (
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {getVideosForSubPlaylist(subPlaylist.id).slice(0, 4).map((video: any) => (
              <div key={video.id} className="aspect-video bg-slate-200 rounded">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover rounded"
                />
              </div>
            ))}
            {getVideosForSubPlaylist(subPlaylist.id).length > 4 && (
              <div className="flex items-center justify-center border border-slate-300 rounded bg-slate-50">
                <p className="text-sm text-slate-500">
                  +{getVideosForSubPlaylist(subPlaylist.id).length - 4}件
                </p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

