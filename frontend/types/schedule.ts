export interface ScheduleItem {
  time: string;
  duration?: string;
  activity: string;
  columns: string[];
}

export interface DateNavigationProps {
  currentDate: Date;
  onDateChange: (direction: 'prev' | 'next') => void;
}

export interface ScheduleTableProps {
  className?: string;
  scheduleData: ScheduleItem[];
}

export interface InformationProps {
  className?: string;
  currentDate?: Date;
} 