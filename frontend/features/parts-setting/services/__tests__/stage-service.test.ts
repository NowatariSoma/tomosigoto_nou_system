import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient, createMockSupabaseQuery } from '@/__mocks__/supabase';

// supabaseモジュールをモック
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

// mappersをモック
const mockMapStageResponseToStageData = vi.fn();
const mockMapCreateStageRequestToStage = vi.fn();
vi.mock('@/features/parts-setting/mappers', () => ({
  mapStageResponseToStageData: (...args: unknown[]) => mockMapStageResponseToStageData(...args),
  mapCreateStageRequestToStage: (...args: unknown[]) => mockMapCreateStageRequestToStage(...args),
}));

import { StageService } from '@/features/parts-setting/services/stage-service';

describe('StageService', () => {
  let service: StageService;

  beforeEach(() => {
    service = new StageService();
    vi.clearAllMocks();
  });

  // テストデータ
  const mockSupabaseStageResponse = {
    id: 'stage-1',
    name: '春の公演',
    performance_date: '2024-04-15',
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

  const mockMappedStageData = {
    id: 'stage-1',
    date: '2024-04-15',
    stageName: '春の公演',
    description: '',
    status: 'active',
    parts: ['シテ'],
    partCount: 1,
  };

  const nestedSelectQuery = expect.stringContaining('id');

  describe('getStages', () => {
    it('アクティブなステージ一覧をネストされたクエリで取得しマッピングする', async () => {
      const query = createMockSupabaseQuery({
        data: [mockSupabaseStageResponse],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);
      mockMapStageResponseToStageData.mockReturnValue(mockMappedStageData);

      const result = await service.getStages();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('stages');
      expect(query.select).toHaveBeenCalled();
      expect(query.eq).toHaveBeenCalledWith('status', 'active');
      expect(query.order).toHaveBeenCalledWith('performance_date', { ascending: false });
      // .map()のコールバックなので第一引数のみ検証
      expect(mockMapStageResponseToStageData).toHaveBeenCalled();
      expect(mockMapStageResponseToStageData.mock.calls[0][0]).toEqual(mockSupabaseStageResponse);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockMappedStageData);
    });

    it('データがnullの場合は空配列を返す', async () => {
      const query = createMockSupabaseQuery({ data: null, error: null });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.getStages();

      expect(result).toEqual([]);
      expect(mockMapStageResponseToStageData).not.toHaveBeenCalled();
    });

    it('エラー発生時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Database error' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(service.getStages()).rejects.toThrow(
        'Failed to fetch stages: Database error'
      );
    });
  });

  describe('getStage', () => {
    it('指定IDのアクティブなステージをネストされたクエリで取得しマッピングする', async () => {
      const query = createMockSupabaseQuery({
        data: mockSupabaseStageResponse,
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);
      mockMapStageResponseToStageData.mockReturnValue(mockMappedStageData);

      const result = await service.getStage('stage-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('stages');
      expect(query.select).toHaveBeenCalled();
      expect(query.eq).toHaveBeenCalledWith('id', 'stage-1');
      expect(query.eq).toHaveBeenCalledWith('status', 'active');
      expect(query.single).toHaveBeenCalled();
      expect(mockMapStageResponseToStageData).toHaveBeenCalledWith(mockSupabaseStageResponse);
      expect(result).toEqual(mockMappedStageData);
    });

    it('エラー発生時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Not found' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(service.getStage('invalid-id')).rejects.toThrow(
        'Failed to fetch stage: Not found'
      );
    });
  });

  describe('createStage', () => {
    it('ステージとパートを作成し、作成結果を取得して返す', async () => {
      const stageInsertData = {
        name: '春の公演',
        performance_date: '2024-04-15',
        description: '春季公演',
        status: 'active',
      };

      mockMapCreateStageRequestToStage.mockReturnValue(stageInsertData);

      // stagesテーブルのinsert用クエリ（single()で解決）
      const stagesInsertQuery = createMockSupabaseQuery({
        data: { id: 'stage-1', ...stageInsertData },
        error: null,
      });

      // partsテーブルのinsert用クエリ（then/awaitで解決）
      const partsInsertQuery = createMockSupabaseQuery({
        data: null,
        error: null,
      });

      // getStage用のクエリ（single()で解決）
      const stagesSelectQuery = createMockSupabaseQuery({
        data: mockSupabaseStageResponse,
        error: null,
      });

      let stagesCallCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'stages') {
          stagesCallCount++;
          // 1回目: insert, 2回目: getStage内のselect
          return stagesCallCount === 1 ? stagesInsertQuery : stagesSelectQuery;
        }
        if (table === 'parts') {
          return partsInsertQuery;
        }
        return createMockSupabaseQuery();
      });

      mockMapStageResponseToStageData.mockReturnValue(mockMappedStageData);

      const result = await service.createStage({
        date: '2024-04-15',
        stageName: '春の公演',
        description: '春季公演',
        status: 'active',
        parts: ['シテ', 'ワキ'],
        partCount: 2,
      });

      expect(mockMapCreateStageRequestToStage).toHaveBeenCalled();
      expect(stagesInsertQuery.insert).toHaveBeenCalledWith(stageInsertData);
      expect(stagesInsertQuery.select).toHaveBeenCalled();
      expect(stagesInsertQuery.single).toHaveBeenCalled();
      expect(partsInsertQuery.insert).toHaveBeenCalledWith([
        { stage_id: 'stage-1', name: 'シテ', status: 'active' },
        { stage_id: 'stage-1', name: 'ワキ', status: 'active' },
      ]);
      expect(result).toEqual(mockMappedStageData);
    });

    it('パートなしでステージのみを作成できる', async () => {
      const stageInsertData = {
        name: '春の公演',
        performance_date: '2024-04-15',
        status: 'active',
      };

      mockMapCreateStageRequestToStage.mockReturnValue(stageInsertData);

      const stagesInsertQuery = createMockSupabaseQuery({
        data: { id: 'stage-1', ...stageInsertData },
        error: null,
      });

      const stagesSelectQuery = createMockSupabaseQuery({
        data: { ...mockSupabaseStageResponse, parts: [] },
        error: null,
      });

      let stagesCallCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'stages') {
          stagesCallCount++;
          return stagesCallCount === 1 ? stagesInsertQuery : stagesSelectQuery;
        }
        return createMockSupabaseQuery();
      });

      mockMapStageResponseToStageData.mockReturnValue({
        ...mockMappedStageData,
        parts: [],
        partCount: 0,
      });

      const result = await service.createStage({
        date: '2024-04-15',
        stageName: '春の公演',
        status: 'active',
        parts: [],
        partCount: 0,
      });

      // partsテーブルへのinsertは呼ばれない
      expect(mockSupabaseClient.from).not.toHaveBeenCalledWith('parts');
      expect(result.parts).toEqual([]);
    });

    it('ステージ作成時にエラーが発生した場合に例外をスローする', async () => {
      mockMapCreateStageRequestToStage.mockReturnValue({ name: '春の公演' });

      const stagesInsertQuery = createMockSupabaseQuery({
        data: null,
        error: { message: 'Stage insert failed' },
      });
      mockSupabaseClient.from.mockReturnValue(stagesInsertQuery);

      await expect(
        service.createStage({
          date: '2024-04-15',
          stageName: '春の公演',
          status: 'active',
          parts: ['シテ'],
          partCount: 1,
        })
      ).rejects.toThrow('Failed to create stage: Stage insert failed');
    });

    it('パート作成時にエラーが発生した場合に例外をスローする', async () => {
      const stageInsertData = { name: '春の公演' };
      mockMapCreateStageRequestToStage.mockReturnValue(stageInsertData);

      const stagesInsertQuery = createMockSupabaseQuery({
        data: { id: 'stage-1', name: '春の公演' },
        error: null,
      });

      const partsInsertQuery = createMockSupabaseQuery({
        data: null,
        error: { message: 'Parts insert failed' },
      });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'stages') return stagesInsertQuery;
        if (table === 'parts') return partsInsertQuery;
        return createMockSupabaseQuery();
      });

      await expect(
        service.createStage({
          date: '2024-04-15',
          stageName: '春の公演',
          status: 'active',
          parts: ['シテ'],
          partCount: 1,
        })
      ).rejects.toThrow('Failed to create parts: Parts insert failed');
    });
  });

  describe('updateStage', () => {
    it('ステージを更新し、既存パートを削除して新しいパートを作成する', async () => {
      const stageUpdateData = {
        name: '更新済み公演',
        performance_date: '2024-05-01',
        status: 'active',
      };

      mockMapCreateStageRequestToStage.mockReturnValue(stageUpdateData);

      // stagesテーブルのupdate用クエリ
      const stagesUpdateQuery = createMockSupabaseQuery({
        data: null,
        error: null,
      });

      // partsテーブルのdelete用クエリ
      const partsDeleteQuery = createMockSupabaseQuery({
        data: null,
        error: null,
      });

      // partsテーブルのinsert用クエリ
      const partsInsertQuery = createMockSupabaseQuery({
        data: null,
        error: null,
      });

      // getStage用のクエリ
      const stagesSelectQuery = createMockSupabaseQuery({
        data: mockSupabaseStageResponse,
        error: null,
      });

      let stagesCallCount = 0;
      let partsCallCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'stages') {
          stagesCallCount++;
          // 1回目: update, 2回目: getStage内のselect
          return stagesCallCount === 1 ? stagesUpdateQuery : stagesSelectQuery;
        }
        if (table === 'parts') {
          partsCallCount++;
          // 1回目: delete, 2回目: insert
          return partsCallCount === 1 ? partsDeleteQuery : partsInsertQuery;
        }
        return createMockSupabaseQuery();
      });

      mockMapStageResponseToStageData.mockReturnValue(mockMappedStageData);

      const result = await service.updateStage('stage-1', {
        date: '2024-05-01',
        stageName: '更新済み公演',
        status: 'active',
        parts: ['シテ', 'ワキ', '囃子'],
        partCount: 3,
      });

      expect(mockMapCreateStageRequestToStage).toHaveBeenCalled();
      expect(stagesUpdateQuery.update).toHaveBeenCalledWith(stageUpdateData);
      expect(stagesUpdateQuery.eq).toHaveBeenCalledWith('id', 'stage-1');
      expect(partsDeleteQuery.delete).toHaveBeenCalled();
      expect(partsDeleteQuery.eq).toHaveBeenCalledWith('stage_id', 'stage-1');
      expect(partsInsertQuery.insert).toHaveBeenCalledWith([
        { stage_id: 'stage-1', name: 'シテ', status: 'active' },
        { stage_id: 'stage-1', name: 'ワキ', status: 'active' },
        { stage_id: 'stage-1', name: '囃子', status: 'active' },
      ]);
      expect(result).toEqual(mockMappedStageData);
    });

    it('ステージ更新時にエラーが発生した場合に例外をスローする', async () => {
      mockMapCreateStageRequestToStage.mockReturnValue({ name: '更新' });

      const stagesUpdateQuery = createMockSupabaseQuery({
        data: null,
        error: { message: 'Stage update failed' },
      });
      mockSupabaseClient.from.mockReturnValue(stagesUpdateQuery);

      await expect(
        service.updateStage('stage-1', {
          date: '2024-05-01',
          stageName: '更新',
          status: 'active',
          parts: ['シテ'],
          partCount: 1,
        })
      ).rejects.toThrow('Failed to update stage: Stage update failed');
    });

    it('パート削除時にエラーが発生した場合に例外をスローする', async () => {
      mockMapCreateStageRequestToStage.mockReturnValue({ name: '更新' });

      const stagesUpdateQuery = createMockSupabaseQuery({
        data: null,
        error: null,
      });

      const partsDeleteQuery = createMockSupabaseQuery({
        data: null,
        error: { message: 'Parts delete failed' },
      });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'stages') return stagesUpdateQuery;
        if (table === 'parts') return partsDeleteQuery;
        return createMockSupabaseQuery();
      });

      await expect(
        service.updateStage('stage-1', {
          date: '2024-05-01',
          stageName: '更新',
          status: 'active',
          parts: ['シテ'],
          partCount: 1,
        })
      ).rejects.toThrow('Failed to delete existing parts: Parts delete failed');
    });

    it('新しいパート作成時にエラーが発生した場合に例外をスローする', async () => {
      mockMapCreateStageRequestToStage.mockReturnValue({ name: '更新' });

      const stagesUpdateQuery = createMockSupabaseQuery({
        data: null,
        error: null,
      });

      const partsDeleteQuery = createMockSupabaseQuery({
        data: null,
        error: null,
      });

      const partsInsertQuery = createMockSupabaseQuery({
        data: null,
        error: { message: 'Parts insert failed' },
      });

      let partsCallCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'stages') return stagesUpdateQuery;
        if (table === 'parts') {
          partsCallCount++;
          return partsCallCount === 1 ? partsDeleteQuery : partsInsertQuery;
        }
        return createMockSupabaseQuery();
      });

      await expect(
        service.updateStage('stage-1', {
          date: '2024-05-01',
          stageName: '更新',
          status: 'active',
          parts: ['シテ'],
          partCount: 1,
        })
      ).rejects.toThrow('Failed to create new parts: Parts insert failed');
    });
  });

  describe('deleteStage', () => {
    it('指定IDのステージを削除する（関連パートもCASCADEで削除）', async () => {
      const query = createMockSupabaseQuery({ data: null, error: null });
      mockSupabaseClient.from.mockReturnValue(query);

      await service.deleteStage('stage-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('stages');
      expect(query.delete).toHaveBeenCalled();
      expect(query.eq).toHaveBeenCalledWith('id', 'stage-1');
    });

    it('エラー発生時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Delete failed' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(service.deleteStage('stage-1')).rejects.toThrow(
        'Failed to delete stage: Delete failed'
      );
    });
  });
});
