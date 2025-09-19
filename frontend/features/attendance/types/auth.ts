export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface SignoutResponse {
  message: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  message: string;
}

export interface PasswordUpdateRequest {
  access_token: string;
  password: string;
}

export interface PasswordUpdateResponse {
  message: string;
}
