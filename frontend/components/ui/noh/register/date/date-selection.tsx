import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Date {
  month: string;
  day: string;
}

interface DateSelectionProps {
  date: Date;
  dayOfWeek: string;
  onDateChange: (date: Date) => void;
  onDayOfWeekChange: (dayOfWeek: string) => void;
  onCalendarClick?: () => void;
}

const DateSelection: React.FC<DateSelectionProps> = ({
  date,
  dayOfWeek,
  onDateChange,
  onDayOfWeekChange,
  onCalendarClick,
}) => {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Input
          value={date.month}
          onChange={(e) => onDateChange({ ...date, month: e.target.value })}
          className="w-20 text-center border-2 border-blue-200 focus:border-blue-500"
          placeholder="月"
        />
        <span className="text-gray-600 font-medium">月</span>
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={date.day}
          onChange={(e) => onDateChange({ ...date, day: e.target.value })}
          className="w-20 text-center border-2 border-blue-200 focus:border-blue-500"
          placeholder="日"
        />
        <span className="text-gray-600 font-medium">日</span>
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={dayOfWeek}
          onChange={(e) => onDayOfWeekChange(e.target.value)}
          className="w-24 text-center border-2 border-blue-200 focus:border-blue-500"
          placeholder="曜日"
        />
        <Button
          variant="outline"
          size="sm"
          className="bg-blue-100 border-blue-200 hover:bg-green-100"
          onClick={onCalendarClick}
        >
          カレンダー
        </Button>
      </div>
    </div>
  );
};

export default DateSelection;
