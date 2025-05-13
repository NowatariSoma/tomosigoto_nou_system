/**
 * APIとの通信を行うクライアントクラスを提供するモジュール
 * 
 * @module lib/api/client
 */

import { ApiResponse, ApiError } from "../../types/api.ts";
import { config } from "../../config/index.ts";

/**
 * APIリクエスト送信の基本クラス
 */
export class ApiClient {
  /** APIのベースURL */
  private baseUrl: string;
  /** リクエストヘッダー */
  private headers: Record<string, string>;

  /**
   * APIクライアントを初期化します
   * @param baseUrl ベースURL（省略時は設定ファイルの値を使用）
   * @param headers カスタムヘッダー
   */
  constructor(
    baseUrl: string = config.apiBaseUrl,
    headers: Record<string, string> = {}
  ) {
    this.baseUrl = baseUrl;
    this.headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...headers,
    };
  }

  /**
   * 認証トークンを設定します
   * @param token 認証トークン
   */
  public setAuthToken(token: string): void {
    this.headers["Authorization"] = `Bearer ${token}`;
  }

  /**
   * GETリクエストを送信します
   * @param path エンドポイントパス
   * @param params クエリパラメータ
   * @returns APIレスポンス
   */
  public async get<T>(
    path: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, params);
    const response = await fetch(url, {
      method: "GET",
      headers: this.headers,
    });
    return this.handleResponse<T>(response);
  }

  /**
   * POSTリクエストを送信します
   * @param path エンドポイントパス
   * @param data リクエストボディ
   * @returns APIレスポンス
   */
  public async post<T>(
    path: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: "POST",
      headers: this.headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  /**
   * PUTリクエストを送信します
   * @param path エンドポイントパス
   * @param data リクエストボディ
   * @returns APIレスポンス
   */
  public async put<T>(
    path: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: "PUT",
      headers: this.headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  /**
   * DELETEリクエストを送信します
   * @param path エンドポイントパス
   * @returns APIレスポンス
   */
  public async delete<T>(path: string): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.headers,
    });
    return this.handleResponse<T>(response);
  }

  /**
   * URLを構築します
   * @param path エンドポイントパス
   * @param params クエリパラメータ
   * @returns 完全なURL
   */
  private buildUrl(path: string, params?: Record<string, any>): string {
    const url = new URL(`${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  /**
   * レスポンスを処理します
   * @param response Fetchレスポンス
   * @returns 処理済みAPIレスポンス
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      await this.handleError(response);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await response.json();
      return {
        data: json.data as T,
        status: response.status,
        message: json.message || "Success",
        timestamp: new Date(json.timestamp || Date.now()),
      };
    }

    throw new Error(`Unsupported content type: ${contentType}`);
  }

  /**
   * エラーを処理します
   * @param response エラーレスポンス
   */
  private async handleError(response: Response): Promise<never> {
    const contentType = response.headers.get("content-type") || "";
    let errorDetail: ApiError;

    if (contentType.includes("application/json")) {
      try {
        const json = await response.json();
        errorDetail = {
          code: json.code || `ERROR_${response.status}`,
          message: json.message || response.statusText,
          details: json.details || null,
        };
      } catch (e) {
        errorDetail = {
          code: `ERROR_${response.status}`,
          message: response.statusText,
          details: null,
        };
      }
    } else {
      const text = await response.text();
      errorDetail = {
        code: `ERROR_${response.status}`,
        message: response.statusText,
        details: text,
      };
    }

    throw new Error(
      `API Error: ${errorDetail.code} - ${errorDetail.message}`,
      { cause: errorDetail }
    );
  }
} 