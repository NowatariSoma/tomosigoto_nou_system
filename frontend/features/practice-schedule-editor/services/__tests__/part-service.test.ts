import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PartService } from '@/features/practice-schedule-editor/services/part-service';

// fetchApiをモック
const mockFetchApi = vi.fn();
vi.mock('@/lib/api', () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

describe('PartService', () => {
  let service: PartService;

  beforeEach(() => {
    service = new PartService();
    vi.clearAllMocks();
  });

  // ヘルパー: レスポンスモックを作成
  function mockJsonResponse(data: unknown) {
    return { json: vi.fn().mockResolvedValue(data) };
  }

  const mockParts = [
    {
      id: 'part-1',
      name: 'シテ',
      stage_id: 'stage-1',
      description: '主役',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
    {
      id: 'part-2',
      name: 'ワキ',
      stage_id: 'stage-1',
      description: '脇役',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ];

  describe('getAllParts', () => {
    it('パート一覧を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockParts));

      const result = await service.getAllParts();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('part-1');
      expect(result[0].name).toBe('シテ');
      expect(result[0].stage_id).toBe('stage-1');
      expect(result[1].id).toBe('part-2');
      expect(result[1].name).toBe('ワキ');
      expect(mockFetchApi).toHaveBeenCalledWith('/parts/');
    });

    it('空の配列を返す場合も正常に動作する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([]));

      const result = await service.getAllParts();
      expect(result).toHaveLength(0);
    });

    it('APIエラー時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Network error'));

      await expect(service.getAllParts()).rejects.toThrow('Network error');
    });
  });
});
