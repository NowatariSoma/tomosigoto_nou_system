export interface Room {
  id: string;
  name: string;
}

export interface Member {
  id: number;
  name: string;
  available: boolean;
  timeSlot: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface DateSelection {
  month: string;
  day: string;
}