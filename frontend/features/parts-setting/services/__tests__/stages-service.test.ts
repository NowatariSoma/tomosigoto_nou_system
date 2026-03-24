import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/__mocks__/msw/server';
import { StagesService } from '@/features/parts-setting/services/stages-service';

const API_BASE = 'http://localhost:8000/api/v1';

describe('StagesService', () => {
  let service: StagesService;

  beforeEach(() => {
    service = new StagesService();
  });

  const mockStageResponse = {
    id: 'stage-1',
    name: '春の公演',
    description: '春季公演です',
    performance_date: '2024-04-15',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  const mockStageResponse2 = {
    id: 'stage-2',
    name: '夏の公演',
    description: '夏季公演です',
    performance_date: '2024-08-15',
    status: 'active',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-02T00:00:00Z',
  };

  const expectedStageData = {
    id: 'stage-1',
    name: '春の公演',
    description: '春季公演です',
    performanceDate: '2024-04-15',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  };

  describe('getStages', () => {
    it('ステージ一覧を取得しマッピングする', async () => {
      server.use(
        http.get(`${API_BASE}/stages`, () => {
          return HttpResponse.json([mockStageResponse, mockStageResponse2]);
        })
      );

      const result = await service.getStages();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expectedStageData);
      expect(result[1].name).toBe('夏の公演');
    });

    it('データが空の場合は空配列を返す', async () => {
      server.use(
        http.get(`${API_BASE}/stages`, () => {
          return HttpResponse.json([]);
        })
      );

      const result = await service.getStages();
      expect(result).toEqual([]);
    });

    it('エラー発生時に例外をスローする', async () => {
      server.use(
        http.get(`${API_BASE}/stages`, () => {
          return HttpResponse.json({ detail: 'Database error' }, { status: 500 });
        })
      );

      await expect(service.getStages()).rejects.toThrow();
    });
  });

  describe('getStage', () => {
    it('指定IDのステージを取得しマッピングする', async () => {
      server.use(
        http.get(`${API_BASE}/stages/stage-1`, () => {
          return HttpResponse.json(mockStageResponse);
        })
      );

      const result = await service.getStage('stage-1');
      expect(result).toEqual(expectedStageData);
    });

    it('エラー発生時に例外をスローする', async () => {
      server.use(
        http.get(`${API_BASE}/stages/invalid-id`, () => {
          return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
        })
      );

      await expect(service.getStage('invalid-id')).rejects.toThrow();
    });
  });

  describe('createStage', () => {
    it('ステージを作成しマッピングされた結果を返す', async () => {
      server.use(
        http.post(`${API_BASE}/stages`, () => {
          return HttpResponse.json(mockStageResponse);
        })
      );

      const result = await service.createStage({
        name: '春の公演',
        description: '春季公演です',
        performanceDate: '2024-04-15',
      });

      expect(result).toEqual(expectedStageData);
    });

    it('statusを指定して作成できる', async () => {
      server.use(
        http.post(`${API_BASE}/stages`, async ({ request }) => {
          const body = await request.json() as any;
          return HttpResponse.json({ ...mockStageResponse, status: body.status });
        })
      );

      const result = await service.createStage({
        name: '春の公演',
        status: 'inactive',
      });

      expect(result.status).toBe('inactive');
    });

    it('エラー発生時に例外をスローする', async () => {
      server.use(
        http.post(`${API_BASE}/stages`, () => {
          return HttpResponse.json({ detail: 'Insert failed' }, { status: 500 });
        })
      );

      await expect(
        service.createStage({ name: '春の公演' })
      ).rejects.toThrow();
    });
  });

  describe('updateStage', () => {
    it('ステージを更新しマッピングされた結果を返す', async () => {
      const updatedResponse = { ...mockStageResponse, name: '更新済み公演' };
      server.use(
        http.put(`${API_BASE}/stages/stage-1`, () => {
          return HttpResponse.json(updatedResponse);
        })
      );

      const result = await service.updateStage('stage-1', { name: '更新済み公演' });
      expect(result.name).toBe('更新済み公演');
    });

    it('エラー発生時に例外をスローする', async () => {
      server.use(
        http.put(`${API_BASE}/stages/stage-1`, () => {
          return HttpResponse.json({ detail: 'Update failed' }, { status: 500 });
        })
      );

      await expect(
        service.updateStage('stage-1', { name: 'テスト' })
      ).rejects.toThrow();
    });
  });

  describe('deleteStage', () => {
    it('指定IDのステージを削除する', async () => {
      server.use(
        http.delete(`${API_BASE}/stages/stage-1`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(service.deleteStage('stage-1')).resolves.not.toThrow();
    });

    it('エラー発生時に例外をスローする', async () => {
      server.use(
        http.delete(`${API_BASE}/stages/stage-1`, () => {
          return HttpResponse.json({ detail: 'Delete failed' }, { status: 500 });
        })
      );

      await expect(service.deleteStage('stage-1')).rejects.toThrow();
    });
  });
});
