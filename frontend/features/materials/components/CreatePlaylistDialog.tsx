import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
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

interface PlaylistFormData {
  title: string;
  year: string;
  stage: string;
}

interface CreatePlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlistData: PlaylistFormData;
  setPlaylistData: React.Dispatch<React.SetStateAction<PlaylistFormData>>;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreatePlaylistDialog({
  open,
  onOpenChange,
  playlistData,
  setPlaylistData,
  onSubmit,
}: CreatePlaylistDialogProps) {
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);
  const [isYearPopoverOpen, setIsYearPopoverOpen] = useState(false);
  const yearListRef = useRef<HTMLDivElement>(null);
  const currentYearRef = useRef<HTMLButtonElement>(null);

  // 年度の選択肢を生成（1925年から現在+3年まで）
  const currentYear = new Date().getFullYear();
  const startYear = 1925;
  const endYear = currentYear + 3;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).reverse();

  // Popoverが開いたときに現在の年にスクロール
  useEffect(() => {
    if (isYearPopoverOpen && currentYearRef.current && yearListRef.current) {
      // 少し遅延を入れて、Popoverが完全にレンダリングされた後にスクロール
      setTimeout(() => {
        currentYearRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [isYearPopoverOpen]);

  // ダイアログが開かれたときに、年度が空の場合は現在の年を設定
  useEffect(() => {
    if (open && !playlistData.year) {
      setPlaylistData(prev => ({ ...prev, year: currentYear.toString() }));
    }
  }, [open, currentYear]);

  // タイトルを自動生成する関数
  const generateTitle = (year: string, stage: string): string => {
    if (year && stage) {
      return `${year}年 ${stage}`;
    } else if (year) {
      return `${year}年`;
    } else if (stage) {
      return stage;
    }
    return '';
  };

  // 年度と舞台の入力に応じてリアルタイムでタイトルを提案
  useEffect(() => {
    if (open && !isTitleManuallyEdited) {
      const suggestedTitle = generateTitle(playlistData.year, playlistData.stage);
      if (playlistData.title !== suggestedTitle) {
        setPlaylistData(prev => ({ ...prev, title: suggestedTitle }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, playlistData.year, playlistData.stage, isTitleManuallyEdited]);

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newYear = e.target.value;
    if (!isTitleManuallyEdited) {
      const newTitle = generateTitle(newYear, playlistData.stage);
      setPlaylistData({ ...playlistData, year: newYear, title: newTitle });
    } else {
      setPlaylistData({ ...playlistData, year: newYear });
    }
  };

  const handleYearSelect = (year: number) => {
    const newYear = year.toString();
    if (!isTitleManuallyEdited) {
      const newTitle = generateTitle(newYear, playlistData.stage);
      setPlaylistData({ ...playlistData, year: newYear, title: newTitle });
    } else {
      setPlaylistData({ ...playlistData, year: newYear });
    }
    setIsYearPopoverOpen(false);
  };

  const handleStageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStage = e.target.value;
    if (!isTitleManuallyEdited) {
      const newTitle = generateTitle(playlistData.year, newStage);
      setPlaylistData({ ...playlistData, stage: newStage, title: newTitle });
    } else {
      setPlaylistData({ ...playlistData, stage: newStage });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTitleManuallyEdited(true);
    setPlaylistData({ ...playlistData, title: e.target.value });
  };

  // ダイアログが閉じられたときに、フラグをリセット
  useEffect(() => {
    if (!open) {
      setIsTitleManuallyEdited(false);
    }
  }, [open]);

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
            <Label htmlFor="year">年度</Label>
            <div className="flex gap-2">
              <Input
                id="year"
                type="text"
                value={playlistData.year}
                onChange={handleYearChange}
                placeholder="年度を入力または選択"
                required
                autoComplete="off"
                className="flex-1"
              />
              <Popover open={isYearPopoverOpen} onOpenChange={setIsYearPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="px-3"
                    onClick={() => setIsYearPopoverOpen(true)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[200px] p-0" 
                  align="end"
                >
                  <div 
                    ref={yearListRef}
                    className="overflow-y-auto"
                    style={{ 
                      maxHeight: '300px',
                      minHeight: '200px'
                    }}
                    onWheel={(e) => {
                      const target = e.currentTarget;
                      const delta = e.deltaY;
                      target.scrollTop += delta;
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    {years.map((year) => (
                      <button
                        key={year}
                        ref={year === currentYear ? currentYearRef : undefined}
                        type="button"
                        className={`w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ${
                          year === currentYear ? 'bg-accent/50' : ''
                        }`}
                        onClick={() => handleYearSelect(year)}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">舞台</Label>
            <Input
              id="stage"
              value={playlistData.stage}
              onChange={handleStageChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={playlistData.title}
              onChange={handleTitleChange}
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

