/**
 * セッション編集 - タイムスロット操作サブフック
 */

import { useState, useCallback } from 'react';
import {
  TimeSlot,
  SessionEditorState,
  SessionEditorAction,
} from '../types/session-editor';
import { practiceScheduleEditorService } from '../services';
import type { PendingTimeSlotChange, PendingTimeSlotTimeEdit } from './session-editor-reducer';

export interface UseSessionEditorTimeSlotsReturn {
  updateTimeSlot: (updatedTimeSlot: TimeSlot) => void;
  addTimeSlot: () => void;
  removeTimeSlot: () => void;
  pendingTimeSlotChange: PendingTimeSlotChange | null;
  pendingTimeSlotTimeEdits: PendingTimeSlotTimeEdit[];
  resetPendingTimeSlotChanges: () => void;
}

export function useSessionEditorTimeSlots(
  state: SessionEditorState,
  dispatch: React.Dispatch<SessionEditorAction>,
  originalTimeSlotCountRef: React.MutableRefObject<number>,
): UseSessionEditorTimeSlotsReturn {
  const [pendingTimeSlotChange, setPendingTimeSlotChange] = useState<PendingTimeSlotChange | null>(null);
  const [pendingTimeSlotTimeEdits, setPendingTimeSlotTimeEdits] = useState<PendingTimeSlotTimeEdit[]>([]);

  /**
   * 時間スロットを更新（ローカルのみ）
   */
  const updateTimeSlot = useCallback((updatedTimeSlot: TimeSlot) => {
    dispatch({ type: 'UPDATE_TIME_SLOT', payload: updatedTimeSlot });

    if (!updatedTimeSlot.id) {
      return;
    }

    const normalizeTime = (value: string) => (value && value.length === 5 ? `${value}:00` : value);

    setPendingTimeSlotTimeEdits(prev => {
      const filtered = prev.filter(edit => edit.timeSlotId !== updatedTimeSlot.id);
      return [...filtered, {
        timeSlotId: updatedTimeSlot.id!,
        startTime: normalizeTime(updatedTimeSlot.start_time),
        endTime: normalizeTime(updatedTimeSlot.end_time),
      }];
    });
  }, [dispatch]);

  /**
   * タイムスロットを追加（ローカルのみ）
   */
  const addTimeSlot = useCallback(() => {
    const currentSlotCount = state.time_slots.length;

    if (currentSlotCount >= 24) {
      alert('時間スロットは最大24個までです');
      return;
    }

    const newCount = currentSlotCount + 1;

    let startTime = '09:00';
    let endTime = '17:00';
    if (state.time_slots.length > 0) {
      startTime = state.time_slots[0].time;
      const lastSlot = state.time_slots[state.time_slots.length - 1];
      endTime = lastSlot.end_time || '17:00';
    }

    const newTimeSlots = practiceScheduleEditorService.generateTimeSlots(
      startTime.includes(':') && startTime.length === 5 ? `${startTime}:00` : startTime,
      endTime.includes(':') && endTime.length === 5 ? `${endTime}:00` : endTime,
      newCount
    );

    dispatch({ type: 'SET_TIME_SLOTS', payload: newTimeSlots });

    setPendingTimeSlotChange({
      originalCount: originalTimeSlotCountRef.current,
      newCount,
    });
  }, [state.time_slots, dispatch, originalTimeSlotCountRef]);

  /**
   * タイムスロットを削除（ローカルのみ）
   */
  const removeTimeSlot = useCallback(() => {
    const currentSlotCount = state.time_slots.length;

    if (currentSlotCount <= 1) {
      alert('時間スロットは最低1個必要です');
      return;
    }

    const newCount = currentSlotCount - 1;

    let startTime = '09:00';
    let endTime = '17:00';
    if (state.time_slots.length > 0) {
      startTime = state.time_slots[0].time;
      const lastSlot = state.time_slots[state.time_slots.length - 1];
      endTime = lastSlot.end_time || '17:00';
    }

    const newTimeSlots = practiceScheduleEditorService.generateTimeSlots(
      startTime.includes(':') && startTime.length === 5 ? `${startTime}:00` : startTime,
      endTime.includes(':') && endTime.length === 5 ? `${endTime}:00` : endTime,
      newCount
    );

    dispatch({ type: 'SET_TIME_SLOTS', payload: newTimeSlots });

    setPendingTimeSlotChange({
      originalCount: originalTimeSlotCountRef.current,
      newCount,
    });
  }, [state.time_slots, dispatch, originalTimeSlotCountRef]);

  const resetPendingTimeSlotChanges = useCallback(() => {
    setPendingTimeSlotChange(null);
    setPendingTimeSlotTimeEdits([]);
  }, []);

  return {
    updateTimeSlot,
    addTimeSlot,
    removeTimeSlot,
    pendingTimeSlotChange,
    pendingTimeSlotTimeEdits,
    resetPendingTimeSlotChanges,
  };
}
