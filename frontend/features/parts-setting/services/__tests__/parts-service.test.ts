import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/__mocks__/msw/server';
import { PartsService } from '@/features/parts-setting/services/parts-service';

const API_BASE = 'http://localhost:8000/api/v1';

describe('PartsService', () => {
  let service: PartsService;

  beforeEach(() => {
    service = new PartsService();
  });

  const mockPartResponse = {
    id: 'part-1',
    stage_id: 'stage-1',
    name: 'シテ',
    description: 'メインの役',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  const mockPartResponse2 = {
    id: 'part-2',
    stage_id: 'stage-1',
    name: 'ワキ',
    description: 'サブの役',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  const expectedPartData = {
    id: 'part-1',
    stageId: 'stage-1',
    name: 'シテ',
    description: 'メインの役',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  };

  describe('getPartsByStageId', () => {
    it('ステージIDに紐づくパート一覧を取得しマッピングする', async () => {
      server.use(
        http.get(`${API_BASE}/parts`, () => {
          return HttpResponse.json([mockPartResponse, mockPartResponse2]);
        })
      );

      const result = await service.getPartsByStageId('stage-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expectedPartData);
      expect(result[1].name).toBe('ワキ');
    });

    it('データが空の場合は空配列を返す', async () => {
      server.use(
        http.get(`${API_BASE}/parts`, () => {
          return HttpResponse.json([]);
        })
      );

      const result = await service.getPartsByStageId('stage-1');
      expect(result).toEqual([]);
    });

    it('エラー発生時に例外をスローする', async () => {
      server.use(
        http.get(`${API_BASE}/parts`, () => {
          return HttpResponse.json({ detail: 'Database error' }, { status: 500 });
        })
      );

      await expect(service.getPartsByStageId('stage-1')).rejects.toThrow();
    });
  });

  describe('getPart', () => {
    it('指定IDのパートを取得しマッピングする', async () => {
      server.use(
        http.get(`${API_BASE}/parts/part-1`, () => {
          return HttpResponse.json(mockPartResponse);
        })
      );

      const result = await service.getPart('part-1');
      expect(result).toEqual(expectedPartData);
    });

    it('エラー発生時に例外をスローする', async () => {
      server.use(
        http.get(`${API_BASE}/parts/invalid-id`, () => {
          return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
        })
      );

      await expect(service.getPart('invalid-id')).rejects.toThrow();
    });
  });

  describe('createPart', () => {
    it('パートを作成しマッピングされた結果を返す', async () => {
      server.use(
        http.post(`${API_BASE}/parts`, () => {
          return HttpResponse.json(mockPartResponse);
        })
      );

      const result = await service.createPart({
        stageId: 'stage-1',
        name: 'シテ',
        description: 'メインの役',
      });

      expect(result).toEqual(expectedPartData);
    });

    it('エラー発生時に例外をスローする', async () => {
      server.use(
        http.post(`${API_BASE}/parts`, () => {
          return HttpResponse.json({ detail: 'Insert failed' }, { status: 500 });
        })
      );

      await expect(
        service.createPart({ stageId: 'stage-1', name: 'シテ' })
      ).rejects.toThrow();
    });
  });

  describe('createParts', () => {
    it('空配列の場合は空配列を返す', async () => {
      const result = await service.createParts([]);
      expect(result).toEqual([]);
    });

    it('複数パートを一括作成する', async () => {
      server.use(
        http.post(`${API_BASE}/parts/bulk`, () => {
          return HttpResponse.json([mockPartResponse, mockPartResponse2]);
        })
      );

      const result = await service.createParts([
        { stageId: 'stage-1', name: 'シテ', description: 'メインの役' },
        { stageId: 'stage-1', name: 'ワキ', description: 'サブの役' },
      ]);

      expect(result).toHaveLength(2);
    });
  });

  describe('updatePart', () => {
    it('パートを更新しマッピングされた結果を返す', async () => {
      const updatedResponse = { ...mockPartResponse, name: '更新済みパート' };
      server.use(
        http.put(`${API_BASE}/parts/part-1`, () => {
          return HttpResponse.json(updatedResponse);
        })
      );

      const result = await service.updatePart('part-1', { name: '更新済みパート' });
      expect(result.name).toBe('更新済みパート');
    });
  });

  describe('deletePart', () => {
    it('指定IDのパートを削除する', async () => {
      server.use(
        http.delete(`${API_BASE}/parts/part-1`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(service.deletePart('part-1')).resolves.not.toThrow();
    });
  });

  describe('deleteParts', () => {
    it('空配列の場合はAPIを呼ばずに終了する', async () => {
      const result = service.deleteParts([]);
      await expect(result).resolves.not.toThrow();
    });
  });
});
