import { useState, useCallback } from 'react';
import { GeneratedSchedule, SessionDropData, DropTarget } from '../types/generatedSchedule';

interface DragPreview {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const useScheduleDrag = (
  schedule: GeneratedSchedule,
  onDrop: (sessionId: string, newData: SessionDropData) => void
) => {
  const [draggedSession, setDraggedSession] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);

  const startDrag = useCallback((sessionId: string) => {
    // セッションが存在するかチェック
    const session = schedule.sessions.find(s => s.id === sessionId);
    if (!session) return;

    // 既にドラッグ中の場合は開始しない
    if (draggedSession) return;

    setDraggedSession(sessionId);
  }, [schedule.sessions, draggedSession]);

  const updateDragPosition = useCallback((x: number, y: number) => {
    if (!draggedSession) return;

    // 標準的なセッションアイテムのサイズを仮定
    const defaultWidth = 200;
    const defaultHeight = 60;

    setDragPreview({
      x,
      y,
      width: defaultWidth,
      height: defaultHeight,
    });
  }, [draggedSession]);

  const endDrag = useCallback((dropTarget: DropTarget | null) => {
    if (!draggedSession) return;

    if (dropTarget && dropTarget.isValid) {
      // ドロップターゲットの情報から新しいセッションデータを生成
      const newData: SessionDropData = {
        date: dropTarget.date,
        startTime: `${dropTarget.hour.toString().padStart(2, '0')}:00`,
        endTime: `${(dropTarget.hour + 1).toString().padStart(2, '0')}:00`,
        venueId: dropTarget.venueId,
      };

      onDrop(draggedSession, newData);
    }

    // ドラッグ状態をリセット
    setDraggedSession(null);
    setDragPreview(null);
  }, [draggedSession, onDrop]);

  const isValidDropTarget = useCallback((target: DropTarget) => {
    if (!target.isValid) return false;

    // 同じ時間帯に同じ会場で他のセッションがないかチェック
    const conflictingSessions = schedule.sessions.filter(session => {
      if (session.id === draggedSession) return false; // 自分自身は除外

      const sessionDate = new Date(session.date);
      const targetDate = new Date(target.date);
      
      // 日付が異なる場合は競合しない
      if (sessionDate.toDateString() !== targetDate.toDateString()) return false;

      // 会場が異なる場合は競合しない
      if (session.venueId !== target.venueId) return false;

      // 時間の重複チェック
      const sessionStartHour = parseInt(session.startTime.split(':')[0]);
      const sessionEndHour = parseInt(session.endTime.split(':')[0]);

      return (
        (target.hour >= sessionStartHour && target.hour < sessionEndHour) ||
        (target.hour + 1 > sessionStartHour && target.hour + 1 <= sessionEndHour)
      );
    });

    return conflictingSessions.length === 0;
  }, [schedule.sessions, draggedSession]);

  const isDragInProgress = draggedSession !== null;

  return {
    draggedSession,
    dragPreview,
    startDrag,
    updateDragPosition,
    endDrag,
    isDragInProgress,
    isValidDropTarget,
  };
};