import { User } from '../types';
import { API_ENDPOINTS } from '../constants';
import { fetchApi } from '../../../lib/api';

export class AdminUserService {
  private readonly basePath = API_ENDPOINTS.USERS;

  async getUsers(): Promise<User[]> {
    const response = await fetchApi(this.basePath);
    const users = await response.json();
    
    // ユーザー名をフォーマット
    return (users || []).map((user: any) => ({
      id: user.id,
      email: user.email || '',
      name: this.formatUserName(user),
      first_name_kanji: user.first_name_kanji,
      last_name_kanji: user.last_name_kanji,
      first_name_katakana: user.first_name_katakana,
      last_name_katakana: user.last_name_katakana,
    }));
  }

  formatUserName(user: any): string {
    // プロフィール情報から名前を取得
    if (user.last_name_kanji && user.first_name_kanji) {
      return `${user.last_name_kanji} ${user.first_name_kanji}`;
    }
    if (user.last_name_katakana && user.first_name_katakana) {
      return `${user.last_name_katakana} ${user.first_name_katakana}`;
    }
    // 名前情報がない場合はemailを使用
    return user.email || user.id || '名前未設定';
  }
}

export const adminUserService = new AdminUserService();

