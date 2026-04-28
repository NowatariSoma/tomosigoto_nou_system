import { fetchApi } from '../../../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  first_name_katakana: string;
  last_name_katakana: string;
  first_name_kanji: string;
  last_name_kanji: string;
  created_at: string;
  updated_at: string;
}

export class UserService {
  async getUsers(): Promise<User[]> {
    const response = await fetchApi('/users/profiles');
    const data = await response.json();
    return (data || []).map((profile: any) => ({
      id: profile.user_id || profile.id,
      name: `${profile.last_name_katakana} ${profile.first_name_katakana}`,
      email: profile.email,
      first_name_katakana: profile.first_name_katakana,
      last_name_katakana: profile.last_name_katakana,
      first_name_kanji: profile.first_name_kanji,
      last_name_kanji: profile.last_name_kanji,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    }));
  }

  async searchUsersByName(firstName: string, lastName: string): Promise<User[]> {
    // どちらも入力されていない場合は全件取得
    if (!firstName.trim() && !lastName.trim()) {
      return this.getUsers();
    }

    const params = new URLSearchParams();
    if (lastName.trim()) params.set('last_name', lastName.trim());
    if (firstName.trim()) params.set('first_name', firstName.trim());

    const response = await fetchApi(`/users/profiles?${params.toString()}`);
    const data = await response.json();

    return (data || []).map((profile: any) => ({
      id: profile.user_id || profile.id,
      name: `${profile.last_name_katakana} ${profile.first_name_katakana}`,
      email: profile.email,
      first_name_katakana: profile.first_name_katakana,
      last_name_katakana: profile.last_name_katakana,
      first_name_kanji: profile.first_name_kanji,
      last_name_kanji: profile.last_name_kanji,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    }));
  }

  async getUser(id: string): Promise<User> {
    const response = await fetchApi(`/users/profiles/${id}`);
    const data = await response.json();
    return {
      id: data.user_id || data.id,
      name: `${data.last_name_katakana} ${data.first_name_katakana}`,
      email: data.email,
      first_name_katakana: data.first_name_katakana,
      last_name_katakana: data.last_name_katakana,
      first_name_kanji: data.first_name_kanji,
      last_name_kanji: data.last_name_kanji,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }
}

export const userService = new UserService();
