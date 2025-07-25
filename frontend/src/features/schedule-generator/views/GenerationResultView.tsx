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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameDay, 
  startOfWeek, 
  endOfWeek,
  addDays,
  isSameMonth,
  parseISO
} from 'date-fns';
import { ja } from 'date-fns/locale';

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
            <div className="h-full bg-white p-4 rounded-lg overflow-auto">
              <MonthCalendarView 
                sessions={filteredSessions}
                selectedDate={selectedDate}
                onSessionClick={handleSessionClick}
                onDateClick={(date) => setSelectedDate(date)}
                readOnly={readOnly}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="week" className="h-full mt-0">
            <div className="h-full bg-white p-4 rounded-lg overflow-auto">
              <WeekScheduleView 
                sessions={filteredSessions}
                selectedDate={selectedDate}
                onSessionClick={handleSessionClick}
                onDateClick={(date) => setSelectedDate(date)}
                readOnly={readOnly}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="day" className="h-full mt-0">
            <div className="h-full bg-white p-4 rounded-lg overflow-auto">
              <DayScheduleView 
                sessions={filteredSessions}
                selectedDate={selectedDate}
                onSessionClick={handleSessionClick}
                readOnly={readOnly}
              />
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
          <SessionEditModal
            session={currentSchedule.sessions.find(s => s.id === selectedSessionId)}
            onSave={handleSessionEdit}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

// MonthCalendarView コンポーネント
interface MonthCalendarViewProps {
  sessions: Session[];
  selectedDate: Date;
  onSessionClick: (sessionId: string) => void;
  onDateClick: (date: Date) => void;
  readOnly?: boolean;
}

