import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Clock } from 'lucide-react';
import DateSelection from './DateSelection';
import TimeSelection from './TimeSelection';
import { DateSelection as DateSelectionType, TimeSlot } from '../types';

interface DateTimeSelectionProps {
  date: DateSelectionType;
  timeSlot: TimeSlot;
  dayOfWeek: string;
  onDateChange: (date: DateSelectionType) => void;
  onTimeSlotChange: (timeSlot: TimeSlot) => void;
  onDayOfWeekChange: (dayOfWeek: string) => void;
  onCalendarClick?: () => void;
}

const DateTimeSelection: React.FC<DateTimeSelectionProps> = ({
  date,
  timeSlot,
  dayOfWeek,
  onDateChange,
  onTimeSlotChange,
  onDayOfWeekChange,
  onCalendarClick,
}) => {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          日時
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <DateSelection
          date={date}
          dayOfWeek={dayOfWeek}
          onDateChange={onDateChange}
          onDayOfWeekChange={onDayOfWeekChange}
          onCalendarClick={onCalendarClick}
        />

        <TimeSelection
          timeSlot={timeSlot}
          onTimeSlotChange={onTimeSlotChange}
        />
      </CardContent>
    </Card>
  );
};

export default DateTimeSelection;