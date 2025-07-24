/**
 * 日付操作ユーティリティ関数
 * TDD方式：まずテスト仕様をコメントで定義
 */

import { DateRange } from '@/types/schedule';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isToday, isWeekend as isWeekendFns } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 月カレンダーに表示する日付配列を取得
 * 
 * テスト仕様:
 * - input: new Date(2024, 0, 15) // 2024年1月15日
 * - expected: 42個の日付配列（6週間 × 7日）
 * - 前月の末尾日付を含む（12/31など）
 * - 翌月の先頭日付を含む（2/1など）
 * - 日曜日始まりで配列が構成される
 */
export function getMonthDates(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // 日曜日始まり
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const dates: Date[] = [];
  let currentDate = calendarStart;
  
  // 6週間分（42日）の日付を生成
  while (currentDate <= calendarEnd) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }
  
  // 42日に満たない場合は追加で日付を生成
  while (dates.length < 42) {
    dates.push(addDays(dates[dates.length - 1], 1));
  }
  
  return dates;
}

/**
 * 週カレンダーに表示する日付配列を取得
 * 
 * テスト仕様:
 * - input: new Date(2024, 0, 15) // 2024年1月15日（月曜日）
 * - expected: 7個の日付配列（その週の日曜日〜土曜日）
 * - [2024/1/14(日), 2024/1/15(月), ..., 2024/1/20(土)]
 */
export function getWeekDates(startDate: Date): Date[] {
  const weekStart = startOfWeek(startDate, { weekStartsOn: 0 }); // 日曜日始まり
  const dates: Date[] = [];
  
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(weekStart, i));
  }
  
  return dates;
}

/**
 * 月の開始日と終了日を取得
 * 
 * テスト仕様:
 * - input: new Date(2024, 0, 15) // 2024年1月15日
 * - expected: { start: 2024/1/1, end: 2024/1/31 }
 * - 時間は00:00:00と23:59:59に設定される
 */
export function getMonthRange(date: Date): DateRange {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  
  return { start, end };
}

/**
 * 週の開始日と終了日を取得
 * 
 * テスト仕様:
 * - input: new Date(2024, 0, 15) // 2024年1月15日（月曜日）
 * - expected: { start: 2024/1/14 00:00:00, end: 2024/1/20 23:59:59 }
 * - 日曜日始まりの週として計算
 */
export function getWeekRange(date: Date): DateRange {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  
  return { start, end };
}

/**
 * 月表示用のタイトルをフォーマット
 * 
 * テスト仕様:
 * - input: new Date(2024, 0, 15)
 * - expected: "2024年1月"
 * - 日本語ロケールを使用
 */
export function formatMonthTitle(date: Date): string {
  return format(date, 'yyyy年M月', { locale: ja });
}

/**
 * 週表示用のタイトルをフォーマット
 * 
 * テスト仕様:
 * - input: startDate: new Date(2024, 0, 14), endDate: new Date(2024, 0, 20)
 * - expected: "2024年1月14日 - 1月20日"
 * - 同一年月の場合は年月を省略
 * - 跨月の場合は "12月25日 - 1月7日" のように表示
 */
export function formatWeekTitle(startDate: Date, endDate: Date): string {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const startMonth = startDate.getMonth();
  const endMonth = endDate.getMonth();
  
  if (startYear === endYear && startMonth === endMonth) {
    // 同一年月の場合
    return `${format(startDate, 'yyyy年M月d日', { locale: ja })} - ${format(endDate, 'd日', { locale: ja })}`;
  } else if (startYear === endYear) {
    // 同一年、異なる月の場合
    return `${format(startDate, 'M月d日', { locale: ja })} - ${format(endDate, 'M月d日', { locale: ja })}`;
  } else {
    // 異なる年の場合
    return `${format(startDate, 'yyyy年M月d日', { locale: ja })} - ${format(endDate, 'yyyy年M月d日', { locale: ja })}`;
  }
}

/**
 * 指定日が今日かどうかを判定
 * 
 * テスト仕様:
 * - input: new Date() // 今日の日付
 * - expected: true
 * - input: new Date(2024, 0, 1) // 過去の日付
 * - expected: false
 */
export function isTodayDate(date: Date): boolean {
  return isToday(date);
}

/**
 * 2つの日付が同じ日かどうかを判定
 * 
 * テスト仕様:
 * - input: new Date(2024, 0, 15, 10, 30), new Date(2024, 0, 15, 14, 45)
 * - expected: true (時間が違っても同じ日)
 * - input: new Date(2024, 0, 15), new Date(2024, 0, 16)
 * - expected: false
 */
export function isSameDateDay(date1: Date, date2: Date): boolean {
  return isSameDay(date1, date2);
}

/**
 * 指定日が週末かどうかを判定
 * 
 * テスト仕様:
 * - input: new Date(2024, 0, 13) // 土曜日
 * - expected: true
 * - input: new Date(2024, 0, 14) // 日曜日
 * - expected: true
 * - input: new Date(2024, 0, 15) // 月曜日
 * - expected: false
 */
export function isWeekendDate(date: Date): boolean {
  return isWeekendFns(date);
}