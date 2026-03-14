import { fetchApi } from '@/lib/api';
import { API_ENDPOINTS } from '../constants';
import type {
  YouTubeOAuthAuthorizeResponse,
  YouTubeOAuthStatusResponse,
} from '../types/material_types';

/**
 * YouTube OAuth 認証用サービス
 * システム管理者によるYouTube連携の開始・状態確認を行う
 */
export class YouTubeOAuthService {
  private readonly basePath = API_ENDPOINTS.YOUTUBE_OAUTH;

  /**
   * 認証開始用のURLを取得する
   * 返却された authorization_url をブラウザで開くことでGoogle認証が開始される
   */
  async getAuthorizeUrl(): Promise<YouTubeOAuthAuthorizeResponse> {
    const response = await fetchApi(`${this.basePath}/authorize`);
    return response.json();
  }

  /**
   * 現在のYouTube OAuth認証状態を取得する
   */
  async getStatus(): Promise<YouTubeOAuthStatusResponse> {
    const response = await fetchApi(`${this.basePath}/status`);
    return response.json();
  }
}
