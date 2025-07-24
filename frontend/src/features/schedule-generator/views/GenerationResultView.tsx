import React, { useState, useCallback } from 'react';
import { GeneratedSchedule, RegenerationParams, SessionDropData, SessionEditData, Session } from '../types/generatedSchedule';
import { useScheduleDrag } from '../hooks/useScheduleDrag';
import { useChangeHistory } from '../hooks/useChangeHistory';
import { SessionDragItem } from '../components/SessionDragItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface GenerationResultViewProps {
  generatedSchedule: GeneratedSchedule;
  onScheduleConfirm: (schedule: GeneratedSchedule) => void;
  onRegenerateRequest: (params: RegenerationParams) => void;
  readOnly?: boolean;
}

type ViewMode = 'month' | 'week' | 'day' | 'list';

export const GenerationResultView: React.FC<GenerationResultViewProps> = ({
  generatedSchedule,
  onScheduleConfirm,
  onRegenerateRequest,
  readOnly = false,
}) => {
  const [currentSchedule, setCurrentSchedule] = useState<GeneratedSchedule>(generatedSchedule);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [selectedPartIds, setSelectedPartIds] = useState<number[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showChangeHistory, setShowChangeHistory] = useState(false);

  const changeHistory = useChangeHistory();

  const handleSessionDrop = useCallback((sessionId: string, newData: SessionDropData) => {
    const session = currentSchedule.sessions.find(s => s.id === sessionId);
    if (!session) return;

    const oldData = {
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      venueId: session.venueId,
    };

    // セッションを更新
    const updatedSessions = currentSchedule.sessions.map(s =>
      s.id === sessionId
        ? {
            ...s,
            date: newData.date,
            startTime: newData.startTime,
            endTime: newData.endTime,
            venueId: newData.venueId,
            modifiedAt: new Date(),
          }
        : s
    );

    const updatedSchedule = {
      ...currentSchedule,
      sessions: updatedSessions,
      version: currentSchedule.version + 1,
    };

    setCurrentSchedule(updatedSchedule);

    // 変更履歴に追加
    changeHistory.addChange({
      type: 'session_moved',
      sessionId,
      oldData,
      newData,
      description: `セッション「${session.title}」を移動`,
      canUndo: true,
    });
  }, [currentSchedule, changeHistory]);

  const scheduleDrag = useScheduleDrag(currentSchedule, handleSessionDrop);

  const handleViewModeChange = (mode: string) => {
    setViewMode(mode as ViewMode);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleVenueChange = (venueId: number | null) => {
    setSelectedVenueId(venueId);
  };

  const handlePartFilterChange = (partIds: number[]) => {
    setSelectedPartIds(partIds);
  };

  const handleSessionEdit = (sessionId: string, data: SessionEditData) => {
    const session = currentSchedule.sessions.find(s => s.id === sessionId);
    if (!session) return;

    const oldData = { ...session };
    const newData = { ...session, ...data, modifiedAt: new Date() };

    const updatedSessions = currentSchedule.sessions.map(s =>
      s.id === sessionId ? newData : s
    );

    const updatedSchedule = {
      ...currentSchedule,
      sessions: updatedSessions,
      version: currentSchedule.version + 1,
    };

    setCurrentSchedule(updatedSchedule);
    setIsEditModalOpen(false);

    // 変更履歴に追加
    changeHistory.addChange({
      type: 'session_edited',
      sessionId,
      oldData,
      newData,
      description: `セッション「${session.title}」を編集`,
      canUndo: true,
    });
  };

  const handleSessionClick = (sessionId: string) => {
    if (readOnly) return;
    
    setSelectedSessionId(sessionId);
    setIsEditModalOpen(true);
  };

  const handleConfirmSchedule = () => {
    if (onScheduleConfirm) {
      onScheduleConfirm(currentSchedule);
    }
  };

  const handleUndoChange = () => {
    changeHistory.undo((entry) => {
      if (entry.type === 'session_moved' || entry.type === 'session_edited') {
        const updatedSessions = currentSchedule.sessions.map(s =>
          s.id === entry.sessionId
            ? { ...s, ...entry.oldData, modifiedAt: new Date() }
            : s
        );

        setCurrentSchedule({
          ...currentSchedule,
          sessions: updatedSessions,
          version: currentSchedule.version + 1,
        });
      }
    });
  };

  const handleRedoChange = () => {
    changeHistory.redo((entry) => {
      if (entry.type === 'session_moved' || entry.type === 'session_edited') {
        const updatedSessions = currentSchedule.sessions.map(s =>
          s.id === entry.sessionId
            ? { ...s, ...entry.newData, modifiedAt: new Date() }
            : s
        );

        setCurrentSchedule({
          ...currentSchedule,
          sessions: updatedSessions,
          version: currentSchedule.version + 1,
        });
      }
    });
  };

  const handleNavigatePrev = () => {
    const newDate = new Date(selectedDate);
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
    }
    setSelectedDate(newDate);
  };

  const handleNavigateNext = () => {
    const newDate = new Date(selectedDate);
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
    }
    setSelectedDate(newDate);
  };

  const handleNavigateToday = () => {
    setSelectedDate(new Date());
  };

  const handleRegenerateRequest = () => {
    if (onRegenerateRequest) {
      const params: RegenerationParams = {
        dateRange: {
          start: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
          end: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0),
        },
        venueIds: selectedVenueId ? [selectedVenueId] : currentSchedule.venues.map(v => v.id),
        partIds: selectedPartIds.length > 0 ? selectedPartIds : currentSchedule.parts.map(p => p.id),
      };
      onRegenerateRequest(params);
    }
  };

  const filteredSessions = currentSchedule.sessions.filter(session => {
    if (selectedVenueId && session.venueId !== selectedVenueId) return false;
    if (selectedPartIds.length > 0 && !session.partIds.some(id => selectedPartIds.includes(id))) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{currentSchedule.name}</h1>
          <p className="text-gray-600">{currentSchedule.sessions.length}件のセッション</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Undo/Redo */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndoChange}
            disabled={!changeHistory.canUndo}
            aria-label="元に戻す"
          >
            ↶
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedoChange}
            disabled={!changeHistory.canRedo}
            aria-label="やり直し"
          >
            ↷
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* 変更履歴 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChangeHistory(!showChangeHistory)}
          >
            変更履歴
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* 再生成 */}
          <Button variant="outline" onClick={handleRegenerateRequest}>
            再生成
          </Button>

          {/* 確定 */}
          {!readOnly && (
            <Button onClick={handleConfirmSchedule}>
              スケジュール確定
            </Button>
          )}
        </div>
      </div>

      {/* 最適化スコアと競合表示 */}
      <div className="flex items-center space-x-4">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">最適化スコア</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentSchedule.optimizationScore.total}</div>
          </CardContent>
        </Card>

        {currentSchedule.conflicts.length > 0 && (
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-600">競合</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {currentSchedule.conflicts.length}件の競合が検出されました
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* フィルター */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">会場:</span>
          {currentSchedule.venues.map(venue => (
            <label key={venue.id} className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={selectedVenueId === venue.id}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedVenueId(venue.id);
                  } else {
                    setSelectedVenueId(null);
                  }
                }}
                aria-label={venue.name}
              />
              <span className="text-sm">{venue.name}</span>
            </label>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">パート:</span>
          {currentSchedule.parts.map(part => (
            <label key={part.id} className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={selectedPartIds.includes(part.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedPartIds([...selectedPartIds, part.id]);
                  } else {
                    setSelectedPartIds(selectedPartIds.filter(id => id !== part.id));
                  }
                }}
                aria-label={part.name}
              />
              <span className="text-sm">{part.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleNavigatePrev} aria-label="前の期間">
            ←
          </Button>
          <Button variant="outline" size="sm" onClick={handleNavigateToday}>
            今日
          </Button>
          <Button variant="outline" size="sm" onClick={handleNavigateNext} aria-label="次の期間">
            →
          </Button>
        </div>

        {/* 表示モード切り替え */}
        <Tabs value={viewMode} onValueChange={handleViewModeChange}>
          <TabsList>
            <TabsTrigger value="month">月表示</TabsTrigger>
            <TabsTrigger value="week">週表示</TabsTrigger>
            <TabsTrigger value="day">日表示</TabsTrigger>
            <TabsTrigger value="list">リスト表示</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={viewMode} className="h-full">
          <TabsContent value="month" className="h-full mt-0">
            <div className="h-full bg-gray-50 p-4 rounded-lg">
              <p className="text-center text-gray-500">月表示ビュー（実装予定）</p>
            </div>
          </TabsContent>
          
          <TabsContent value="week" className="h-full mt-0">
            <div className="h-full bg-gray-50 p-4 rounded-lg">
              <p className="text-center text-gray-500">週表示ビュー（実装予定）</p>
            </div>
          </TabsContent>
          
          <TabsContent value="day" className="h-full mt-0">
            <div className="h-full bg-gray-50 p-4 rounded-lg">
              <p className="text-center text-gray-500">日表示ビュー（実装予定）</p>
            </div>
          </TabsContent>
          
          <TabsContent value="list" className="h-full mt-0">
            <div className="h-full space-y-2 overflow-y-auto">
              {filteredSessions.map(session => (
                <SessionDragItem
                  key={session.id}
                  session={session}
                  conflicts={currentSchedule.conflicts.filter(c =>
                    c.sessionIds.includes(session.id)
                  )}
                  isDraggable={!readOnly}
                  isSelected={selectedSessionId === session.id}
                  onClick={() => handleSessionClick(session.id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 変更履歴パネル */}
      {showChangeHistory && (
        <Card data-testid="change-history-panel">
          <CardHeader>
            <CardTitle>変更履歴</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {changeHistory.history.map((entry, index) => (
                <div
                  key={entry.id}
                  className={cn(
                    'p-2 text-sm rounded border',
                    index <= changeHistory.currentIndex
                      ? 'bg-white border-blue-200'
                      : 'bg-gray-50 border-gray-200 opacity-50'
                  )}
                >
                  <div className="font-medium">{entry.description}</div>
                  <div className="text-gray-500">
                    {entry.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {changeHistory.history.length === 0 && (
                <p className="text-center text-gray-500">変更履歴はありません</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* セッション編集モーダルプレースホルダー */}
      {isEditModalOpen && (
        <div
          data-testid="session-edit-modal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4">セッション編集</h2>
            <p className="text-gray-600 mb-4">セッション編集モーダル（実装予定）</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={() => setIsEditModalOpen(false)}>
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};