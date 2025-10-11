/**
 * 時間スロット計算用のカスタムフック
 */

import { useMemo } from 'react';
import { TimeSlot } from '../types/session-editor';
import { TIME_SLOTS } from '../constants';
import { generateTimeSlots } from '../mappers/time-slot-mapper';

/**
 * 時間スロット計算用のカスタムフック
 */
export const useTimeSlotCalculation = (startTime: string, endTime: string) => {
  /**
   * 時間スロットを計算
   */
  const timeSlots = useMemo(() => {
    return generateTimeSlots(startTime, endTime);
  }, [startTime, endTime]);

  /**
   * 時間スロットの総数を取得
   */
  const totalSlots = useMemo(() => {
    return timeSlots.length;
  }, [timeSlots]);

  /**
   * 指定した時間のスロットインデックスを取得
   */
  const getSlotIndex = useMemo(() => {
    return (time: string): number => {
      return timeSlots.findIndex(slot => slot.time === time);
    };
  }, [timeSlots]);

  /**
   * 指定したインデックスの時間スロットを取得
   */
  const getSlotByIndex = useMemo(() => {
    return (index: number): TimeSlot | undefined => {
      return timeSlots[index];
    };
  }, [timeSlots]);

  /**
   * 時間範囲内のスロットを取得
   */
  const getSlotsInRange = useMemo(() => {
    return (fromTime: string, toTime: string): TimeSlot[] => {
      const fromIndex = getSlotIndex(fromTime);
      const toIndex = getSlotIndex(toTime);
      
      if (fromIndex === -1 || toIndex === -1) {
        return [];
      }
      
      return timeSlots.slice(fromIndex, toIndex + 1);
    };
  }, [timeSlots, getSlotIndex]);

  /**
   * 次の時間スロットを取得
   */
  const getNextSlot = useMemo(() => {
    return (currentTime: string): TimeSlot | undefined => {
      const currentIndex = getSlotIndex(currentTime);
      if (currentIndex === -1 || currentIndex >= timeSlots.length - 1) {
        return undefined;
      }
      return timeSlots[currentIndex + 1];
    };
  }, [timeSlots, getSlotIndex]);

  /**
   * 前の時間スロットを取得
   */
  const getPreviousSlot = useMemo(() => {
    return (currentTime: string): TimeSlot | undefined => {
      const currentIndex = getSlotIndex(currentTime);
      if (currentIndex <= 0) {
        return undefined;
      }
      return timeSlots[currentIndex - 1];
    };
  }, [timeSlots, getSlotIndex]);

  return {
    timeSlots,
    totalSlots,
    getSlotIndex,
    getSlotByIndex,
    getSlotsInRange,
    getNextSlot,
    getPreviousSlot,
  };
};
