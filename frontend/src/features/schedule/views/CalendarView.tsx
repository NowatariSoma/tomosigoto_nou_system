/**
 * カレンダービューメインコンポーネント
 * TDD方式：まずテスト仕様をコメントで定義
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CalendarViewMode, DateRange, Schedule } from '@/types/schedule';
import { MonthCalendar } from '../components/MonthCalendar';
import { WeekCalendar } from '../components/WeekCalendar';
import { useCalendarData } from '../hooks/useCalendarData';
import { getMonthRange, getWeekRange, formatMonthTitle, formatWeekTitle } from '../utils/dateUtils';
import { addMonths, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * CalendarViewコンポーネントのプロパティ
 */
interface CalendarViewProps {
  initialDate?: Date;
  initialViewMode?: CalendarViewMode;
  partId?: number;
  className?: string;
}

/**
 * カレンダービューメインコンポーネント
 * 
 * テスト仕様:
 * - 初期表示は月間カレンダー
 * - 月間/週間の切り替えボタンを表示
 * - 前後ナビゲーションボタンを表示
 * - 今日ボタンでカレンダーを今日の月/週に移動
 * - 現在の表示範囲をタイトルに表示
 * - データ取得中はローディング表示
 * - エラー時はエラーメッセージ表示
 * - セッションクリック時に詳細表示（今回は簡単なアラート）
 * - 日付クリック時に該当日を選択
 */
export function CalendarView({
  initialDate = new Date(),
  initialViewMode = 'month',
  partId,
  className
}: CalendarViewProps) {
  // 状態管理
  const [viewMode, setViewMode] = useState<CalendarViewMode>(initialViewMode);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date>();

  // 表示範囲の計算
  const dateRange = viewMode === 'month' 
    ? getMonthRange(currentDate)
    : getWeekRange(currentDate);

  // データ取得
  const { data: schedules, isLoading, error, refetch } = useCalendarData({
    dateRange,
    partId,
    viewMode
  });

  // イベントハンドラ
  const handleViewModeChange = (mode: CalendarViewMode) => {
    setViewMode(mode);
  };

  const handlePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, -1));
    } else {
      setCurrentDate(addDays(currentDate, -7));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSessionClick = (session: Schedule) => {
    // セッションの詳細表示（将来的にモーダルに置き換え予定）
    const startTime = session.startDate.toLocaleString('ja-JP', { 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const endTime = session.endDate.toLocaleString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const message = [
      `📅 ${session.title}`,
      `⏰ ${startTime} - ${endTime}`,
      `📍 ${session.location || '場所未設定'}`,
      session.partName ? `🎵 ${session.partName}` : ''
    ].filter(Boolean).join('\n');
    
    alert(message);
  };

  // キーボードナビゲーション
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (isLoading) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        handlePrevious();
        break;
      case 'ArrowRight':
        event.preventDefault();
        handleNext();
        break;
      case 'Home':
        event.preventDefault();
        handleToday();
        break;
      case 'm':
      case 'M':
        if (!event.metaKey && !event.ctrlKey) {
          event.preventDefault();
          setViewMode('month');
        }
        break;
      case 'w':
      case 'W':
        if (!event.metaKey && !event.ctrlKey) {
          event.preventDefault();
          setViewMode('week');
        }
        break;
    }
  }, [isLoading, handlePrevious, handleNext, handleToday]);

  // キーボードイベントの追加・削除
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // タイトルの生成
  const title = viewMode === 'month'
    ? formatMonthTitle(currentDate)
    : formatWeekTitle(dateRange.start, dateRange.end);

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* タイトルとナビゲーション */}
        <div className="flex items-center justify-between sm:justify-start space-x-2 sm:space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={isLoading}
            aria-label="前の期間へ（←キー）"
            className="flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h1 className="text-lg sm:text-xl font-semibold text-center flex-1 sm:min-w-[200px]">
            {title}
          </h1>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={isLoading}
            aria-label="次の期間へ（→キー）"
            className="flex-shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* コントロールボタン */}
        <div className="flex items-center justify-center sm:justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handleToday}
            disabled={isLoading}
            aria-label="今日へ移動（Homeキー）"
            className="text-sm"
          >
            今日
          </Button>
          
          <div className="flex border rounded-md" role="tablist" aria-label="カレンダー表示モード">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('month')}
              disabled={isLoading}
              className="rounded-r-none text-sm"
              role="tab"
              aria-selected={viewMode === 'month'}
              aria-label="月間表示（Mキー）"
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              <span className="hidden xs:inline">月</span>
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('week')}
              disabled={isLoading}
              className="rounded-l-none text-sm"
              role="tab"
              aria-selected={viewMode === 'week'}
              aria-label="週間表示（Wキー）"
            >
              <Calendar className="h-4 w-4 mr-1" />
              <span className="hidden xs:inline">週</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ローディング・エラー表示 */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="relative">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <div className="text-gray-600 text-sm">カレンダーデータを読み込み中...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 font-medium">エラーが発生しました</div>
          <div className="text-red-600 text-sm mt-1">{error.message}</div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => refetch()}
          >
            再試行
          </Button>
        </div>
      )}

      {/* カレンダー表示 */}
      {!isLoading && !error && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          {viewMode === 'month' ? (
            <MonthCalendar
              date={currentDate}
              schedules={schedules}
              onDateClick={handleDateClick}
              onSessionClick={handleSessionClick}
              selectedDate={selectedDate}
              highlightToday={true}
              className="w-full"
            />
          ) : (
            <WeekCalendar
              startDate={dateRange.start}
              schedules={schedules}
              onSessionClick={handleSessionClick}
              className="w-full"
            />
          )}
        </div>
      )}

      {/* スケジュール統計 */}
      {!isLoading && !error && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-sm text-gray-600">
              {schedules.length > 0 ? (
                <>
                  📅 表示期間内のスケジュール: <span className="font-medium">{schedules.length}件</span>
                  {partId && schedules[0]?.partName && (
                    <span className="ml-2 text-blue-600">
                      🎵 {schedules[0].partName}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-500">この期間にはスケジュールがありません</span>
              )}
            </div>
            
            {schedules.length > 0 && (
              <div className="text-xs text-gray-500 flex items-center gap-4">
                <span>⌨️ キーボード操作: ←→ 移動 | M 月表示 | W 週表示 | Home 今日</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}