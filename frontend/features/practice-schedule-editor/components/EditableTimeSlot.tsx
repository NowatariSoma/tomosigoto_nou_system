import React from 'react';
import { Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimeSlot } from '../types/session-editor';

interface EditableTimeSlotProps {
  timeSlot: TimeSlot;
  onEdit: (timeSlot: TimeSlot) => void;
  className?: string;
}

export const EditableTimeSlot: React.FC<EditableTimeSlotProps> = ({
  timeSlot,
  onEdit,
  className
}) => {
  const handleClick = () => {
    onEdit(timeSlot);
  };

  return (
    <td 
      className={cn("w-32 px-4 py-3 text-sm font-medium text-white bg-gray-900 align-top border-r border-gray-600 hover:bg-gray-800 transition-colors cursor-pointer group", className)}
      onClick={handleClick}
      title="クリックして時間を編集"
    >
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold">{timeSlot.display_time}</span>
          <Edit2 className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    </td>
  );
};