const MonthCalendarView: React.FC<MonthCalendarViewProps> = ({
  sessions,
  selectedDate,
  onSessionClick,
  onDateClick,
  readOnly = false
}) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // 日曜日開始
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const getSessionsForDate = (date: Date) => {
    return sessions.filter(session => 
      isSameDay(new Date(session.date), date)
    );
  };

  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div data-testid="month-calendar-grid" className="h-full flex flex-col">
      {/* カレンダーヘッダー */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-center">
          {format(selectedDate, 'yyyy年M月', { locale: ja })}
        </h3>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((day, index) => (
          <div
            key={index}
            className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-100 rounded"
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {calendarDays.map((day, index) => {
          const daySessions = getSessionsForDate(day);
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div
              key={index}
              className={cn(
                "border rounded-lg p-2 min-h-[100px] cursor-pointer transition-colors",
                "hover:bg-gray-50",
                isCurrentMonth ? "bg-white" : "bg-gray-50",
                isSelected && "ring-2 ring-blue-500 bg-blue-50"
              )}
              onClick={() => onDateClick(day)}
            >
              {/* 日付 */}
              <div className={cn(
                "text-sm font-medium mb-1",
                isCurrentMonth ? "text-gray-900" : "text-gray-400"
              )}>
                {format(day, 'd')}
              </div>

              {/* セッション */}
              <div className="space-y-1">
                {daySessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    data-testid={`calendar-session-${session.id}`}
                    className={cn(
                      "text-xs p-1 rounded cursor-pointer truncate",
                      "bg-blue-100 text-blue-800 hover:bg-blue-200",
                      readOnly && "cursor-default"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!readOnly) {
                        onSessionClick(session.id);
                      }
                    }}
                  >
                    {session.startTime} {session.title}
                  </div>
                ))}
                {daySessions.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{daySessions.length - 3}件
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// WeekScheduleView コンポーネント
interface WeekScheduleViewProps {
  sessions: Session[];
  selectedDate: Date;
  onSessionClick: (sessionId: string) => void;
  onDateClick: (date: Date) => void;
  readOnly?: boolean;
}

const WeekScheduleView: React.FC<WeekScheduleViewProps> = ({
  sessions,
  selectedDate,
  onSessionClick,
  onDateClick,
  readOnly = false
}) => {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 }); // 日曜日開始
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // 時間スロット（8:00-18:00）
  const timeSlots = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00-18:00

  const getSessionsForDateTime = (date: Date, hour: number) => {
    return sessions.filter(session => {
      if (!isSameDay(new Date(session.date), date)) return false;
      
      const sessionHour = parseInt(session.startTime.split(':')[0]);
      return sessionHour === hour;
    });
  };

  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div data-testid="week-schedule-grid" className="h-full flex flex-col">
      {/* 週のヘッダー */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-center">
          {format(weekStart, 'yyyy年M月d日', { locale: ja })} - {format(addDays(weekStart, 6), 'M月d日', { locale: ja })}
        </h3>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="min-w-[800px]">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-8 gap-1 mb-2 sticky top-0 bg-white z-10">
            <div className="p-2"></div> {/* 時刻列の空白 */}
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={cn(
                  "p-2 text-center text-sm font-medium rounded cursor-pointer",
                  "bg-gray-100 text-gray-700 hover:bg-gray-200",
                  isSameDay(day, selectedDate) && "bg-blue-500 text-white"
                )}
                onClick={() => onDateClick(day)}
              >
                <div>{weekdays[index]}</div>
                <div className="text-xs">{format(day, 'M/d')}</div>
              </div>
            ))}
          </div>

          {/* 時間グリッド */}
          <div className="space-y-1">
            {timeSlots.map((hour) => (
              <div key={hour} className="grid grid-cols-8 gap-1">
                {/* 時刻ラベル */}
                <div className="p-2 text-right text-sm text-gray-600 border-r">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                
                {/* 各曜日のセッション */}
                {weekDays.map((day, dayIndex) => {
                  const dayHourSessions = getSessionsForDateTime(day, hour);
                  
                  return (
                    <div
                      key={dayIndex}
                      className="min-h-[60px] p-1 border border-gray-200 bg-gray-50 hover:bg-gray-100"
                    >
                      {dayHourSessions.map((session) => (
                        <div
                          key={session.id}
                          data-testid={`week-session-${session.id}`}
                          className={cn(
                            "text-xs p-2 rounded mb-1 cursor-pointer",
                            "bg-blue-100 text-blue-800 hover:bg-blue-200",
                            "border-l-4 border-blue-500",
                            readOnly && "cursor-default"
                          )}
                          onClick={() => {
                            if (!readOnly) {
                              onSessionClick(session.id);
                            }
                          }}
                        >
                          <div className="font-medium truncate">{session.title}</div>
                          <div className="text-gray-600">
                            {session.startTime}-{session.endTime}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// DayScheduleView コンポーネント
interface DayScheduleViewProps {
  sessions: Session[];
  selectedDate: Date;
  onSessionClick: (sessionId: string) => void;
  readOnly?: boolean;
}

const DayScheduleView: React.FC<DayScheduleViewProps> = ({
  sessions,
  selectedDate,
  onSessionClick,
  readOnly = false
}) => {
  // 選択された日のセッションのみフィルター
  const daySessionsFilter = sessions.filter(session => 
    isSameDay(new Date(session.date), selectedDate)
  );

  // 時間スロット（8:00-18:00）
  const timeSlots = Array.from({ length: 11 }, (_, i) => i + 8);

  const getSessionsForHour = (hour: number) => {
    return daySessionsFilter.filter(session => {
      const sessionHour = parseInt(session.startTime.split(':')[0]);
      return sessionHour === hour;
    });
  };

  return (
    <div data-testid="day-schedule-timeline" className="h-full flex flex-col">
      {/* 日付ヘッダー */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-center">
          {format(selectedDate, 'yyyy年M月d日 (E)', { locale: ja })}
        </h3>
        <p className="text-center text-gray-600 mt-2">
          {daySessionsFilter.length}件のセッション
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* タイムライン */}
          <div className="space-y-4">
            {timeSlots.map((hour) => {
              const hourSessions = getSessionsForHour(hour);
              
              return (
                <div key={hour} className="flex">
                  {/* 時刻ラベル */}
                  <div className="w-20 flex-shrink-0 text-right pr-4 pt-2">
                    <div className="text-lg font-medium text-gray-700">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                  </div>
                  
                  {/* セッション表示エリア */}
                  <div className="flex-1 border-l-2 border-gray-200 pl-4 min-h-[80px]">
                    <div className="space-y-2">
                      {hourSessions.length > 0 ? (
                        hourSessions.map((session) => (
                          <div
                            key={session.id}
                            data-testid={`day-session-${session.id}`}
                            className={cn(
                              "p-4 rounded-lg border-l-4 cursor-pointer transition-all",
                              "bg-blue-50 border-blue-500 hover:bg-blue-100",
                              "shadow-sm hover:shadow-md",
                              readOnly && "cursor-default"
                            )}
                            onClick={() => {
                              if (!readOnly) {
                                onSessionClick(session.id);
                              }
                            }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-lg text-gray-900">
                                {session.title}
                              </h4>
                              <Badge variant="outline" className="ml-2">
                                {session.status}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center">
                                <span className="font-medium">時間:</span>
                                <span className="ml-2">
                                  {session.startTime} - {session.endTime}
                                </span>
                              </div>
                              
                              <div className="flex items-center">
                                <span className="font-medium">会場:</span>
                                <span className="ml-2">会場 {session.venueId}</span>
                              </div>
                              
                              <div className="flex items-center">
                                <span className="font-medium">参加者:</span>
                                <span className="ml-2">
                                  {session.partIds.length}名
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 italic py-4">
                          この時間帯にセッションはありません
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// SessionEditModal コンポーネント
interface SessionEditModalProps {
  session?: Session;
  onSave: (sessionId: string, data: SessionEditData) => void;
  onCancel: () => void;
}

const SessionEditModal: React.FC<SessionEditModalProps> = ({
  session,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = React.useState({
    title: session?.title || '',
    startTime: session?.startTime || '',
    endTime: session?.endTime || '',
    venueId: session?.venueId || 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (session) {
      onSave(session.id, formData);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!session) return null;

  return (
    <div
      className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-lg font-bold mb-4">セッション編集</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* タイトル */}
        <div>
          <Label htmlFor="title">タイトル</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="セッションタイトル"
            required
          />
        </div>

        {/* 開始時間 */}
        <div>
          <Label htmlFor="startTime">開始時間</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => handleInputChange('startTime', e.target.value)}
            required
          />
        </div>

        {/* 終了時間 */}
        <div>
          <Label htmlFor="endTime">終了時間</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) => handleInputChange('endTime', e.target.value)}
            required
          />
        </div>

        {/* 会場 */}
        <div>
          <Label htmlFor="venueId">会場</Label>
          <Input
            id="venueId"
            type="number"
            value={formData.venueId}
            onChange={(e) => handleInputChange('venueId', parseInt(e.target.value))}
            min="1"
            required
          />
        </div>

        {/* ボタン */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button type="submit">
            保存
          </Button>
        </div>
      </form>
    </div>
  );
};