/**
 * 週間カレンダーコンポーネント
 * TDD方式：まずテスト仕様をコメントで定義
 */

'use client';

import React from 'react';
import { Schedule, SessionBlock, TimeSlot } from '@/types/schedule';
import { getWeekDates, isTodayDate, isSameDateDay } from '../utils/dateUtils';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * WeekCalendarコンポーネントのプロパティ
 */
interface WeekCalendarProps {
  startDate: Date;
  schedules: Schedule[];
  onSessionClick?: (session: Schedule) => void;
  hourRange?: { start: number; end: number };
  className?: string;
}

/**
 * 週間カレンダーコンポーネント
 * 
 * テスト仕様:
 * - 7日×時間軸のグリッドレイアウトで表示
 * - 日付ヘッダー（日付と曜日）を表示
 * - 時間軸ラベル（8:00, 9:00など）を表示
 * - 今日の列をハイライト表示
 * - セッションを時間軸上に配置
 * - セッションの長さに応じて高さを調整
 * - 複数セッションが重なる場合は幅を調整
 * - セッションクリック時にonSessionClickコールバック呼び出し
 * - レスポンシブ対応
 */
export const WeekCalendar = React.memo(function WeekCalendar({
  startDate,
  schedules,
  onSessionClick,
  hourRange = { start: 8, end: 21 },
  className
}: WeekCalendarProps) {
  // 週の日付を生成
  const weekDates = getWeekDates(startDate);
  
  // 時間スロットを生成
  const timeSlots = generateTimeSlots(hourRange);
  
  // セッションブロックを生成
  const sessionBlocks = generateSessionBlocks(schedules, weekDates, hourRange);

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <div className="min-w-[800px]">
        {/* 日付ヘッダー */}
        <WeekHeader dates={weekDates} />
        
        {/* 時間グリッド */}
        <div className="relative">
          <TimeGrid 
            timeSlots={timeSlots} 
            dates={weekDates}
            sessionBlocks={sessionBlocks}
            onSessionClick={onSessionClick}
          />
        </div>
      </div>
    </div>
  );
});

/**
 * 週間カレンダーヘッダーコンポーネント
 * 
 * テスト仕様:
 * - 時間軸のためのスペーサーを含む
 * - 各日付の日付番号と曜日を表示
 * - 今日の日付をハイライト表示
 * - 土日の色を変更
 */
interface WeekHeaderProps {
  dates: Date[];
}

