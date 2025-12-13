'use client';

import React, { useRef } from 'react';
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
  onTouchStart?: (e: React.TouchEvent, item: { type: 'session'; data: Session }, element: HTMLElement) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  onTouchCancel?: () => void;
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
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
  onEdit,
  onDelete,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (edit_mode === 'edit' && onTouchStart && cardRef.current) {
      onTouchStart(e, { type: 'session', data: session }, cardRef.current);
    }
  };

  return (
    <div
      ref={cardRef}
      draggable={edit_mode === 'edit'}
      onDragStart={onDragStart ? (e) => onDragStart(e, session) : undefined}
      onTouchStart={handleTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      className={`rounded-lg px-4 py-3 card-blue-hover ${
        edit_mode === 'edit' ? 'cursor-move touch-none select-none' : 'cursor-pointer'
      } ${is_dragging ? 'opacity-50 scale-95' : ''}`}
      style={edit_mode === 'edit' ? { WebkitUserSelect: 'none', WebkitTouchCallout: 'none' } : undefined}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        {edit_mode === 'edit' && (
          <GripVertical className="h-4 w-4 text-black flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          {session.part_name && (
            <div className="font-bold text-base text-black leading-tight truncate">
              {session.part_name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {edit_mode === 'view' && (
            <Edit2 className="h-4 w-4 text-black flex-shrink-0" />
          )}
          {edit_mode === 'edit' && onDelete && (
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0.5 text-black hover-subtle flex-shrink-0"
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

