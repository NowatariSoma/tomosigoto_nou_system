import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/__mocks__/msw/server';
import { StageService } from '@/features/parts-setting/services/stage-service';

const API_BASE = 'http://localhost:8000/api/v1';

describe('StageService', () => {
  let service: StageService;

  beforeEach(() => {
    service = new StageService();
  });

  const mockSupabaseStageResponse = {
    id: 'stage-1',
    name: '春の公演',
    performance_date: '2024-04-15',
    status: 'active',
    description: '',
    parts: [
      {
        id: 'part-1',
        name: 'シテ',
        member_assignments: [
          { user_id: 'user-1', category: 'main', display_order: 1 },
        ],
      },
    ],
  };

  describe('getStages', () => {
    it('アクティブなステージ一覧をパート付きで取得しマッピングする', async () => {
      server.use(
        http.get(`${API_BASE}/stages`, () => {
          return HttpResponse.json([mockSupabaseStageResponse]);
        })
      );

      const result = await service.getStages();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('stage-1');
      expect(result[0].stageName).toBe('春の公演');
      expect(result[0].parts).toEqual(['シテ']);
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
    it('指定IDのステージをパート付きで取得しマッピングする', async () => {
      server.use(
        http.get(`${API_BASE}/stages/stage-1`, () => {
          return HttpResponse.json(mockSupabaseStageResponse);
        })
      );

      const result = await service.getStage('stage-1');

      expect(result.id).toBe('stage-1');
      expect(result.stageName).toBe('春の公演');
      expect(result.parts).toEqual(['シテ']);
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
    it('ステージとパートを作成し、作成結果を取得して返す', async () => {
      server.use(
        http.post(`${API_BASE}/stages`, () => {
          return HttpResponse.json({ id: 'stage-1', name: '春の公演', performance_date: '2024-04-15', status: 'active' });
        }),
        http.get(`${API_BASE}/stages/stage-1`, () => {
          return HttpResponse.json(mockSupabaseStageResponse);
        })
      );

      const result = await service.createStage({
        date: '2024-04-15',
        stageName: '春の公演',
        description: '春季公演',
        status: 'active',
        parts: ['シテ', 'ワキ'],
        partCount: 2,
      });

      expect(result.id).toBe('stage-1');
      expect(result.stageName).toBe('春の公演');
    });

    it('ステージ作成時にエラーが発生した場合に例外をスローする', async () => {
      server.use(
        http.post(`${API_BASE}/stages`, () => {
          return HttpResponse.json({ detail: 'Stage insert failed' }, { status: 500 });
        })
      );

      await expect(
        service.createStage({
          date: '2024-04-15',
          stageName: '春の公演',
          status: 'active',
          parts: ['シテ'],
          partCount: 1,
        })
      ).rejects.toThrow();
    });
  });

  describe('updateStage', () => {
    it('ステージを更新して結果を返す', async () => {
      server.use(
        http.put(`${API_BASE}/stages/stage-1`, () => {
          return new HttpResponse(null, { status: 204 });
        }),
        http.get(`${API_BASE}/stages/stage-1`, () => {
          return HttpResponse.json(mockSupabaseStageResponse);
        })
      );

      const result = await service.updateStage('stage-1', {
        date: '2024-05-01',
        stageName: '更新済み公演',
        status: 'active',
        parts: ['シテ', 'ワキ', '囃子'],
        partCount: 3,
      });

      expect(result.id).toBe('stage-1');
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
