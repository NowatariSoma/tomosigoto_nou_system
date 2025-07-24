export interface Venue {
  id: number;
  name: string;
  capacity: number;
  location: string;
}

export interface Part {
  id: number;
  name: string;
  color: string;
  description?: string;
}

export interface Session {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  venueId: number;
  partIds: number[];
  description?: string;
  notes?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  createdAt: Date;
  modifiedAt: Date;
}

export interface ScheduleConflict {
  id: string;
  type: 'venue_overlap' | 'part_overlap' | 'time_constraint' | 'capacity_exceeded';
  severity: 'error' | 'warning' | 'info';
  sessionIds: string[];
  message: string;
  suggestion?: string;
  affectedDate: Date;
  affectedVenueId?: number;
  affectedPartIds?: number[];
}

export interface OptimizationScore {
  total: number;
  breakdown: {
    venueUtilization: number;
    partBalance: number;
    timeEfficiency: number;
    conflictPenalty: number;
  };
  suggestions: string[];
}

export interface GeneratedSchedule {
  id: string;
  name: string;
  sessions: Session[];
  venues: Venue[];
  parts: Part[];
  conflicts: ScheduleConflict[];
  optimizationScore: OptimizationScore;
  generatedAt: Date;
  version: number;
}

export interface SessionDropData {
  date: Date;
  startTime: string;
  endTime: string;
  venueId: number;
}

export interface SessionEditData {
  title?: string;
  date?: Date;
  startTime?: string;
  endTime?: string;
  venueId?: number;
  partIds?: number[];
  description?: string;
  notes?: string;
  status?: Session['status'];
}

export interface DropTarget {
  date: Date;
  venueId: number;
  hour: number;
  isValid: boolean;
}

export interface RegenerationParams {
  dateRange?: {
    start: Date;
    end: Date;
  };
  venueIds?: number[];
  partIds?: number[];
  constraints?: Record<string, any>;
}

export interface ChangeHistoryEntry {
  id: string;
  type: 'session_moved' | 'session_edited' | 'session_created' | 'session_deleted';
  timestamp: Date;
  sessionId: string;
  oldData: Partial<Session>;
  newData: Partial<Session>;
  description: string;
  canUndo: boolean;
}