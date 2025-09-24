/**
 * 時間スロット関連のマッパー
 */

import { TimeSlot } from '../types/session-editor';
import { TIME_SLOTS } from '../constants';

/**
 * 時間範囲から時間スロットを生成
 * @param startTime - 開始時間 (HH:MM形式)
 * @param endTime - 終了時間 (HH:MM形式)
 * @returns 時間スロット一覧
 */
export const generateTimeSlots = (startTime: string, endTime: string): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  
  // 開始時間と終了時間を分に変換
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  // 30分間隔で時間スロットを生成
  for (let minutes = startMinutes; minutes < endMinutes; minutes += TIME_SLOTS.INTERVAL_MINUTES) {
    const timeString = minutesToTime(minutes);
    const nextMinutes = Math.min(minutes + TIME_SLOTS.INTERVAL_MINUTES, endMinutes);
    const nextTimeString = minutesToTime(nextMinutes);
    
    slots.push({
      time: timeString,
      start_time: timeString,
      end_time: nextTimeString,
      display_time: `${timeString}-${nextTimeString}`,
    });
  }
  
  return slots;
};

/**
 * 時間文字列を分に変換
 * @param timeString - 時間文字列 (HH:MM形式)
 * @returns 分
 */
export const timeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * 分を時間文字列に変換
 * @param minutes - 分
 * @returns 時間文字列 (HH:MM形式)
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * 時間スロットをソート
 * @param timeSlots - 時間スロット一覧
 * @returns ソートされた時間スロット一覧
 */
export const sortTimeSlots = (timeSlots: TimeSlot[]): TimeSlot[] => {
  return [...timeSlots].sort((a, b) => {
    const aMinutes = timeToMinutes(a.time);
    const bMinutes = timeToMinutes(b.time);
    return aMinutes - bMinutes;
  });
};

/**
 * 時間スロットの表示名を生成
 * @param timeSlot - 時間スロット
 * @returns 表示名
 */
export const formatTimeSlotDisplay = (timeSlot: TimeSlot): string => {
  return timeSlot.display_time || `${timeSlot.start_time}-${timeSlot.end_time}`;
};
