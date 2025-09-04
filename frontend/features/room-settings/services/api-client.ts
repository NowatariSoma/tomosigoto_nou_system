const API_BASE_URL = '';

interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export class ApiClient {
  private baseURL: string;
  private headers: HeadersInit;

  constructor(baseURL: string = API_BASE_URL, headers: HeadersInit = {}) {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers,
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = {
        message: `HTTP error! status: ${response.status}`,
      };

      try {
        const errorData = await response.json();
        error.message = errorData.message || error.message;
        error.code = errorData.code;
        error.details = errorData.details;
      } catch {
        // レスポンスボディがJSONでない場合
      }

      throw error;
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let urlString = `${this.baseURL}${endpoint}`;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      if (searchParams.toString()) {
        urlString += `?${searchParams.toString()}`;
      }
    }

    const response = await fetch(urlString, {
      method: 'GET',
      headers: this.headers,
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.headers,
    });

    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient();