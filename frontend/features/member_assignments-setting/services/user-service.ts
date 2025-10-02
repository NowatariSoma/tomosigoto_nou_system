import { supabase } from '../../../lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export class UserService {
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, created_at, updated_at, raw_user_meta_data')
      .order('email', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return (data || []).map(user => ({
      id: user.id,
      name: user.raw_user_meta_data?.name || user.raw_user_meta_data?.full_name || 'Unknown User',
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));
  }

  async getUser(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, created_at, updated_at, raw_user_meta_data')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.raw_user_meta_data?.name || data.raw_user_meta_data?.full_name || 'Unknown User',
      email: data.email,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }
}

export const userService = new UserService();
