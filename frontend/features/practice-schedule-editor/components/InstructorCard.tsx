'use client';

import React from 'react';
import { GripVertical, X } from 'lucide-react';
import { SessionInstructorWithDetails } from '../services/session-instructor-service';

interface InstructorCardProps {
  sessionInstructor: SessionInstructorWithDetails;
  scheduleId: string;
  edit_mode: 'edit' | 'view';
  is_dragging?: boolean;
  onDragStart?: (e: React.DragEvent, instructor: SessionInstructorWithDetails) => void;
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
  onEdit,
  onDelete,
}) => {
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

  return (
    <div
      draggable={edit_mode === 'edit'}
      onDragStart={onDragStart ? (e) => onDragStart(e, sessionInstructor) : undefined}
      className={`rounded-lg px-4 py-3 bg-amber-50 border border-amber-300 hover:bg-amber-100 hover:shadow transition-all ${
        edit_mode === 'edit' ? 'cursor-move' : 'cursor-pointer'
      } ${is_dragging ? 'opacity-50 scale-95' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        {edit_mode === 'edit' && (
          <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-base text-gray-800 font-semibold">
            {(() => {
              console.log('DEBUG InstructorCard: sessionInstructor =', sessionInstructor);
              return sessionInstructor.user_name || 
                     (sessionInstructor.user_email ? sessionInstructor.user_email.split('@')[0] : `指導者${sessionInstructor.id.slice(-4)}`);
            })()}
          </div>
        </div>
        {edit_mode === 'edit' && onDelete && (
          <button
            onClick={handleDelete}
            className="p-0.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
            title="削除"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

