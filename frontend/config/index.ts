interface AppConfig {
  apiBaseUrl: string;
  apiTimeout: number;
  authTokenKey: string;
  refreshTokenKey: string;
  paginationDefaults: {
    pageSize: number;
    maxPageSize: number;
  };
  dateFormat: {
    default: string;
    short: string;
    long: string;
    time: string;
    dateTime: string;
  };
  environment: {
    name: string;
    isDevelopment: boolean;
    isProduction: boolean;
    isTest: boolean;
  };
  features: {
    enableNotifications: boolean;
    enableRealTimeUpdates: boolean;
    enableAnalytics: boolean;
  };
  ui: {
    defaultTheme: 'light' | 'dark' | 'system';
    supportedLanguages: string[];
    defaultLanguage: string;
  };
}

const getEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  return {
    name: env,
    isDevelopment: env === 'development',
    isProduction: env === 'production',
    isTest: env === 'test',
  };
};

export const config: AppConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  apiTimeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  authTokenKey: 'auth_token',
  refreshTokenKey: 'refresh_token',
  paginationDefaults: {
    pageSize: 10,
    maxPageSize: 100,
  },
  dateFormat: {
    default: 'yyyy-MM-dd',
    short: 'MM/dd',
    long: 'yyyy年MM月dd日',
    time: 'HH:mm',
    dateTime: 'yyyy-MM-dd HH:mm',
  },
  environment: getEnvironment(),
  features: {
    enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
    enableRealTimeUpdates: process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true',
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  },
  ui: {
    defaultTheme: (process.env.NEXT_PUBLIC_DEFAULT_THEME as 'light' | 'dark' | 'system') || 'system',
    supportedLanguages: ['ja', 'en'],
    defaultLanguage: 'ja',
  },
};

export const apiConfig = {
  baseUrl: config.apiBaseUrl,
  timeout: config.apiTimeout,
  endpoints: {
    auth: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      refresh: '/api/auth/refresh',
      me: '/api/auth/me',
    },
    users: {
      list: '/api/users',
      create: '/api/users',
      get: (id: string) => `/api/users/${id}`,
      update: (id: string) => `/api/users/${id}`,
      delete: (id: string) => `/api/users/${id}`,
    },
    schedules: {
      list: '/api/schedules',
      create: '/api/schedules',
      get: (id: string) => `/api/schedules/${id}`,
      update: (id: string) => `/api/schedules/${id}`,
      delete: (id: string) => `/api/schedules/${id}`,
    },
    sessions: {
      list: '/api/sessions',
      create: '/api/sessions',
      get: (id: string) => `/api/sessions/${id}`,
      update: (id: string) => `/api/sessions/${id}`,
      delete: (id: string) => `/api/sessions/${id}`,
      bySchedule: (scheduleId: string) => `/api/schedules/${scheduleId}/sessions`,
    },
  },
};

export const storageKeys = {
  authToken: config.authTokenKey,
  refreshToken: config.refreshTokenKey,
  userPreferences: 'user_preferences',
  theme: 'theme',
  language: 'language',
} as const;

export const validateConfig = (): boolean => {
  const requiredVars = ['NEXT_PUBLIC_API_BASE_URL'];
  const missing = requiredVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('Missing required environment variables:', missing);
    return false;
  }
  
  return true;
};

export default config;