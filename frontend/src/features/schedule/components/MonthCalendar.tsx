/**
 * 月間カレンダーコンポーネント
 * TDD方式：まずテスト仕様をコメントで定義
 */

'use client';

import React from 'react';
import { Schedule, CalendarCellData } from '@/types/schedule';
import { getMonthDates, isTodayDate, isSameDateDay, isWeekendDate } from '../utils/dateUtils';
import { cn } from '@/lib/utils';

/**
 * MonthCalendarコンポーネントのプロパティ
 */
interface MonthCalendarProps {
  date: Date;
  schedules: Schedule[];
  onDateClick: (date: Date) => void;
  onSessionClick?: (session: Schedule) => void;
  highlightToday?: boolean;
  selectedDate?: Date;
  className?: string;
}

/**
 * 月間カレンダーコンポーネント
 * 
 * テスト仕様:
 * - 6週間×7日のグリッドレイアウトで表示
 * - 曜日ヘッダー（日月火水木金土）を表示
 * - 今日の日付をハイライト表示
 * - 選択された日付をハイライト表示
 * - 当月以外の日付はグレーアウト
 * - 週末（土日）は色を変更
 * - 各日付セルにスケジュール数を表示
 * - 日付クリック時にonDateClickコールバック呼び出し
 * - スケジュールクリック時にonSessionClickコールバック呼び出し
 */
export const MonthCalendar = React.memo(function MonthCalendar({
  date,
  schedules,
  onDateClick,
  onSessionClick,
  highlightToday = true,
  selectedDate,
  className
}: MonthCalendarProps) {
  // 月のカレンダー日付を生成
  const monthDates = getMonthDates(date);
  
  // セルデータを生成
  const cellData = generateCellData(monthDates, schedules, date, selectedDate, highlightToday);

  return (
    <div className={cn('w-full', className)}>
      {/* 曜日ヘッダー */}
      <MonthHeader />
      
      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-0 border border-gray-200">
        {cellData.map((cell, index) => (
          <CalendarCell
            key={`${cell.date.toISOString()}-${index}`}
            data={cell}
            onDateClick={onDateClick}
            onSessionClick={onSessionClick}
          />
        ))}
      </div>
    </div>
  );
});

/**
 * 月間カレンダーヘッダーコンポーネント
 * 
 * テスト仕様:
 * - 曜日（日月火水木金土）を表示
 * - 日曜日と土曜日は色を変更
 * - レスポンシブ対応
 */
function MonthHeader() {
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  
  return (
    <div className="grid grid-cols-7 border-b border-gray-200">
      {weekdays.map((day, index) => (
        <div
          key={day}
          className={cn(
            'p-2 text-center text-sm font-medium',
            index === 0 ? 'text-red-600' : '', // 日曜日
            index === 6 ? 'text-blue-600' : '', // 土曜日
            'bg-gray-50'
          )}
        >
          {day}
        </div>
      ))}
    </div>
  );
}

/**
 * カレンダーセルコンポーネント
 * 
 * テスト仕様:
 * - 日付番号を表示
 * - 今日の場合は背景色を変更
 * - 選択日の場合は枠線を表示
 * - 当月以外の日付はグレーアウト
 * - 週末は文字色を変更
 * - スケジュール数をバッジで表示
 * - クリック時に適切なコールバックを呼び出し
 */
interface CalendarCellProps {
  data: CalendarCellData;
  onDateClick: (date: Date) => void;
  onSessionClick?: (session: Schedule) => void;
}

function CalendarCell({ data, onDateClick, onSessionClick }: CalendarCellProps) {
  const {
    date,
    isToday,
    isSelected,
    isCurrentMonth,
    isWeekend,
    schedules
  } = data;

  const dayNumber = date.getDate();
  const hasSchedules = schedules.length > 0;

  const handleDateClick = () => {
    onDateClick(date);
  };

  const handleSessionClick = (e: React.MouseEvent, session: Schedule) => {
    e.stopPropagation();
    onSessionClick?.(session);
  };

  return (
    <div
      className={cn(
        'min-h-[80px] p-1 border-r border-b border-gray-200 cursor-pointer hover:bg-gray-50',
        isToday && 'bg-blue-50',
        isSelected && 'ring-2 ring-blue-500',
        !isCurrentMonth && 'bg-gray-100 text-gray-400'
      )}
      onClick={handleDateClick}
    >
      {/* 日付番号 */}
      <div
        className={cn(
          'text-sm font-medium mb-1',
          isWeekend && isCurrentMonth && 'text-red-600',
          isToday && 'text-blue-600 font-bold'
        )}
      >
        {dayNumber}
      </div>
      
      {/* スケジュール表示 */}
      {hasSchedules && (
        <div className="space-y-1">
          {schedules.slice(0, 2).map((schedule) => (
            <div
              key={schedule.id}
              className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
              style={{ backgroundColor: schedule.color || '#3b82f6' }}
              onClick={(e) => handleSessionClick(e, schedule)}
            >
              <span className="text-white">{schedule.title}</span>
            </div>
          ))}
          {schedules.length > 2 && (
            <div className="text-xs text-gray-500 text-center">
              +{schedules.length - 2}件
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * セルデータ生成関数
 * 
 * テスト仕様:
 * - 各日付のCalendarCellDataを生成
 * - 今日、選択日、当月、週末の判定を含む
 * - 該当日のスケジュールをフィルタリング
 */
function generateCellData(
  dates: Date[],
  schedules: Schedule[],
  currentMonth: Date,
  selectedDate?: Date,
  highlightToday?: boolean
): CalendarCellData[] {
  return dates.map(date => {
    // その日のスケジュールを抽出
    const daySchedules = schedules.filter(schedule => 
      isSameDateDay(schedule.startDate, date)
    );

    return {
      date,
      isToday: highlightToday ? isTodayDate(date) : false,
      isSelected: selectedDate ? isSameDateDay(date, selectedDate) : false,
      isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
      isWeekend: isWeekendDate(date),
      schedules: daySchedules
    };
  });
}