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
  dragElement: HTMLElement | null;
  // タッチ位置と要素左上からの相対オフセット
  touchOffset: { x: number; y: number } | null;
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
    dragElement: null,
    touchOffset: null,
  });

  const dragCloneRef = useRef<HTMLElement | null>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // パフォーマンス最適化: 現在位置はrefで管理し、再レンダリングを防ぐ
  const currentPosRef = useRef<{ x: number; y: number } | null>(null);
  // refでstate値をキャッシュし、コールバック内で最新値にアクセス
  const stateRef = useRef(state);
  stateRef.current = state;

  // ドラッグ開始
  const handleTouchStart = useCallback((
    e: React.TouchEvent,
    item: DragItem,
    element: HTMLElement
  ) => {
    // テキスト選択を防ぐ
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    const startPos = { x: touch.clientX, y: touch.clientY };

    // タッチ位置と要素左上からの相対オフセットを計算
    const rect = element.getBoundingClientRect();
    const touchOffset = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };

    // 現在位置をrefに保存
    currentPosRef.current = startPos;

    setState({
      isDragging: false,
      dragItem: item,
      touchStartPos: startPos,
      dragElement: element,
      touchOffset,
    });
  }, []);

  // ドラッグ中 - パフォーマンス最適化: setStateを呼ばずDOM操作のみ
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const currentState = stateRef.current;
    if (!currentState.dragItem || !currentState.touchStartPos) return;

    const touch = e.touches[0];
    const currentPos = { x: touch.clientX, y: touch.clientY };

    // 現在位置をrefに保存（再レンダリングなし）
    currentPosRef.current = currentPos;

    // 移動距離が一定以上になったらドラッグ開始
    const dx = currentPos.x - currentState.touchStartPos.x;
    const dy = currentPos.y - currentState.touchStartPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 10 && !currentState.isDragging) {
      // ドラッグ開始 - クローン要素を作成
      e.preventDefault();

      if (currentState.dragElement && currentState.touchOffset) {
        const clone = currentState.dragElement.cloneNode(true) as HTMLElement;
        clone.style.position = 'fixed';
        // タッチ位置から実際のオフセットを引いて、タッチした場所がそのまま追従するように
        clone.style.left = `${currentPos.x - currentState.touchOffset.x}px`;
        clone.style.top = `${currentPos.y - currentState.touchOffset.y}px`;
        clone.style.width = `${currentState.dragElement.offsetWidth}px`;
        clone.style.zIndex = '9999';
        clone.style.opacity = '0.9';
        clone.style.pointerEvents = 'none';
        clone.style.transform = 'scale(1.05)';
        clone.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        document.body.appendChild(clone);
        dragCloneRef.current = clone;
      }

      // ドラッグ開始フラグのみ状態更新（1回だけ）
      setState(prev => ({
        ...prev,
        isDragging: true,
      }));
    } else if (currentState.isDragging) {
      e.preventDefault();

      // クローン要素を直接移動（setStateなし = 再レンダリングなし）
      if (dragCloneRef.current && currentState.touchOffset) {
        dragCloneRef.current.style.left = `${currentPos.x - currentState.touchOffset.x}px`;
        dragCloneRef.current.style.top = `${currentPos.y - currentState.touchOffset.y}px`;
      }

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
  }, []);

  // ドラッグ終了
  const handleTouchEnd = useCallback(() => {
    const currentState = stateRef.current;
    const currentPos = currentPosRef.current;

    if (!currentState.isDragging || !currentState.dragItem || !currentPos) {
      setState({
        isDragging: false,
        dragItem: null,
        touchStartPos: null,
        dragElement: null,
        touchOffset: null,
      });
      currentPosRef.current = null;
      return;
    }

    // クローン要素を削除
    if (dragCloneRef.current) {
      dragCloneRef.current.remove();
      dragCloneRef.current = null;
    }

    // ドロップ先のセルを検出
    const dropTarget = document.elementFromPoint(
      currentPos.x,
      currentPos.y
    );

    if (dropTarget) {
      // 親要素を辿ってtd要素を探す
      const cell = dropTarget.closest('td');
      if (cell) {
        // data属性からvenueIdとtimeSlotを取得
        const venueId = cell.getAttribute('data-venue-id');
        const timeSlot = cell.getAttribute('data-time-slot');

        if (venueId && timeSlot) {
          const slotIndex = timeSlots.findIndex(slot => slot.time === timeSlot);
          const slotOrder = slotIndex + 1;

          if (currentState.dragItem.type === 'session') {
            const session = currentState.dragItem.data as Session;
            onMoveSession(session.id, venueId, timeSlot, slotOrder);
          } else if (currentState.dragItem.type === 'instructor') {
            const instructor = currentState.dragItem.data as SessionInstructorWithDetails;
            onMoveInstructor(instructor.id, venueId, slotOrder);
          }
        }
      }
    }

    setState({
      isDragging: false,
      dragItem: null,
      touchStartPos: null,
      dragElement: null,
      touchOffset: null,
    });
    currentPosRef.current = null;
  }, [timeSlots, onMoveSession, onMoveInstructor]);

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
      dragElement: null,
      touchOffset: null,
    });
    currentPosRef.current = null;
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
