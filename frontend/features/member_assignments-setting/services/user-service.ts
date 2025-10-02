import { supabase } from '../../../lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  first_name_katakana: string;
  last_name_katakana: string;
  created_at: string;
  updated_at: string;
}

export class UserService {
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('account_setting_profile')
      .select(`
        user_id,
        first_name_katakana,
        last_name_katakana,
        email,
        created_at,
        updated_at
      `)
      .order('last_name_katakana', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return (data || []).map((profile: any) => ({
      id: profile.user_id,
      name: `${profile.last_name_katakana} ${profile.first_name_katakana}`,
      email: profile.email,
      first_name_katakana: profile.first_name_katakana,
      last_name_katakana: profile.last_name_katakana,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    }));
  }

  async searchUsersByName(firstName: string, lastName: string): Promise<User[]> {
    console.log('Searching users with:', { firstName, lastName });
    
    let query = supabase
      .from('account_setting_profile')
      .select(`
        user_id,
        first_name_katakana,
        last_name_katakana,
        email,
        created_at,
        updated_at
      `);

    // 姓が入力されている場合のみ姓で検索
    if (lastName.trim()) {
      console.log('Adding last name filter:', `%${lastName.trim()}%`);
      query = query.ilike('last_name_katakana', `%${lastName.trim()}%`);
    }

    // 名が入力されている場合のみ名で検索
    if (firstName.trim()) {
      console.log('Adding first name filter:', `%${firstName.trim()}%`);
      query = query.ilike('first_name_katakana', `%${firstName.trim()}%`);
    }

    // どちらも入力されていない場合は全件取得
    if (!firstName.trim() && !lastName.trim()) {
      console.log('No search terms, returning all users');
      return this.getUsers();
    }

    const { data, error } = await query.order('last_name_katakana', { ascending: true });

    if (error) {
      console.error('Search error:', error);
      throw new Error(`Failed to search users: ${error.message}`);
    }

    console.log('Search results:', data?.length || 0, 'users found');
    console.log('Raw data:', data);

    return (data || []).map((profile: any) => ({
      id: profile.user_id,
      name: `${profile.last_name_katakana} ${profile.first_name_katakana}`,
      email: profile.email,
      first_name_katakana: profile.first_name_katakana,
      last_name_katakana: profile.last_name_katakana,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    }));
  }

  async getUser(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('account_setting_profile')
      .select(`
        user_id,
        first_name_katakana,
        last_name_katakana,
        email,
        created_at,
        updated_at
      `)
      .eq('user_id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return {
      id: (data as any).user_id,
      name: `${(data as any).last_name_katakana} ${(data as any).first_name_katakana}`,
      email: (data as any).email,
      first_name_katakana: (data as any).first_name_katakana,
      last_name_katakana: (data as any).last_name_katakana,
      created_at: (data as any).created_at,
      updated_at: (data as any).updated_at
    };
  }
}

export const userService = new UserService();
