export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    roles: string[];
  };
  expiresAt: Date;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface CreateUserRequest {
  email: string;
  displayName: string;
  password: string;
  roles?: string[];
}

export interface UpdateUserRequest {
  displayName?: string;
  roles?: string[];
}

export interface CreateScheduleRequest {
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  description?: string;
}

export interface UpdateScheduleRequest {
  title?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  description?: string;
}

export interface CreateSessionRequest {
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  participantIds?: string[];
  supervisorIds?: string[];
}

export interface UpdateSessionRequest {
  title?: string;
  startTime?: Date;
  endTime?: Date;
  description?: string;
  participantIds?: string[];
  supervisorIds?: string[];
}

export interface GetUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
}

export interface GetSchedulesParams {
  page?: number;
  pageSize?: number;
  startDate?: Date;
  endDate?: Date;
  location?: string;
}

export interface GetSessionsParams {
  page?: number;
  pageSize?: number;
  scheduleId?: string;
  participantId?: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestConfig {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
}