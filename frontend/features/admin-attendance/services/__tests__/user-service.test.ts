import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminUserService } from '@/features/admin-attendance/services/user-service';

// fetchApiをモック
const mockFetchApi = vi.fn();
vi.mock('@/lib/api', () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

describe('AdminUserService', () => {
  let service: AdminUserService;

  beforeEach(() => {
    service = new AdminUserService();
    vi.clearAllMocks();
  });

  // ヘルパー: レスポンスモックを作成
  function mockJsonResponse(data: unknown) {
    return { json: vi.fn().mockResolvedValue(data) };
  }

  describe('getUsers', () => {
    it('ユーザー一覧を取得し漢字名でフォーマットする', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([
        {
          id: 'user-1',
          email: 'tanaka@example.com',
          first_name_kanji: '太郎',
          last_name_kanji: '田中',
          first_name_katakana: 'タロウ',
          last_name_katakana: 'タナカ',
        },
      ]));

      const result = await service.getUsers();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user-1');
      expect(result[0].name).toBe('田中 太郎');
      expect(result[0].email).toBe('tanaka@example.com');
      expect(result[0].first_name_kanji).toBe('太郎');
      expect(result[0].last_name_kanji).toBe('田中');
      expect(mockFetchApi).toHaveBeenCalledWith('/users/');
    });

    it('漢字名がない場合はカタカナ名でフォーマットする', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([
        {
          id: 'user-2',
          email: 'suzuki@example.com',
          first_name_kanji: null,
          last_name_kanji: null,
          first_name_katakana: 'ハナコ',
          last_name_katakana: 'スズキ',
        },
      ]));

      const result = await service.getUsers();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('スズキ ハナコ');
    });

    it('名前情報がない場合はemailを使用する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([
        {
          id: 'user-3',
          email: 'noname@example.com',
          first_name_kanji: null,
          last_name_kanji: null,
          first_name_katakana: null,
          last_name_katakana: null,
        },
      ]));

      const result = await service.getUsers();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('noname@example.com');
    });

    it('名前もemailもない場合はidを使用する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([
        {
          id: 'user-4',
          email: null,
          first_name_kanji: null,
          last_name_kanji: null,
          first_name_katakana: null,
          last_name_katakana: null,
        },
      ]));

      const result = await service.getUsers();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('user-4');
    });

    it('全ての情報がない場合は「名前未設定」を使用する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([
        {
          id: null,
          email: null,
          first_name_kanji: null,
          last_name_kanji: null,
          first_name_katakana: null,
          last_name_katakana: null,
        },
      ]));

      const result = await service.getUsers();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('名前未設定');
    });

    it('emailがundefinedの場合は空文字を返す', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([
        {
          id: 'user-5',
          first_name_kanji: '一郎',
          last_name_kanji: '佐藤',
        },
      ]));

      const result = await service.getUsers();
      expect(result[0].email).toBe('');
    });

    it('レスポンスがnullの場合は空配列を返す', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(null));

      const result = await service.getUsers();
      expect(result).toEqual([]);
    });

    it('空配列のレスポンスを正しく処理する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([]));

      const result = await service.getUsers();
      expect(result).toEqual([]);
    });

    it('APIエラー時に例外をスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Network error'));

      await expect(service.getUsers()).rejects.toThrow('Network error');
    });
  });

  describe('formatUserName', () => {
    it('漢字の姓名がある場合は漢字名を返す', () => {
      const result = service.formatUserName({
        last_name_kanji: '田中',
        first_name_kanji: '太郎',
        last_name_katakana: 'タナカ',
        first_name_katakana: 'タロウ',
        email: 'tanaka@example.com',
        id: 'user-1',
      });
      expect(result).toBe('田中 太郎');
    });

    it('漢字名がなくカタカナ名がある場合はカタカナ名を返す', () => {
      const result = service.formatUserName({
        last_name_kanji: null,
        first_name_kanji: null,
        last_name_katakana: 'タナカ',
        first_name_katakana: 'タロウ',
        email: 'tanaka@example.com',
        id: 'user-1',
      });
      expect(result).toBe('タナカ タロウ');
    });

    it('名前がない場合はemailを返す', () => {
      const result = service.formatUserName({
        last_name_kanji: null,
        first_name_kanji: null,
        last_name_katakana: null,
        first_name_katakana: null,
        email: 'test@example.com',
        id: 'user-1',
      });
      expect(result).toBe('test@example.com');
    });

    it('名前もemailもない場合はidを返す', () => {
      const result = service.formatUserName({
        id: 'user-fallback',
      });
      expect(result).toBe('user-fallback');
    });

    it('全ての情報がない場合は「名前未設定」を返す', () => {
      const result = service.formatUserName({});
      expect(result).toBe('名前未設定');
    });
  });
});
