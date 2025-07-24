/**
 * カレンダービューメインコンポーネント
 * TDD方式：まずテスト仕様をコメントで定義
 */

'use client';

import React, { useState } from 'react';
import { CalendarViewMode, DateRange, Schedule } from '@/types/schedule';
import { MonthCalendar } from '../components/MonthCalendar';
import { WeekCalendar } from '../components/WeekCalendar';
import { useCalendarData } from '../hooks/useCalendarData';
import { getMonthRange, getWeekRange, formatMonthTitle, formatWeekTitle } from '../utils/dateUtils';
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
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
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
    // 簡単な実装：詳細をアラートで表示
    alert(`セッション詳細:\n${session.title}\n${session.startDate.toLocaleString()} - ${session.endDate.toLocaleString()}\n場所: ${session.location || '未設定'}`);
  };

  // タイトルの生成
  const title = viewMode === 'month'
    ? formatMonthTitle(currentDate)
    : formatWeekTitle(dateRange.start, dateRange.end);

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* タイトルとナビゲーション */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h1 className="text-xl font-semibold min-w-[200px] text-center">
            {title}
          </h1>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* コントロールボタン */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleToday}
            disabled={isLoading}
          >
            今日
          </Button>
          
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('month')}
              disabled={isLoading}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              月
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('week')}
              disabled={isLoading}
              className="rounded-l-none"
            >
              <Calendar className="h-4 w-4 mr-1" />
              週
            </Button>
          </div>
        </div>
      </div>

      {/* ローディング・エラー表示 */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="text-gray-500">読み込み中...</div>
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
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {viewMode === 'month' ? (
            <MonthCalendar
              date={currentDate}
              schedules={schedules}
              onDateClick={handleDateClick}
              onSessionClick={handleSessionClick}
              selectedDate={selectedDate}
              highlightToday={true}
            />
          ) : (
            <WeekCalendar
              startDate={dateRange.start}
              schedules={schedules}
              onSessionClick={handleSessionClick}
            />
          )}
        </div>
      )}

      {/* スケジュール統計 */}
      {!isLoading && !error && schedules.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">
            表示期間内のスケジュール: {schedules.length}件
            {partId && (
              <span className="ml-2">
                （パート: {schedules[0]?.partName || `ID ${partId}`}）
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}