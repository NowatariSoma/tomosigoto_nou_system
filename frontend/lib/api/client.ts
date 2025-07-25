import { ApiResponse, ApiError, RequestConfig, HttpMethod } from '@/types/api';
import { Result } from '@/types/utility';

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private authToken?: string;

  constructor(baseUrl: string, headers: Record<string, string> = {}) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuthToken(): void {
    this.authToken = undefined;
  }

  private getHeaders(): Record<string, string> {
    const headers = { ...this.defaultHeaders };
    
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }
    
    return headers;
  }

  private buildUrl(path: string, params?: Record<string, any>): string {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    
    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    return `${url}?${searchParams.toString()}`;
  }

  private async makeRequest<T>(
    path: string,
    config: RequestConfig = { method: 'GET' }
  ): Promise<Result<ApiResponse<T>, ApiError>> {
    try {
      const url = this.buildUrl(path, config.params);
      const headers = { ...this.getHeaders(), ...config.headers };

      const requestInit: RequestInit = {
        method: config.method,
        headers,
      };

      if (config.body && config.method !== 'GET') {
        requestInit.body = JSON.stringify(config.body);
      }

      const response = await fetch(url, requestInit);
      
      return await this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  private async handleResponse<T>(response: Response): Promise<Result<ApiResponse<T>, ApiError>> {
    try {
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        const errorBody = isJson ? await response.json() : await response.text();
        const apiError: ApiError = {
          code: String(response.status),
          message: errorBody.message || errorBody || response.statusText,
          details: errorBody,
        };
        return { success: false, error: apiError };
      }

      const data = isJson ? await response.json() : await response.text();
      
      const apiResponse: ApiResponse<T> = {
        data,
        status: response.status,
        message: 'Success',
        timestamp: new Date(),
      };

      return { success: true, value: apiResponse };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): Result<never, ApiError> {
    const apiError: ApiError = {
      code: 'NETWORK_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: error,
    };
    return { success: false, error: apiError };
  }

  async get<T>(path: string, params?: Record<string, any>): Promise<Result<ApiResponse<T>, ApiError>> {
    return this.makeRequest<T>(path, { method: 'GET', params });
  }

  async post<T>(path: string, data?: any, headers?: Record<string, string>): Promise<Result<ApiResponse<T>, ApiError>> {
    return this.makeRequest<T>(path, { method: 'POST', body: data, headers });
  }

  async put<T>(path: string, data?: any, headers?: Record<string, string>): Promise<Result<ApiResponse<T>, ApiError>> {
    return this.makeRequest<T>(path, { method: 'PUT', body: data, headers });
  }

  async patch<T>(path: string, data?: any, headers?: Record<string, string>): Promise<Result<ApiResponse<T>, ApiError>> {
    return this.makeRequest<T>(path, { method: 'PATCH', body: data, headers });
  }

  async delete<T>(path: string, headers?: Record<string, string>): Promise<Result<ApiResponse<T>, ApiError>> {
    return this.makeRequest<T>(path, { method: 'DELETE', headers });
  }
}

export const createApiClient = (baseUrl?: string): ApiClient => {
  const apiBaseUrl = baseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  return new ApiClient(apiBaseUrl);
};

export const apiClient = createApiClient();