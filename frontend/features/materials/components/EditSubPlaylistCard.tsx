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
import { useState, useRef, useEffect } from 'react';
import { Edit, Trash2, ChevronRight, Plus, ChevronDown, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Badge } from '@/components/ui/feedback/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/overlays/popover';
import { SubPlaylist } from '@/features/materials/types/material_types';
import { materialsService } from '@/features/materials/services/materials-service';

interface EditSubPlaylistCardProps {
  subPlaylist: SubPlaylist;
  videoCount: number;
  onMove: (id: string) => void;
  onDelete: (id: string) => void;
  onVideoAdd?: (id: string) => void;
  formatDate?: (dateString?: string) => string;
  getVideosForSubPlaylist: (subPlaylistId: string) => any[];
  onVideoDelete: (id: string) => void;
  onClick?: (id: string) => void;
  playlistId?: string;
  onUpdate?: (updatedSubPlaylist: SubPlaylist) => void;
  allSubPlaylists?: SubPlaylist[];
}

export const EditSubPlaylistCard = ({
  subPlaylist,
  videoCount,
  onMove,
  onDelete,
  onVideoAdd,
  formatDate,
  getVideosForSubPlaylist,
  onVideoDelete,
  onClick,
  playlistId,
  onUpdate,
  allSubPlaylists,
}: EditSubPlaylistCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subPlaylist.title);
  const [editDate, setEditDate] = useState(subPlaylist.recordedDate);
  const [editPhase, setEditPhase] = useState(subPlaylist.phase);
  const [isPhasePopoverOpen, setIsPhasePopoverOpen] = useState(false);
  const [availablePhases, setAvailablePhases] = useState<string[]>([]);
  const [existingSubPlaylists, setExistingSubPlaylists] = useState<SubPlaylist[]>([]);
  const [removedPhases, setRemovedPhases] = useState<Set<string>>(new Set());
  const phaseListRef = useRef<HTMLDivElement>(null);

  // デフォルトのフェーズ候補
  const defaultPhases = ['本番', '稽古'];

  // 既存のサブプレイリストからフェーズを取得
  useEffect(() => {
    const loadPhases = async () => {
      if (playlistId) {
        try {
          // allSubPlaylistsが渡されている場合はそれを使用、そうでなければAPIから取得
          const subPlaylists = allSubPlaylists || await materialsService.getSubPlaylists(playlistId);
          setExistingSubPlaylists(subPlaylists);
          // 既存のサブプレイリストからフェーズを抽出（空文字を除く）
          const phases = Array.from(
            new Set(
              subPlaylists
                .map(sp => sp.phase)
                .filter((phase): phase is string => Boolean(phase && phase.trim()))
            )
          );
          
          // デフォルトのフェーズと既存のフェーズを結合（重複を除く）
          const allPhases = Array.from(new Set([...defaultPhases, ...phases]));
          setAvailablePhases(allPhases);
        } catch (error) {
          console.error('Failed to load phases:', error);
          setAvailablePhases(defaultPhases);
        }
      } else {
        setAvailablePhases(defaultPhases);
      }
    };
    loadPhases();
  }, [playlistId, allSubPlaylists]);

  const handlePhaseSelect = (phase: string) => {
    setEditPhase(phase);
    setIsPhasePopoverOpen(false);
  };

  const handlePhaseClear = () => {
    setEditPhase('');
  };

  // 表示するフェーズ候補を取得（削除されたものを除く）
  const getDisplayPhases = () => {
    return availablePhases.filter(phase => !removedPhases.has(phase));
  };

  // フェーズが他のサブプレイリストで使われているかチェック
  const isPhaseUsedInOtherSubPlaylists = (phase: string): boolean => {
    if (!existingSubPlaylists || existingSubPlaylists.length === 0) {
      return false;
    }
    // 現在編集中のサブプレイリストを除外
    const otherSubPlaylists = existingSubPlaylists.filter(sp => sp.id !== subPlaylist.id);
    return otherSubPlaylists.some(sp => sp.phase === phase);
  };

  const handlePhaseRemove = (phase: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPhaseUsedInOtherSubPlaylists(phase)) {
      setRemovedPhases(prev => new Set(prev).add(phase));
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!playlistId) {
      alert('エラー: プレイリストIDが指定されていません');
      return;
    }

    setIsSaving(true);
    try {
      const updatedSubPlaylist = await materialsService.updateSubPlaylist(
        playlistId,
        subPlaylist.id,
        {
          title: editTitle,
          recordedDate: editDate,
          phase: editPhase,
        }
      );
      onUpdate?.(updatedSubPlaylist);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update sub-playlist:', error);
      alert('サブプレイリストの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(subPlaylist.title);
    setEditDate(subPlaylist.recordedDate);
    setEditPhase(subPlaylist.phase);
    setIsEditing(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // ボタンや入力フィールドがクリックされた場合は、カードのクリックイベントを発火しない
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('label') ||
      isEditing
    ) {
      return;
    }
    onClick?.(subPlaylist.id);
  };

  return (
    <Card 
      onClick={handleCardClick}
      className={onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
    >
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
          <div className="flex flex-wrap justify-start sm:justify-end gap-2 flex-shrink-0 sm:ml-4">
            <Button
              variant="ghost"
              onClick={() => onMove(subPlaylist.id)}
              size="sm"
              className="flex items-center gap-2 flex-1 sm:flex-initial"
            >
              <ChevronRight className="h-4 w-4" />
              移動
            </Button>
            {onVideoAdd && (
              <Button
                variant="outline"
                onClick={() => onVideoAdd(subPlaylist.id)}
                size="sm"
                className="flex items-center gap-2 flex-1 sm:flex-initial"
              >
                <Plus className="h-4 w-4" />
                追加
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
              size="sm"
              className="flex items-center gap-2 flex-1 sm:flex-initial"
            >
              <Edit className="h-4 w-4" />
              編集
            </Button>
            <Button
              variant="destructive"
              onClick={() => onDelete(subPlaylist.id)}
              size="sm"
              className="flex items-center gap-2 flex-1 sm:flex-initial"
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
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={`sub-phase-${subPlaylist.id}`}
                      type="text"
                      value={editPhase}
                      onChange={(e) => setEditPhase(e.target.value)}
                      placeholder="フェーズを入力または選択"
                      autoComplete="off"
                      className="pr-8"
                    />
                    {editPhase && (
                      <button
                        type="button"
                        onClick={handlePhaseClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Popover open={isPhasePopoverOpen} onOpenChange={setIsPhasePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="px-3"
                        onClick={() => setIsPhasePopoverOpen(true)}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-[200px] p-0" 
                      align="end"
                    >
                      <div 
                        ref={phaseListRef}
                        className="overflow-y-auto"
                        style={{ 
                          maxHeight: '300px',
                          minHeight: '100px'
                        }}
                        onWheel={(e) => {
                          const target = e.currentTarget;
                          const delta = e.deltaY;
                          target.scrollTop += delta;
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        {getDisplayPhases().length > 0 ? (
                          getDisplayPhases().map((phase) => {
                            const isUsed = isPhaseUsedInOtherSubPlaylists(phase);
                            return (
                              <div
                                key={phase}
                                className="flex items-center justify-between w-full px-4 py-2 hover:bg-accent hover:text-accent-foreground focus-within:bg-accent focus-within:text-accent-foreground group"
                              >
                                <button
                                  type="button"
                                  className="flex-1 text-left focus:outline-none"
                                  onClick={() => handlePhaseSelect(phase)}
                                >
                                  {phase}
                                </button>
                                {!isUsed && (
                                  <button
                                    type="button"
                                    onClick={(e) => handlePhaseRemove(phase, e)}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity ml-2"
                                    title="候補から削除"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-4 py-2 text-sm text-muted-foreground">
                            候補なし
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
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
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </CardContent>
      ) : (
        <CardContent>
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {getVideosForSubPlaylist(subPlaylist.id).map((video: any, index: number) => {
                const videos = getVideosForSubPlaylist(subPlaylist.id);
                // 表示する動画数を制限（例: 最大5件まで表示）
                const maxVisible = 5;
                if (index >= maxVisible) return null;
                
                return (
                  <div key={video.id} className="flex-shrink-0">
                    <div className="w-32 aspect-video bg-slate-200 rounded overflow-hidden">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* 動画が表示上限を超えている場合、「...」を表示 */}
              {getVideosForSubPlaylist(subPlaylist.id).length > 5 && (
                <div className="flex-shrink-0 flex items-center justify-center w-32 aspect-video bg-slate-100 border border-slate-300 rounded">
                  <span className="text-2xl text-slate-500 font-bold">...</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

