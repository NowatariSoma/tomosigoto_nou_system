const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:8000';

// API設定の初期化確認
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // 開発環境でのみAPI設定を確認
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchApi(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');
  
  // URLが相対パスの場合、API_BASE_URLを前に付ける
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
  }

  return response;
}

// Authentication
export const auth = {
  async login(username: string, password: string) {
    const response = await fetch(`${AUTH_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'Invalid credentials');
    }

    const data = await response.json();
    
    // Save token to both localStorage and cookie
    localStorage.setItem('authToken', data.access_token);
    
    // Set cookie with secure options (session-only - expires when browser closes)
    document.cookie = `authToken=${data.access_token}; path=/; samesite=strict${
      window.location.protocol === 'https:' ? '; secure' : ''
    }`;
    
    return data;
  },

  async logout() {
    localStorage.removeItem('authToken');
    
    // Remove cookie
    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  },

  async getCurrentUser() {
    return fetchApi(`${AUTH_URL}/auth/me`);
  },

  clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.clear();
    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
};


export const historical = {
  async getHistoricalData(startDate: string, endDate: string) {
    const response = await fetchApi(`${API_BASE_URL}/api/db/historical?start=${startDate}&end=${endDate}`);
    return response.json();
  }
};

// Settings
export const settings = {
  async getProjectSettings() {
    return fetchApi(`${API_BASE_URL}/settings/project`);
  },

  async getUserSettings() {
    return fetchApi(`${API_BASE_URL}/settings/user`);
  }
};