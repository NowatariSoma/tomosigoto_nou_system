import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactService } from '@/features/contact/services/contact-service';

// fetchApiをモック
const mockFetchApi = vi.fn();
vi.mock('@/lib/api', () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

describe('ContactService', () => {
  let service: ContactService;

  beforeEach(() => {
    service = new ContactService();
    vi.clearAllMocks();
  });

  // ヘルパー: レスポンスモックを作成
  function mockJsonResponse(data: unknown) {
    return { json: vi.fn().mockResolvedValue(data) };
  }

  describe('createContact', () => {
    it('お問い合わせを作成する', async () => {
      const requestData = {
        category: 'bug' as const,
        content: 'ログイン画面でエラーが発生します',
      };
      const mockResult = {
        id: 'contact-1',
        user_id: 'user-1',
        name: '田中太郎',
        category: 'bug',
        content: 'ログイン画面でエラーが発生します',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockResult));

      const result = await service.createContact(requestData);
      expect(result.id).toBe('contact-1');
      expect(result.category).toBe('bug');
      expect(result.content).toBe('ログイン画面でエラーが発生します');
      expect(result.status).toBe('pending');
      expect(mockFetchApi).toHaveBeenCalledWith('/contacts/', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    });

    it('カテゴリ「feature」でお問い合わせを作成する', async () => {
      const requestData = {
        category: 'feature' as const,
        content: '新しい機能を追加してほしい',
      };
      const mockResult = {
        id: 'contact-2',
        user_id: 'user-1',
        category: 'feature',
        content: '新しい機能を追加してほしい',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockResult));

      const result = await service.createContact(requestData);
      expect(result.id).toBe('contact-2');
      expect(result.category).toBe('feature');
      expect(mockFetchApi).toHaveBeenCalledWith('/contacts/', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    });

    it('カテゴリ「question」でお問い合わせを作成する', async () => {
      const requestData = {
        category: 'question' as const,
        content: '使い方を教えてください',
      };
      const mockResult = {
        id: 'contact-3',
        user_id: 'user-1',
        category: 'question',
        content: '使い方を教えてください',
        status: 'pending',
      };
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockResult));

      const result = await service.createContact(requestData);
      expect(result.category).toBe('question');
    });

    it('カテゴリ「other」でお問い合わせを作成する', async () => {
      const requestData = {
        category: 'other' as const,
        content: 'その他のお問い合わせ',
      };
      const mockResult = {
        id: 'contact-4',
        user_id: 'user-1',
        category: 'other',
        content: 'その他のお問い合わせ',
        status: 'pending',
      };
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockResult));

      const result = await service.createContact(requestData);
      expect(result.category).toBe('other');
    });

    it('APIエラー時に例外をスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Server error'));

      await expect(
        service.createContact({
          category: 'bug',
          content: 'エラーテスト',
        })
      ).rejects.toThrow('Server error');
    });

    it('ネットワークエラー時に例外をスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Network error'));

      await expect(
        service.createContact({
          category: 'question',
          content: 'ネットワークエラーテスト',
        })
      ).rejects.toThrow('Network error');
    });
  });
});
