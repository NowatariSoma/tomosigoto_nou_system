export interface Session {
  id: string
  title: string
  start: Date
  end: Date
  partId: number
  partName: string
  instructorId?: string
  instructorName?: string
  venueId: string
  venueName: string
  description?: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  color?: string
  createdAt: Date
  updatedAt: Date
}

export interface SessionFormData {
  title: string
  start: Date
  end: Date
  partId: number
  instructorId?: string
  venueId: string
  description?: string
}

export interface SessionCreateData extends SessionFormData {
  // Additional fields for creation
}

export interface SessionUpdateData extends Partial<SessionFormData> {
  status?: Session['status']
}

export interface QuickSessionData {
  partId: number
  duration: number // in minutes
  date: Date
  time: Date
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationErrors
}

export interface ValidationErrors {
  [field: string]: string
}

export interface DragPreview {
  start: Date
  end: Date
  sessionId: string
}

export interface Position {
  x: number
  y: number
  date: Date
  time: Date
}