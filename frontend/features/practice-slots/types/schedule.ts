export interface ScheduleItem {
  id?: string;
  practice_slot_id?: string;
  time: string;
  duration: string;
  activity: string;
  columns: string[];
  created_at?: string;
  updated_at?: string;
}

export interface PracticeSlot {
  id?: string;
  date: string;
  title?: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  schedule_items?: ScheduleItem[];
}

export interface DateNavigationProps {
  currentDate: Date;
  onDateChange: (direction: 'prev' | 'next') => void;
}

export interface ScheduleTableProps {
  className?: string;
  scheduleData: ScheduleItem[];
  groups?: Group[];
  assignments?: ScheduleAssignmentWithDetails[];
  onCellClick?: (timeSlot: string, groupId: string, groupName: string, groupColor: string) => void;
}

export interface InformationProps {
  className?: string;
  currentDate?: Date;
} 