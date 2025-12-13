'use client';

import React, { useRef } from 'react';
import { GripVertical, X } from 'lucide-react';
import { SessionInstructorWithDetails } from '../services/session-instructor-service';
import { Button } from '@/components/ui/forms/button';

interface InstructorCardProps {
  sessionInstructor: SessionInstructorWithDetails;
  scheduleId: string;
  edit_mode: 'edit' | 'view';
  is_dragging?: boolean;
  onDragStart?: (e: React.DragEvent, instructor: SessionInstructorWithDetails) => void;
  onTouchStart?: (e: React.TouchEvent, item: { type: 'instructor'; data: SessionInstructorWithDetails }, element: HTMLElement) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  onTouchCancel?: () => void;
  onEdit?: (instructorId: string) => void;
  onDelete?: (instructorId: string) => void;
}

/**
 * インストラクター情報を表示するカード
 * session_instructorsの情報のみを表示し、ドラッグ&ドロップ可能
 */
export const InstructorCard: React.FC<InstructorCardProps> = ({
  sessionInstructor,
  scheduleId,
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
    if (onEdit) {
      onEdit(sessionInstructor.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(sessionInstructor.id);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (edit_mode === 'edit' && onTouchStart && cardRef.current) {
      onTouchStart(e, { type: 'instructor', data: sessionInstructor }, cardRef.current);
    }
  };

  return (
    <div
      ref={cardRef}
      draggable={edit_mode === 'edit'}
      onDragStart={onDragStart ? (e) => onDragStart(e, sessionInstructor) : undefined}
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
          <div className="text-base text-black font-semibold">
            {(() => {
              console.log('DEBUG InstructorCard: sessionInstructor =', sessionInstructor);
              return sessionInstructor.user_name || 
                     (sessionInstructor.user_email ? sessionInstructor.user_email.split('@')[0] : `指導者${sessionInstructor.id.slice(-4)}`);
            })()}
          </div>
        </div>
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
  );
};

