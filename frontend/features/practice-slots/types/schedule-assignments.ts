export interface ScheduleAssignment {
  id: string;
  practice_slot_id: string;
  time_slot: string;
  group_id: string;
  part_id: string;
  notes?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ScheduleAssignmentCreate {
  practice_slot_id: string;
  time_slot: string;
  group_id: string;
  part_id: string;
  notes?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface ScheduleAssignmentUpdate {
  part_id?: string;
  notes?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface ScheduleAssignmentWithDetails extends ScheduleAssignment {
  group_name?: string;
  group_display_name?: string;
  group_color?: string;
  part_name?: string;
  part_display_name?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
