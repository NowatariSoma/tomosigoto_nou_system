'use client';

import React, { useState } from 'react';
import { Session, EditMode } from '../types/session-editor';
import { Edit, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InstructorDisplay } from './InstructorDisplay';
import { Button } from '@/components/ui/forms/button';

interface DraggableSessionProps {
  session: Session;
  edit_mode: EditMode;
  scheduleId: string;
  onEdit: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onMove: (sessionId: string, venueId: string, timeSlot: string) => void;
  fallbackInstructors?: string[]; // フォールバック用のインストラクター名配列
}

export const DraggableSession: React.FC<DraggableSessionProps> = ({
  session,
  edit_mode,
  scheduleId,
  onEdit,
  onDelete,
  onMove,
  fallbackInstructors = [],
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (edit_mode !== 'edit') return;
    
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'session',
      id: session.id,
      data: session,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(session.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(session.id);
  };

  return (
    <div
      draggable={edit_mode === 'edit'}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        "rounded-lg p-3 shadow-sm border border-opacity-30 cursor-pointer hover:shadow-md transition-all duration-200",
        "bg-blue-100 border-blue-300",
        isDragging && "opacity-50 scale-95",
        edit_mode === 'edit' && "hover:bg-blue-200"
      )}
      style={{
        backgroundColor: '#E0EAFF',
        borderColor: '#B9D4FF'
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {session.part_name && (
            <div className="font-bold text-sm text-black leading-tight mb-1">
              {session.part_name}
            </div>
          )}
          {session.start_time && session.end_time && (
            <div className="text-xs text-black mt-1">
              {session.start_time} - {session.end_time}
            </div>
          )}
          {/* インストラクター表示 */}
          <InstructorDisplay
            scheduleId={scheduleId}
            slotOrder={session.slot_order}
            className="mt-1"
            fallbackInstructors={fallbackInstructors}
          />
        </div>
        
        {edit_mode === 'edit' && (
          <div className="flex items-center space-x-1 ml-2">
            <Button
              onClick={handleEdit}
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-1 text-black"
              title="編集"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-1 text-black"
              title="削除"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <div className="p-1 text-black cursor-grab">
              <GripVertical className="h-3 w-3" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
