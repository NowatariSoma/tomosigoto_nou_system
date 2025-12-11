'use client';

import React from 'react';
import { Session, EditMode } from '../types/session-editor';
import { GripVertical, Trash2 } from 'lucide-react';
import { InstructorDisplay } from './InstructorDisplay';
import { Button } from '@/components/ui/forms/button';

interface DraggableSessionCardProps {
  session: Session;
  edit_mode: EditMode;
  scheduleId: string;
  is_dragging?: boolean;
  onDragStart?: (e: React.DragEvent, session: Session) => void;
  onEdit: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  fallbackInstructors?: string[]; // フォールバック用のインストラクター名配列
}

/**
 * ドラッグ可能なセッションカード
 * セッション情報を統一された形式で表示し、ドラッグ&ドロップと編集・削除機能を提供
 */
export const DraggableSessionCard: React.FC<DraggableSessionCardProps> = ({
  session,
  edit_mode,
  scheduleId,
  is_dragging = false,
  onDragStart,
  onEdit,
  onDelete,
  fallbackInstructors = [],
}) => {
  return (
    <div
      draggable={edit_mode === 'edit'}
      onDragStart={onDragStart ? (e) => onDragStart(e, session) : undefined}
      className={`w-full rounded-lg px-4 py-4 bg-blue-100 border border-blue-200 hover:bg-blue-200 hover:shadow-md transition-all ${
        edit_mode === 'edit' ? 'cursor-move' : 'cursor-pointer'
      } ${is_dragging ? 'opacity-50' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onEdit(session.id);
      }}
    >
      <div className="flex items-start gap-2">
        {/* ドラッグハンドル（編集モード時のみ） */}
        {edit_mode === 'edit' && (
          <div className="mt-1 cursor-grab hover:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        )}

        {/* セッション情報 */}
        <div className="flex-1">
          {session.part_name && (
            <div className="font-bold text-sm text-gray-800 leading-tight mb-1">
              {session.part_name}
            </div>
          )}

          {/* インストラクター表示 - 指導者データは親から渡されることを想定 */}
          {/* 注意: 親コンポーネントからinstructors propを渡す必要があります */}
        </div>

        {/* 削除ボタン（編集モード時のみ） */}
        {edit_mode === 'edit' && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
            }}
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-1 text-gray-400 hover:text-gray-600"
            title="削除"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
