'use client';

import React, { useState } from 'react';
import { Session, EditMode } from '../types/session-editor';
import { Edit, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableSessionProps {
  session: Session;
  edit_mode: EditMode;
  onEdit: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onMove: (sessionId: string, venueId: string, timeSlot: string) => void;
}

export const DraggableSession: React.FC<DraggableSessionProps> = ({
  session,
  edit_mode,
  onEdit,
  onDelete,
  onMove,
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
        backgroundColor: '#DBEAFE',
        borderColor: '#93C5FD'
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-800 leading-tight mb-1">
            {session.title}
          </div>
          <div className="text-xs text-gray-600">
            優先度: {session.priority}
          </div>
          {session.part_id && (
            <div className="text-xs text-gray-500 mt-1">
              パートID: {session.part_id}
            </div>
          )}
        </div>
        
        {edit_mode === 'edit' && (
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={handleEdit}
              className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
              title="編集"
            >
              <Edit className="h-3 w-3" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
              title="削除"
            >
              <Trash2 className="h-3 w-3" />
            </button>
            <div className="p-1 text-gray-400 cursor-grab">
              <GripVertical className="h-3 w-3" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
