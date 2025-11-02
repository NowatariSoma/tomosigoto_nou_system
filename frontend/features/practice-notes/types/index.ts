export interface PracticeNote {
  id: string;
  practice_schedule_id: string;
  title: string;
  content: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface PracticeNoteCreate {
  practice_schedule_id: string;
  title: string;
  content: string;
  priority?: number;
}

export interface PracticeNoteUpdate {
  title?: string;
  content?: string;
  priority?: number;
}