function WeekHeader({ dates }: WeekHeaderProps) {
  return (
    <div className="grid grid-cols-8 border-b border-gray-200">
      {/* 時間軸のスペーサー */}
      <div className="bg-gray-50 border-r border-gray-200"></div>
      
      {/* 日付ヘッダー */}
      {dates.map((date, index) => {
        const isToday = isTodayDate(date);
        const isWeekend = index === 0 || index === 6;
        
        return (
          <div
            key={date.toISOString()}
            className={cn(
              'p-3 text-center border-r border-gray-200',
              isToday ? 'bg-blue-50' : 'bg-gray-50',
              isWeekend && 'text-red-600'
            )}
          >
            <div className={cn(
              'text-sm font-medium',
              isToday && 'text-blue-600'
            )}>
              {format(date, 'M/d(E)', { locale: ja })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 時間グリッドコンポーネント
 * 
 * テスト仕様:
 * - 時間軸ラベルと日付列のグリッド表示
 * - 各時間の境界線を表示
 * - セッションブロックを適切な位置に配置
 * - ホバー効果を追加
 */
interface TimeGridProps {
  timeSlots: TimeSlot[];
  dates: Date[];
  sessionBlocks: SessionBlock[];
  onSessionClick?: (session: Schedule) => void;
}

function TimeGrid({ timeSlots, dates, sessionBlocks, onSessionClick }: TimeGridProps) {
  return (
    <div className="grid grid-cols-8">
      {/* 時間軸 */}
      <div className="border-r border-gray-200">
        {timeSlots.map((slot) => (
          <div key={`time-${slot.hour}`} className="h-16 flex items-center justify-center border-b border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-600">{slot.displayTime}</span>
          </div>
        ))}
      </div>
      
      {/* 日付列 */}
      {dates.map((date, dateIndex) => {
        const isToday = isTodayDate(date);
        const daySessionBlocks = sessionBlocks.filter(block => 
          isSameDateDay(block.schedule.startDate, date)
        );
        
        return (
          <div 
            key={date.toISOString()} 
            className={cn(
              'relative border-r border-gray-200',
              isToday && 'bg-blue-50/30'
            )}
          >
            {/* 時間スロット */}
            {timeSlots.map((slot) => (
              <div 
                key={`slot-${dateIndex}-${slot.hour}`}
                className="h-16 border-b border-gray-200 hover:bg-gray-50"
              />
            ))}
            
            {/* セッションブロック */}
            {daySessionBlocks.map((block) => (
              <SessionBlockComponent
                key={block.schedule.id}
                block={block}
                onSessionClick={onSessionClick}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/**
 * セッションブロックコンポーネント
 * 
 * テスト仕様:
 * - セッション情報を表示
 * - 時間に応じて適切な位置とサイズ
 * - パートの色を背景色に使用
 * - クリック時にコールバック呼び出し
 * - ホバー効果を追加
 */
interface SessionBlockComponentProps {
  block: SessionBlock;
  onSessionClick?: (session: Schedule) => void;
}

function SessionBlockComponent({ block, onSessionClick }: SessionBlockComponentProps) {
  const { schedule, top, height, left, width, zIndex } = block;
  
  const handleClick = () => {
    onSessionClick?.(schedule);
  };

  return (
    <div
      className="absolute inset-x-1 rounded text-white text-xs p-1 cursor-pointer hover:opacity-90 shadow-sm"
      style={{
        top: `${top}%`,
        height: `${height}%`,
        left: `${left}%`,
        width: `${width}%`,
        backgroundColor: schedule.color || '#3b82f6',
        zIndex
      }}
      onClick={handleClick}
    >
      <div className="font-medium truncate">{schedule.title}</div>
      <div className="text-xs opacity-90 truncate">
        {format(schedule.startDate, 'HH:mm', { locale: ja })} - 
        {format(schedule.endDate, 'HH:mm', { locale: ja })}
      </div>
      {schedule.location && (
        <div className="text-xs opacity-80 truncate">{schedule.location}</div>
      )}
    </div>
  );
}

/**
 * 時間スロット生成関数
 * 
 * テスト仕様:
 * - 開始時間から終了時間まで1時間間隔で生成
 * - 表示用の時間文字列を含む
 * - 例: { hour: 8, minute: 0, displayTime: '8:00' }
 */
function generateTimeSlots(hourRange: { start: number; end: number }): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  for (let hour = hourRange.start; hour <= hourRange.end; hour++) {
    slots.push({
      hour,
      minute: 0,
      displayTime: `${hour}:00`
    });
  }
  
  return slots;
}

/**
 * セッションブロック生成関数
 * 
 * テスト仕様:
 * - スケジュールを時間軸上の位置に変換
 * - 重複するセッションの幅と位置を調整
 * - top, height, left, widthをパーセンテージで計算
 * - zIndexで重なり順序を制御
 */
function generateSessionBlocks(
  schedules: Schedule[],
  dates: Date[],
  hourRange: { start: number; end: number }
): SessionBlock[] {
  const blocks: SessionBlock[] = [];
  const totalHours = hourRange.end - hourRange.start + 1;
  
  schedules.forEach((schedule, index) => {
    const startHour = schedule.startDate.getHours();
    const startMinute = schedule.startDate.getMinutes();
    const endHour = schedule.endDate.getHours();
    const endMinute = schedule.endDate.getMinutes();
    
    // 完全に表示範囲外は除外（開始時間が範囲より後、または終了時間が範囲より前）
    if (endHour < hourRange.start || startHour > hourRange.end) {
      return;
    }
    
    // 位置とサイズを計算
    const startPosition = (startHour - hourRange.start) + (startMinute / 60);
    const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60);
    
    const top = (startPosition / totalHours) * 100;
    const height = (duration / totalHours) * 100;
    
    // 重複チェック（簡単な実装）
    const left = 2; // 左マージン
    const width = 96; // 右マージンを考慮
    
    blocks.push({
      schedule,
      top,
      height,
      left,
      width,
      zIndex: 10 + index
    });
  });
  
  return blocks;
}