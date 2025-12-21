import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/overlays/popover';
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
import { Playlist, SubPlaylist } from '@/features/materials/types/material_types';
import { materialsService } from '@/features/materials/services/materials-service';

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
  parentPlaylist?: Playlist | null;
  isEditMode?: boolean;
  existingSubPlaylists?: SubPlaylist[];
  currentSubPlaylistId?: string;
}

export function CreateSubPlaylistDialog({
  open,
  onOpenChange,
  subPlaylistData,
  setSubPlaylistData,
  onSubmit,
  parentPlaylist,
  isEditMode = false,
  existingSubPlaylists = [],
  currentSubPlaylistId,
}: CreateSubPlaylistDialogProps) {
  const [isPhasePopoverOpen, setIsPhasePopoverOpen] = useState(false);
  const [availablePhases, setAvailablePhases] = useState<string[]>([]);
  const phaseListRef = useRef<HTMLDivElement>(null);

  // デフォルトのフェーズ候補
  const defaultPhases = ['本番', '稽古'];

  // 既存のサブプレイリストからフェーズを取得
  useEffect(() => {
    if (parentPlaylist?.id) {
      const loadPhases = async () => {
        try {
          const subPlaylists = existingSubPlaylists.length > 0 
            ? existingSubPlaylists 
            : await materialsService.getSubPlaylists(parentPlaylist.id);
          
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
      };
      loadPhases();
    } else {
      setAvailablePhases(defaultPhases);
    }
  }, [parentPlaylist?.id, open, existingSubPlaylists]);

  const [removedPhases, setRemovedPhases] = useState<Set<string>>(new Set());

  const handlePhaseSelect = (phase: string) => {
    setSubPlaylistData({ ...subPlaylistData, phase });
    setIsPhasePopoverOpen(false);
  };

  const handlePhaseClear = () => {
    setSubPlaylistData({ ...subPlaylistData, phase: '' });
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
    // 編集モードの場合は、現在編集中のサブプレイリストを除外
    const otherSubPlaylists = isEditMode && currentSubPlaylistId
      ? existingSubPlaylists.filter(sp => sp.id !== currentSubPlaylistId)
      : existingSubPlaylists;
    
    return otherSubPlaylists.some(sp => sp.phase === phase);
  };

  const handlePhaseRemove = (phase: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPhaseUsedInOtherSubPlaylists(phase)) {
      setRemovedPhases(prev => new Set(prev).add(phase));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '本番・稽古プレイリストを編集' : '本番・稽古プレイリストを追加'}</DialogTitle>
          <DialogDescription>
            本番または稽古のプレイリスト情報を入力してください
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playlistSelect">親プレイリスト（年度と舞台）</Label>
            {parentPlaylist ? (
              <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                {parentPlaylist.year}年 {parentPlaylist.stage}
              </div>
            ) : (
              <Select
                value={subPlaylistData.playlistId}
                onValueChange={(value) => setSubPlaylistData({ ...subPlaylistData, playlistId: value })}
                required
                disabled
              >
                <SelectTrigger id="playlistSelect">
                  <SelectValue placeholder="年度と舞台を選択" />
                </SelectTrigger>
              </Select>
            )}
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
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="phase"
                  type="text"
                  value={subPlaylistData.phase}
                  onChange={(e) => setSubPlaylistData({ ...subPlaylistData, phase: e.target.value })}
                  placeholder="フェーズを入力または選択"
                  autoComplete="off"
                  className="pr-8"
                />
                {subPlaylistData.phase && (
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
              {isEditMode ? '更新' : '作成'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

