/**
 * ドラッグ&ドロップ関連の型定義
 */

/**
 * ドラッグアイテムの型
 */
export interface DragItem {
  id: string;
  type: string;
  data: any;
}

/**
 * ドロップゾーンの型
 */
export interface DropZone {
  venue_id: string;
  time_slot: string;
  accepts: string[];
}

/**
 * ドラッグ&ドロップの状態
 */
export interface DragDropState {
  dragged_item: DragItem | null;
  drop_zones: DropZone[];
  is_dragging: boolean;
}

/**
 * ドラッグ&ドロップのアクション
 */
export type DragDropAction =
  | { type: 'START_DRAG'; payload: DragItem }
  | { type: 'END_DRAG' }
  | { type: 'SET_DROP_ZONES'; payload: DropZone[] }
  | { type: 'SET_DRAGGING'; payload: boolean };

/**
 * ドラッグ&ドロップのイベントハンドラー
 */
export interface DragDropHandlers {
  onDragStart: (item: DragItem) => void;
  onDragEnd: () => void;
  onDrop: (item: DragItem, drop_zone: DropZone) => void;
  onDragOver: (drop_zone: DropZone) => void;
  onDragLeave: (drop_zone: DropZone) => void;
}
