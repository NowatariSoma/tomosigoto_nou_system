/**
 * API呼び出しのためのカスタムフックを提供するモジュール
 * Fresh（Deno）では標準的なReactフックは使えないため、
 * このファイルではAPIクライアントを操作するためのユーティリティ関数を定義します。
 * 
 * @module lib/hooks/useApi
 */

import { ApiClient } from "../api/client.ts";
import { ApiResponse, PaginatedResponse } from "../../types/api.ts";
import { AsyncData } from "../../types/utility.ts";

/**
 * API通信のステータスを追跡するためのステート型
 * @template T データの型
 */
export type ApiState<T> = AsyncData<T>;

/**
 * ページネーション状態を管理するインターフェース
 * @template T アイテムの型
 */
export interface PaginationState<T> {
  /** 現在のページ番号 */
  page: number;
  /** ページサイズ */
  pageSize: number;
  /** 合計アイテム数 */
  total: number;
  /** アイテムリスト */
  items: T[];
  /** 続きがあるかどうか */
  hasMore: boolean;
  /** ロード中フラグ */
  loading: boolean;
  /** エラー情報 */
  error: Error | null;
}

/**
 * APIリクエストを実行するためのヘルパー関数
 * @param client APIクライアント
 * @param method リクエストメソッド
 * @param path エンドポイントパス
 * @param params リクエストパラメータ
 * @returns 非同期データステート
 */
export async function fetchFromApi<T>(
  client: ApiClient,
  method: "get" | "post" | "put" | "delete",
  path: string,
  params?: any
): Promise<ApiState<T>> {
  try {
    let response: ApiResponse<T>;

    switch (method) {
      case "get":
        response = await client.get<T>(path, params);
        break;
      case "post":
        response = await client.post<T>(path, params);
        break;
      case "put":
        response = await client.put<T>(path, params);
        break;
      case "delete":
        response = await client.delete<T>(path);
        break;
    }

    return {
      status: "success",
      data: response.data,
    };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * ページネーションAPIリクエストのためのヘルパー関数
 * @param client APIクライアント
 * @param path エンドポイントパス
 * @param page ページ番号
 * @param pageSize ページサイズ
 * @param additionalParams 追加パラメータ
 * @returns ページネーション状態
 */
export async function fetchPaginatedData<T>(
  client: ApiClient,
  path: string,
  page: number,
  pageSize: number,
  additionalParams: Record<string, any> = {}
): Promise<PaginationState<T>> {
  try {
    const params = {
      page,
      pageSize,
      ...additionalParams,
    };

    const response = await client.get<PaginatedResponse<T>>(path, params);
    const { items, total, hasMore } = response.data;

    return {
      page,
      pageSize,
      total,
      items,
      hasMore,
      loading: false,
      error: null,
    };
  } catch (error) {
    return {
      page,
      pageSize,
      total: 0,
      items: [],
      hasMore: false,
      loading: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
} 