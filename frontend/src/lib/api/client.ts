/**
 * APIクライアント
 * 
 * このファイルはAPIとの通信を行うクライアントクラスを実装しています。
 * GET, POST, PUT, DELETEなどの基本的なHTTPリクエストメソッドを提供します。
 */

import { ApiResponse, ApiError } from '@/types/api';
import { config } from '@/config';

/**
 * APIクライアントクラス
 * APIリクエスト送信の基本クラス
 */
export class ApiClient {
  /** APIの基本URL */
  private baseUrl: string;
  /** リクエストヘッダー */
  private headers: Record<string, string>;

  /**
   * クライアント初期化
   * @param baseUrl APIの基本URL
   * @param headers リクエストヘッダー
   */
  constructor(
    baseUrl: string = config.apiBaseUrl,
    headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
  ) {
    this.baseUrl = baseUrl;
    this.headers = headers;
  }

  /**
   * 認証トークンを設定する
   * @param token 認証トークン
   */
  setAuthToken(token: string): void {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  /**
   * GETリクエストを送信する
   * @param path APIパス
   * @param params クエリパラメータ
   * @returns APIレスポンス
   */
  async get<T>(path: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers,
    });
    
    return this.handleResponse<T>(response);
  }

  /**
   * POSTリクエストを送信する
   * @param path APIパス
   * @param data リクエストデータ
   * @returns APIレスポンス
   */
  async post<T>(path: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    
    return this.handleResponse<T>(response);
  }

  /**
   * PUTリクエストを送信する
   * @param path APIパス
   * @param data リクエストデータ
   * @returns APIレスポンス
   */
  async put<T>(path: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    
    return this.handleResponse<T>(response);
  }

  /**
   * DELETEリクエストを送信する
   * @param path APIパス
   * @returns APIレスポンス
   */
  async delete<T>(path: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.headers,
    });
    
    return this.handleResponse<T>(response);
  }

  /**
   * レスポンスを処理する
   * @param response フェッチレスポンス
   * @returns APIレスポンス
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    if (!response.ok) {
      if (isJson) {
        const errorData = await response.json();
        throw this.handleError(errorData);
      } else {
        throw this.handleError({
          code: 'HTTP_ERROR',
          message: `HTTP error ${response.status}: ${response.statusText}`,
          details: { status: response.status },
        });
      }
    }
    
    if (isJson) {
      const data = await response.json();
      return data as ApiResponse<T>;
    }
    
    throw this.handleError({
      code: 'INVALID_RESPONSE',
      message: 'Response is not in JSON format',
      details: { contentType },
    });
  }

  /**
   * エラーを処理する
   * @param error エラーデータ
   */
  private handleError(error: any): never {
    const apiError: ApiError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || '不明なエラーが発生しました',
      details: error.details || error,
    };
    
    console.error('API Error:', apiError);
    throw apiError;
  }
} 