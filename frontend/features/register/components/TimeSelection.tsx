import React from 'react';
import { Input } from '@/components/ui/inputs/input';
import { TimeSlot } from '../types';

interface TimeSelectionProps {
  timeSlot: TimeSlot;
  onTimeSlotChange: (timeSlot: TimeSlot) => void;
}

const TimeSelection: React.FC<TimeSelectionProps> = ({
  timeSlot,
  onTimeSlotChange,
}) => {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Input
          value={timeSlot.start.split(':')[0]}
          onChange={(e) => onTimeSlotChange({ 
            ...timeSlot, 
            start: `${e.target.value}:${timeSlot.start.split(':')[1]}` 
          })}
          className="w-20 text-center border-2 border-blue-200 focus:border-blue-500"
          placeholder="時"
        />
        <span className="text-gray-600">:</span>
        <Input
          value={timeSlot.start.split(':')[1]}
          onChange={(e) => onTimeSlotChange({ 
            ...timeSlot, 
            start: `${timeSlot.start.split(':')[0]}:${e.target.value}` 
          })}
          className="w-20 text-center border-2 border-blue-200 focus:border-blue-500"
          placeholder="分"
        />
      </div>
      <span className="text-gray-600 font-medium">〜</span>
      <div className="flex items-center gap-2">
        <Input
          value={timeSlot.end.split(':')[0]}
          onChange={(e) => onTimeSlotChange({ 
            ...timeSlot, 
            end: `${e.target.value}:${timeSlot.end.split(':')[1]}` 
          })}
          className="w-20 text-center border-2 border-blue-200 focus:border-blue-500"
          placeholder="時"
        />
        <span className="text-gray-600">:</span>
        <Input
          value={timeSlot.end.split(':')[1]}
          onChange={(e) => onTimeSlotChange({ 
            ...timeSlot, 
            end: `${timeSlot.end.split(':')[0]}:${e.target.value}` 
          })}
          className="w-20 text-center border-2 border-blue-200 focus:border-blue-500"
          placeholder="分"
        />
      </div>
    </div>
  );
};

export default TimeSelection;