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
      className={cn("w-20 sm:w-32 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-black bg-blue-100 align-top border-r border-blue-200 hover:bg-blue-200 transition-colors cursor-pointer group", className)}
      onClick={handleClick}
      title="クリックして時間を編集"
    >
        <div className="flex items-center justify-between">
          <span className="text-black font-semibold">{timeSlot.display_time}</span>
          <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    </td>
  );
};
