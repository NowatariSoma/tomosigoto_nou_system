import { API_CONFIG, buildApiUrl, buildAuthUrl } from './api/config';

// エクスポート
export { buildApiUrl, buildAuthUrl };

const API_BASE_URL = API_CONFIG.BASE_URL;
const AUTH_URL = API_CONFIG.AUTH_URL;

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
  try {
    // サーバーサイドかクライアントサイドかを判定
    const isServer = typeof window === 'undefined';

    // サーバーサイド（Docker内）では backend:8000 を使用
    // クライアントサイド（ブラウザ）では localhost:8000 を使用
    const baseUrl = isServer
      ? 'http://backend:8000/api/v1'  // Docker内のサービス名を使用
      : API_BASE_URL;  // ブラウザからは localhost を使用

    // トークンの取得（サーバーサイドでは localStorage が使えないため）
    let token = null;
    if (!isServer && typeof localStorage !== 'undefined') {
      token = localStorage.getItem('authToken');
    }

    // URLが相対パスの場合、baseUrlを前に付ける
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

    // デバッグ用ログ
    console.log('fetchApi called with:', {
      url,
      fullUrl,
      isServer,
      baseUrl,
      hasToken: !!token,
      options: {
        method: options.method || 'GET',
        headers: options.headers
      }
    });

    // タイムアウト処理を追加（30秒）
    const timeoutMs = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      console.log('fetchApi response:', {
        url: fullUrl,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        // レスポンスボディからエラー詳細を取得
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData = null;
        let responseText = '';
        
        try {
          responseText = await response.text();
          console.log('Error response body (raw):', responseText);
          console.log('Error response body length:', responseText.length);
          
          if (responseText && responseText.trim() !== '') {
            try {
              errorData = JSON.parse(responseText);
              console.log('Error response body (parsed):', errorData);
              
              // detailがオブジェクトの場合（例: {"detail":{"error_code":"...","error_msg":"..."}}）
              if (errorData.detail) {
                if (typeof errorData.detail === 'object' && errorData.detail !== null) {
                  // detailがオブジェクトの場合、error_msgまたはerror_codeを取得
                  errorMessage = errorData.detail.error_msg || 
                                errorData.detail.error_code || 
                                errorData.detail.message ||
                                JSON.stringify(errorData.detail);
                } else if (typeof errorData.detail === 'string') {
                  // detailが文字列の場合
                  errorMessage = errorData.detail;
                }
              } else if (errorData.message) {
                errorMessage = errorData.message;
              } else if (errorData.error) {
                errorMessage = typeof errorData.error === 'string' 
                  ? errorData.error 
                  : errorData.error.message || JSON.stringify(errorData.error);
              } else if (errorData.error_msg) {
                errorMessage = errorData.error_msg;
              } else if (errorData.error_code) {
                errorMessage = errorData.error_code;
              }
            } catch (jsonError) {
              console.warn('JSON parse error:', jsonError);
              // JSONパースに失敗した場合は生のテキストをエラーメッセージにする
              errorMessage = responseText || errorMessage;
            }
          } else {
            console.warn('Error response body is empty');
          }
        } catch (textError) {
          // レスポンステキストの取得に失敗した場合
          console.warn('Error response text retrieval failed:', textError);
        }
        
        const errorDetails = {
          url: fullUrl,
          status: response.status,
          statusText: response.statusText,
          errorMessage,
          errorData,
          responseText,
          responseHeaders: Object.fromEntries(response.headers.entries())
        };
        
        // より詳細なエラーログ
        console.error('API Error:', {
          url: fullUrl,
          status: response.status,
          statusText: response.statusText,
          errorMessage: errorMessage,
          errorData: errorData ? JSON.stringify(errorData, null, 2) : 'null',
          responseText: responseText || '(empty)',
          responseHeaders: Object.fromEntries(response.headers.entries())
        });
        
        // エラーメッセージが空の場合は詳細な情報を表示
        const finalErrorMessage = errorMessage || `${response.status} ${response.statusText}`;
        
        throw new ApiError(response.status, finalErrorMessage);
      }

      return response;
    } catch (fetchError) {
      clearTimeout(timeoutId);

      // タイムアウトエラーの場合
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Request timeout:', { url: fullUrl, timeoutMs });
        throw new ApiError(408, `リクエストがタイムアウトしました（${timeoutMs / 1000}秒）`);
      }

      // ApiErrorの場合はそのまま再スロー
      if (fetchError instanceof ApiError) {
        throw fetchError;
      }

      // その他のfetchエラー
      throw fetchError;
    }
  } catch (error) {
    // ApiErrorはそのまま再スロー
    if (error instanceof ApiError) {
      throw error;
    }

    // その他のエラー（ネットワークエラーなど）
    console.error('fetchApi error:', {
      url,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new ApiError(0, error instanceof Error ? error.message : 'Network error occurred');
  }
}

// Authentication
export const auth = {
  async login(username: string, password: string) {
    const response = await fetch(buildAuthUrl('/auth/login'), {
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
    return fetchApi(buildAuthUrl('/auth/me'));
  },

  clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.clear();
    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
};


export const historical = {
  async getHistoricalData(startDate: string, endDate: string) {
    const response = await fetchApi(buildApiUrl(`/db/historical?start=${startDate}&end=${endDate}`));
    return response.json();
  }
};

// Settings
export const settings = {
  async getProjectSettings() {
    return fetchApi(buildApiUrl('/settings/project'));
  },

  async getUserSettings() {
    return fetchApi(buildApiUrl('/settings/user'));
  }
};