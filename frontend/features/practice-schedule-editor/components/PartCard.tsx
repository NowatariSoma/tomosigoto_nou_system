'use client';

import React from 'react';
import { Session } from '../types/session-editor';
import { GripVertical, Edit2, X } from 'lucide-react';
import { SessionInstructorWithDetails } from '../services/session-instructor-service';
import { Button } from '@/components/ui/forms/button';

type DragData = Session | { type: 'instructor'; instructor: SessionInstructorWithDetails };

interface PartCardProps {
  session: Session;
  edit_mode: 'edit' | 'view';
  is_dragging?: boolean;
  onDragStart?: (e: React.DragEvent, session: Session) => void;
  onEdit: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
}

/**
 * パート情報を表示するカード
 * セッション（パート）の情報のみを表示し、ドラッグ&ドロップ可能
 */
export const PartCard: React.FC<PartCardProps> = ({
  session,
  edit_mode,
  is_dragging = false,
  onDragStart,
  onEdit,
  onDelete,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(session.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(session.id);
    }
  };

  return (
    <div
      draggable={edit_mode === 'edit'}
      onDragStart={onDragStart ? (e) => onDragStart(e, session) : undefined}
      className={`rounded-lg px-4 py-3 bg-blue-100 border border-blue-300 hover:bg-blue-200 hover:shadow transition-all ${
        edit_mode === 'edit' ? 'cursor-move' : 'cursor-pointer'
      } ${is_dragging ? 'opacity-50 scale-95' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        {edit_mode === 'edit' && (
          <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          {session.part_name && (
            <div className="font-bold text-base text-gray-800 leading-tight truncate">
              {session.part_name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {edit_mode === 'view' && (
            <Edit2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
          )}
          {edit_mode === 'edit' && onDelete && (
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0.5 text-gray-400 hover:text-gray-700 flex-shrink-0"
              title="削除"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

