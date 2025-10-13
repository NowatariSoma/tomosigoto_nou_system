/**
 * ドラッグ&ドロップ用のカスタムフック
 */

import { useReducer, useCallback } from 'react';
import { DragItem, DropZone, DragDropState, DragDropAction } from '../types/drag-and-drop';

/**
 * ドラッグ&ドロップの状態管理
 */
const dragDropReducer = (
  state: DragDropState, 
  action: DragDropAction
): DragDropState => {
  switch (action.type) {
    case 'START_DRAG':
      return { 
        ...state, 
        dragged_item: action.payload, 
        is_dragging: true 
      };
    case 'END_DRAG':
      return { 
        ...state, 
        dragged_item: null, 
        is_dragging: false 
      };
    case 'SET_DROP_ZONES':
      return { ...state, drop_zones: action.payload };
    case 'SET_DRAGGING':
      return { ...state, is_dragging: action.payload };
    default:
      return state;
  }
};

/**
 * ドラッグ&ドロップ用のカスタムフック
 */
export const useDragAndDrop = () => {
  const [state, dispatch] = useReducer(dragDropReducer, {
    dragged_item: null,
    drop_zones: [],
    is_dragging: false,
  });

  /**
   * ドラッグ開始
   */
  const startDrag = useCallback((item: DragItem) => {
    dispatch({ type: 'START_DRAG', payload: item });
  }, []);

  /**
   * ドラッグ終了
   */
  const endDrag = useCallback(() => {
    dispatch({ type: 'END_DRAG' });
  }, []);

  /**
   * ドロップゾーンを設定
   */
  const setDropZones = useCallback((zones: DropZone[]) => {
    dispatch({ type: 'SET_DROP_ZONES', payload: zones });
  }, []);

  /**
   * ドラッグ状態を設定
   */
  const setDragging = useCallback((isDragging: boolean) => {
    dispatch({ type: 'SET_DRAGGING', payload: isDragging });
  }, []);

  /**
   * ドロップゾーンが有効かチェック
   */
  const isDropZoneValid = useCallback((zone: DropZone, item: DragItem): boolean => {
    return zone.accepts.includes(item.type);
  }, []);

  /**
   * ドラッグアイテムがドロップゾーン上にあるかチェック
   */
  const isOverDropZone = useCallback((zone: DropZone, item: DragItem): boolean => {
    return state.is_dragging && 
           state.dragged_item?.id === item.id && 
           isDropZoneValid(zone, item);
  }, [state.is_dragging, state.dragged_item, isDropZoneValid]);

  return {
    ...state,
    startDrag,
    endDrag,
    setDropZones,
    setDragging,
    isDropZoneValid,
    isOverDropZone,
  };
};
