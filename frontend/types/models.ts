export interface User {
  id: string;
  email: string;
  displayName: string;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
  emailConfirmedAt?: Date;
  lastSignInAt?: Date;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Schedule {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  description?: string;
  sessions: Session[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  status: ScheduleStatus;
}

export interface Session {
  id: string;
  scheduleId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  participants: User[];
  supervisors: User[];
  createdAt: Date;
  updatedAt: Date;
  status: SessionStatus;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  capacity: number;
  facilities: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    manager?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  metadata?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  theme: 'light' | 'dark' | 'system';
}

export enum ScheduleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed'
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SCHEDULE_UPDATE = 'schedule_update',
  SESSION_REMINDER = 'session_reminder',
  SYSTEM = 'system'
}

export interface DashboardStats {
  totalUsers: number;
  activeSchedules: number;
  upcomingSessions: number;
  completedSessions: number;
}

export interface ScheduleOverview {
  schedule: Schedule;
  sessionCount: number;
  participantCount: number;
  upcomingSessionsCount: number;
}