import { describe, it, expect } from 'vitest';
import {
  mapStageResponseToStageData,
  mapCreateStageRequestToStage,
} from '@/features/parts-setting/mappers/stage-mapper';

describe('stage-mapper', () => {
  describe('mapStageResponseToStageData', () => {
    it('完全なレスポンスを正しいStageDataにマッピングする', () => {
      const response = {
        id: 'stage-1',
        name: '春の公演',
        performance_date: '2024-04-01',
        status: 'active' as const,
        description: '春の定期公演です',
        parts: [
          { id: 'part-1', name: 'シテ' },
          { id: 'part-2', name: 'ワキ' },
          { id: 'part-3', name: '笛' },
        ],
      };

      const result = mapStageResponseToStageData(response);

      expect(result).toEqual({
        id: 'stage-1',
        date: '2024-04-01',
        stageName: '春の公演',
        description: '春の定期公演です',
        status: 'active',
        parts: ['シテ', 'ワキ', '笛'],
        partCount: 3,
      });
    });

    it('null入力時にデフォルトの空StageDataを返す', () => {
      const result = mapStageResponseToStageData(null);

      expect(result).toEqual({
        id: '',
        date: '',
        stageName: '',
        description: '',
        status: 'active',
        parts: [],
        partCount: 0,
      });
    });

    it('undefined入力時にデフォルトの空StageDataを返す', () => {
      const result = mapStageResponseToStageData(undefined);

      expect(result).toEqual({
        id: '',
        date: '',
        stageName: '',
        description: '',
        status: 'active',
        parts: [],
        partCount: 0,
      });
    });

    it('performance_dateをdateフィールドにマッピングする', () => {
      const response = {
        performance_date: '2024-12-25',
      };

      const result = mapStageResponseToStageData(response);

      expect(result.date).toBe('2024-12-25');
    });

    it('nameをstageNameフィールドにマッピングする', () => {
      const response = {
        name: '秋の発表会',
      };

      const result = mapStageResponseToStageData(response);

      expect(result.stageName).toBe('秋の発表会');
    });

    it('descriptionがundefinedの場合はundefinedのままとなる', () => {
      const response = {
        id: 'stage-1',
        name: 'テスト公演',
      };

      const result = mapStageResponseToStageData(response);

      expect(result.description).toBeUndefined();
    });

    it('statusがinactiveの場合はinactiveを返す', () => {
      const response = {
        status: 'inactive' as const,
      };

      const result = mapStageResponseToStageData(response);

      expect(result.status).toBe('inactive');
    });

    it('statusが未指定の場合はデフォルトでactiveを返す', () => {
      const response = {
        id: 'stage-1',
        name: 'テスト',
      };

      const result = mapStageResponseToStageData(response);

      expect(result.status).toBe('active');
    });

    it('複数のパーツがある場合はパート名の配列を返す', () => {
      const response = {
        parts: [
          { id: 'p-1', name: 'シテ' },
          { id: 'p-2', name: 'ワキ' },
          { id: 'p-3', name: '笛' },
          { id: 'p-4', name: '小鼓' },
          { id: 'p-5', name: '大鼓' },
        ],
      };

      const result = mapStageResponseToStageData(response);

      expect(result.parts).toEqual(['シテ', 'ワキ', '笛', '小鼓', '大鼓']);
      expect(result.partCount).toBe(5);
    });

    it('partsが未指定の場合は空配列とpartCount=0を返す', () => {
      const response = {
        id: 'stage-1',
        name: 'パーツなし公演',
      };

      const result = mapStageResponseToStageData(response);

      expect(result.parts).toEqual([]);
      expect(result.partCount).toBe(0);
    });

    it('member_assignmentsを持つpartsからも名前のみを抽出する', () => {
      const response = {
        parts: [
          {
            id: 'part-1',
            name: 'シテ',
            member_assignments: [
              { user_id: 'user-1', category: 'main', display_order: 1 },
              { user_id: 'user-2', category: 'sub', display_order: 2 },
            ],
          },
          {
            id: 'part-2',
            name: 'ワキ',
            member_assignments: [
              { user_id: 'user-3', category: 'main', display_order: 1 },
            ],
          },
        ],
      };

      const result = mapStageResponseToStageData(response);

      expect(result.parts).toEqual(['シテ', 'ワキ']);
      expect(result.partCount).toBe(2);
    });
  });

  describe('mapCreateStageRequestToStage', () => {
    it('完全なリクエストを正しいSupabase形式にマッピングする', () => {
      const request = {
        date: '2024-04-01',
        stageName: '春の公演',
        description: '春の定期公演です',
        status: 'active' as const,
        parts: ['シテ', 'ワキ'],
        partCount: 2,
      };

      const result = mapCreateStageRequestToStage(request);

      expect(result).toEqual({
        name: '春の公演',
        performance_date: '2024-04-01',
        description: '春の定期公演です',
        status: 'active',
      });
    });

    it('全フィールドが直接マッピングされる', () => {
      const request = {
        date: '2025-01-15',
        stageName: '新年公演',
        description: undefined,
        status: 'inactive' as const,
        parts: [],
        partCount: 0,
      };

      const result = mapCreateStageRequestToStage(request);

      expect(result.name).toBe('新年公演');
      expect(result.performance_date).toBe('2025-01-15');
      expect(result.description).toBeUndefined();
      expect(result.status).toBe('inactive');
    });
  });
});
