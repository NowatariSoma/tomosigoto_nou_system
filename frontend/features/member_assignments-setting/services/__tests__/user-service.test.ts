import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient, createMockSupabaseQuery } from '@/__mocks__/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

import { UserService } from '@/features/member_assignments-setting/services/user-service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
    vi.clearAllMocks();
  });

  // テスト用プロフィールデータ
  const mockProfileResponse1 = {
    user_id: 'user-1',
    first_name_katakana: 'タロウ',
    last_name_katakana: 'タナカ',
    first_name_kanji: '太郎',
    last_name_kanji: '田中',
    email: 'tanaka@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockProfileResponse2 = {
    user_id: 'user-2',
    first_name_katakana: 'ハナコ',
    last_name_katakana: 'スズキ',
    first_name_kanji: '花子',
    last_name_kanji: '鈴木',
    email: 'suzuki@example.com',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  describe('getUsers', () => {
    it('ユーザー一覧を正常に取得しマッピングする', async () => {
      const query = createMockSupabaseQuery({
        data: [mockProfileResponse1, mockProfileResponse2],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.getUsers();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('account_setting_profile');
      expect(query.select).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('user-1');
      expect(result[0].name).toBe('タナカ タロウ');
      expect(result[0].email).toBe('tanaka@example.com');
      expect(result[0].first_name_katakana).toBe('タロウ');
      expect(result[0].last_name_katakana).toBe('タナカ');
      expect(result[0].first_name_kanji).toBe('太郎');
      expect(result[0].last_name_kanji).toBe('田中');
      expect(result[1].id).toBe('user-2');
      expect(result[1].name).toBe('スズキ ハナコ');
    });

    it('エラー時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Database error' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(service.getUsers()).rejects.toThrow(
        'Failed to fetch users: Database error'
      );
    });

    it('データが空の場合は空配列を返す', async () => {
      const query = createMockSupabaseQuery({
        data: [],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.getUsers();
      expect(result).toEqual([]);
    });
  });

  describe('searchUsersByName', () => {
    it('姓と名の両方で検索する', async () => {
      const query = createMockSupabaseQuery({
        data: [mockProfileResponse1],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.searchUsersByName('タロウ', 'タナカ');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('account_setting_profile');
      expect(query.ilike).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user-1');
      expect(result[0].name).toBe('タナカ タロウ');
    });

    it('姓のみで検索する', async () => {
      const query = createMockSupabaseQuery({
        data: [mockProfileResponse1],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.searchUsersByName('', 'タナカ');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('タナカ タロウ');
    });

    it('名のみで検索する', async () => {
      const query = createMockSupabaseQuery({
        data: [mockProfileResponse1],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.searchUsersByName('タロウ', '');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('タナカ タロウ');
    });

    it('両方空の場合はgetUsersを呼び出す', async () => {
      const query = createMockSupabaseQuery({
        data: [mockProfileResponse1, mockProfileResponse2],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.searchUsersByName('', '');

      // getUsers が呼ばれるため、account_setting_profile へのクエリが実行される
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('account_setting_profile');
      expect(result).toHaveLength(2);
    });

    it('空白文字のみの場合もgetUsersを呼び出す', async () => {
      const query = createMockSupabaseQuery({
        data: [mockProfileResponse1],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.searchUsersByName('  ', '  ');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('account_setting_profile');
      expect(result).toHaveLength(1);
    });

    it('エラー時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Search failed' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(service.searchUsersByName('タロウ', 'タナカ')).rejects.toThrow(
        'Failed to search users: Search failed'
      );
    });

    it('検索結果が空の場合は空配列を返す', async () => {
      const query = createMockSupabaseQuery({
        data: [],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.searchUsersByName('存在しない', '名前');
      expect(result).toEqual([]);
    });
  });

  describe('getUser', () => {
    it('指定IDのユーザーを正常に取得する', async () => {
      const query = createMockSupabaseQuery({
        data: mockProfileResponse1,
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.getUser('user-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('account_setting_profile');
      expect(query.select).toHaveBeenCalled();
      expect(result.id).toBe('user-1');
      expect(result.name).toBe('タナカ タロウ');
      expect(result.email).toBe('tanaka@example.com');
      expect(result.first_name_katakana).toBe('タロウ');
      expect(result.last_name_katakana).toBe('タナカ');
      expect(result.first_name_kanji).toBe('太郎');
      expect(result.last_name_kanji).toBe('田中');
      expect(result.created_at).toBe('2024-01-01T00:00:00Z');
      expect(result.updated_at).toBe('2024-01-01T00:00:00Z');
    });

    it('エラー時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'User not found' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(service.getUser('invalid-id')).rejects.toThrow(
        'Failed to fetch user: User not found'
      );
    });
  });
});
