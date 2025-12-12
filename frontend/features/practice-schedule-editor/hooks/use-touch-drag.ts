/**
 * タッチデバイス用のドラッグ&ドロップフック
 * モバイルでHTML5 Drag and Drop APIがサポートされていないため、
 * タッチイベントを使用してドラッグ&ドロップを実現
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Session } from '../types/session-editor';
import { SessionInstructorWithDetails } from '../services/session-instructor-service';

export type DragItemType = 'session' | 'instructor';

export interface DragItem {
  type: DragItemType;
  data: Session | SessionInstructorWithDetails;
}

interface TouchDragState {
  isDragging: boolean;
  dragItem: DragItem | null;
  touchStartPos: { x: number; y: number } | null;
  currentPos: { x: number; y: number } | null;
  dragElement: HTMLElement | null;
}

interface UseTouchDragProps {
  onMoveSession: (sessionId: string, venueId: string, timeSlot: string, slotOrder: number) => void;
  onMoveInstructor: (instructorId: string, venueId: string, slotOrder: number) => void;
  timeSlots: { time: string }[];
}

export const useTouchDrag = ({ onMoveSession, onMoveInstructor, timeSlots }: UseTouchDragProps) => {
  const [state, setState] = useState<TouchDragState>({
    isDragging: false,
    dragItem: null,
    touchStartPos: null,
    currentPos: null,
    dragElement: null,
  });

  const dragCloneRef = useRef<HTMLElement | null>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ドラッグ開始
  const handleTouchStart = useCallback((
    e: React.TouchEvent,
    item: DragItem,
    element: HTMLElement
  ) => {
    // 長押しで開始するようにするため、少し待つ
    const touch = e.touches[0];
    const startPos = { x: touch.clientX, y: touch.clientY };

    setState({
      isDragging: false,
      dragItem: item,
      touchStartPos: startPos,
      currentPos: startPos,
      dragElement: element,
    });
  }, []);

  // ドラッグ中
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!state.dragItem || !state.touchStartPos) return;

    const touch = e.touches[0];
    const currentPos = { x: touch.clientX, y: touch.clientY };

    // 移動距離が一定以上になったらドラッグ開始
    const dx = currentPos.x - state.touchStartPos.x;
    const dy = currentPos.y - state.touchStartPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 10 && !state.isDragging) {
      // ドラッグ開始 - クローン要素を作成
      e.preventDefault();

      if (state.dragElement) {
        const clone = state.dragElement.cloneNode(true) as HTMLElement;
        clone.style.position = 'fixed';
        clone.style.left = `${currentPos.x - 50}px`;
        clone.style.top = `${currentPos.y - 25}px`;
        clone.style.width = `${state.dragElement.offsetWidth}px`;
        clone.style.zIndex = '9999';
        clone.style.opacity = '0.9';
        clone.style.pointerEvents = 'none';
        clone.style.transform = 'scale(1.05)';
        clone.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        document.body.appendChild(clone);
        dragCloneRef.current = clone;
      }

      setState(prev => ({
        ...prev,
        isDragging: true,
        currentPos,
      }));
    } else if (state.isDragging) {
      e.preventDefault();

      // クローン要素を移動
      if (dragCloneRef.current) {
        dragCloneRef.current.style.left = `${currentPos.x - 50}px`;
        dragCloneRef.current.style.top = `${currentPos.y - 25}px`;
      }

      setState(prev => ({
        ...prev,
        currentPos,
      }));

      // 画面端でスクロール
      const scrollContainer = document.querySelector('.overflow-x-auto');
      if (scrollContainer) {
        const rect = scrollContainer.getBoundingClientRect();
        const scrollSpeed = 10;

        if (currentPos.x < rect.left + 50) {
          scrollContainer.scrollLeft -= scrollSpeed;
        } else if (currentPos.x > rect.right - 50) {
          scrollContainer.scrollLeft += scrollSpeed;
        }
      }
    }
  }, [state]);

  // ドラッグ終了
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!state.isDragging || !state.dragItem || !state.currentPos) {
      setState({
        isDragging: false,
        dragItem: null,
        touchStartPos: null,
        currentPos: null,
        dragElement: null,
      });
      return;
    }

    // クローン要素を削除
    if (dragCloneRef.current) {
      dragCloneRef.current.remove();
      dragCloneRef.current = null;
    }

    // ドロップ先のセルを検出
    const dropTarget = document.elementFromPoint(
      state.currentPos.x,
      state.currentPos.y
    );

    if (dropTarget) {
      // 親要素を辿ってtd要素を探す
      let cell = dropTarget.closest('td');
      if (cell) {
        // data属性からvenueIdとtimeSlotを取得
        const venueId = cell.getAttribute('data-venue-id');
        const timeSlot = cell.getAttribute('data-time-slot');

        if (venueId && timeSlot) {
          const slotIndex = timeSlots.findIndex(slot => slot.time === timeSlot);
          const slotOrder = slotIndex + 1;

          if (state.dragItem.type === 'session') {
            const session = state.dragItem.data as Session;
            onMoveSession(session.id, venueId, timeSlot, slotOrder);
          } else if (state.dragItem.type === 'instructor') {
            const instructor = state.dragItem.data as SessionInstructorWithDetails;
            onMoveInstructor(instructor.id, venueId, slotOrder);
          }
        }
      }
    }

    setState({
      isDragging: false,
      dragItem: null,
      touchStartPos: null,
      currentPos: null,
      dragElement: null,
    });
  }, [state, timeSlots, onMoveSession, onMoveInstructor]);

  // ドラッグキャンセル
  const handleTouchCancel = useCallback(() => {
    if (dragCloneRef.current) {
      dragCloneRef.current.remove();
      dragCloneRef.current = null;
    }

    setState({
      isDragging: false,
      dragItem: null,
      touchStartPos: null,
      currentPos: null,
      dragElement: null,
    });
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (dragCloneRef.current) {
        dragCloneRef.current.remove();
      }
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  return {
    isDragging: state.isDragging,
    dragItem: state.dragItem,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  };
};
