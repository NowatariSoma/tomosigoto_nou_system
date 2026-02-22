import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient, createMockSupabaseQuery } from '@/__mocks__/supabase';

// supabaseモジュールをモック
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

import { PartsService } from '@/features/parts-setting/services/parts-service';

describe('PartsService', () => {
  let service: PartsService;

  beforeEach(() => {
    service = new PartsService();
    vi.clearAllMocks();
  });

  // テストデータ
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
      const query = createMockSupabaseQuery({
        data: [mockPartResponse, mockPartResponse2],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.getPartsByStageId('stage-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('parts');
      expect(query.select).toHaveBeenCalledWith('*');
      expect(query.eq).toHaveBeenCalledWith('stage_id', 'stage-1');
      expect(query.eq).toHaveBeenCalledWith('status', 'active');
      expect(query.order).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expectedPartData);
      expect(result[1].name).toBe('ワキ');
    });

    it('データがnullの場合は空配列を返す', async () => {
      const query = createMockSupabaseQuery({ data: null, error: null });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.getPartsByStageId('stage-1');

      expect(result).toEqual([]);
    });

    it('エラー発生時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Database error' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(service.getPartsByStageId('stage-1')).rejects.toThrow(
        'Failed to fetch parts: Database error'
      );
    });
  });

  describe('getPart', () => {
    it('指定IDのパートを取得しマッピングする', async () => {
      const query = createMockSupabaseQuery({
        data: mockPartResponse,
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.getPart('part-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('parts');
      expect(query.select).toHaveBeenCalledWith('*');
      expect(query.eq).toHaveBeenCalledWith('id', 'part-1');
      expect(query.single).toHaveBeenCalled();
      expect(result).toEqual(expectedPartData);
    });

    it('エラー発生時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Not found' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(service.getPart('invalid-id')).rejects.toThrow(
        'Failed to fetch part: Not found'
      );
    });
  });

  describe('createPart', () => {
    it('パートを作成しマッピングされた結果を返す', async () => {
      const query = createMockSupabaseQuery({
        data: mockPartResponse,
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.createPart({
        stageId: 'stage-1',
        name: 'シテ',
        description: 'メインの役',
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('parts');
      expect(query.insert).toHaveBeenCalledWith({
        stage_id: 'stage-1',
        name: 'シテ',
        description: 'メインの役',
        status: 'active',
      });
      expect(query.select).toHaveBeenCalled();
      expect(query.single).toHaveBeenCalled();
      expect(result).toEqual(expectedPartData);
    });

    it('エラー発生時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Insert failed' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(
        service.createPart({ stageId: 'stage-1', name: 'シテ' })
      ).rejects.toThrow('Failed to create part: Insert failed');
    });
  });

  describe('createParts', () => {
    it('複数パートを一括作成しマッピングされた結果を返す', async () => {
      const query = createMockSupabaseQuery({
        data: [mockPartResponse, mockPartResponse2],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.createParts([
        { stageId: 'stage-1', name: 'シテ', description: 'メインの役' },
        { stageId: 'stage-1', name: 'ワキ', description: 'サブの役' },
      ]);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('parts');
      expect(query.insert).toHaveBeenCalledWith([
        { stage_id: 'stage-1', name: 'シテ', description: 'メインの役', status: 'active' },
        { stage_id: 'stage-1', name: 'ワキ', description: 'サブの役', status: 'active' },
      ]);
      expect(query.select).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('空配列の場合は空配列を返す', async () => {
      const result = await service.createParts([]);

      expect(result).toEqual([]);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('エラー発生時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Bulk insert failed' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(
        service.createParts([{ stageId: 'stage-1', name: 'シテ' }])
      ).rejects.toThrow('Failed to create parts: Bulk insert failed');
    });
  });

  describe('updatePart', () => {
    it('パートを更新しマッピングされた結果を返す', async () => {
      const updatedResponse = { ...mockPartResponse, name: '更新済みパート' };
      const query = createMockSupabaseQuery({
        data: updatedResponse,
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.updatePart('part-1', { name: '更新済みパート' });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('parts');
      expect(query.update).toHaveBeenCalledWith({ name: '更新済みパート' });
      expect(query.eq).toHaveBeenCalledWith('id', 'part-1');
      expect(query.select).toHaveBeenCalled();
      expect(query.single).toHaveBeenCalled();
      expect(result.name).toBe('更新済みパート');
    });

    it('エラー発生時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Update failed' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(
        service.updatePart('part-1', { name: 'テスト' })
      ).rejects.toThrow('Failed to update part: Update failed');
    });
  });

  describe('deletePart', () => {
    it('指定IDのパートを削除する', async () => {
      const query = createMockSupabaseQuery({ data: null, error: null });
      mockSupabaseClient.from.mockReturnValue(query);

      await service.deletePart('part-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('parts');
      expect(query.delete).toHaveBeenCalled();
      expect(query.eq).toHaveBeenCalledWith('id', 'part-1');
    });

    it('エラー発生時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Delete failed' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(service.deletePart('part-1')).rejects.toThrow(
        'Failed to delete part: Delete failed'
      );
    });
  });

  describe('deletePartsByStageId', () => {
    it('ステージIDに紐づくパートを全て削除する', async () => {
      const query = createMockSupabaseQuery({ data: null, error: null });
      mockSupabaseClient.from.mockReturnValue(query);

      await service.deletePartsByStageId('stage-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('parts');
      expect(query.delete).toHaveBeenCalled();
      expect(query.eq).toHaveBeenCalledWith('stage_id', 'stage-1');
    });

    it('エラー発生時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Delete by stage failed' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(service.deletePartsByStageId('stage-1')).rejects.toThrow(
        'Failed to delete parts by stage ID: Delete by stage failed'
      );
    });
  });

  describe('deleteParts', () => {
    it('指定IDリストのパートを一括削除する', async () => {
      const query = createMockSupabaseQuery({ data: null, error: null });
      mockSupabaseClient.from.mockReturnValue(query);

      await service.deleteParts(['part-1', 'part-2']);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('parts');
      expect(query.delete).toHaveBeenCalled();
      expect(query.in).toHaveBeenCalledWith('id', ['part-1', 'part-2']);
    });

    it('空配列の場合はSupabaseを呼ばずに終了する', async () => {
      await service.deleteParts([]);

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('エラー発生時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Bulk delete failed' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(service.deleteParts(['part-1'])).rejects.toThrow(
        'Failed to delete parts: Bulk delete failed'
      );
    });
  });

  describe('updatePartsStatusByStageId', () => {
    it('ステージIDに紐づくパートのステータスを一括更新する', async () => {
      const query = createMockSupabaseQuery({ data: null, error: null });
      mockSupabaseClient.from.mockReturnValue(query);

      await service.updatePartsStatusByStageId('stage-1', 'inactive');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('parts');
      expect(query.update).toHaveBeenCalledWith({ status: 'inactive' });
      expect(query.eq).toHaveBeenCalledWith('stage_id', 'stage-1');
    });

    it('エラー発生時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Status update failed' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(
        service.updatePartsStatusByStageId('stage-1', 'active')
      ).rejects.toThrow(
        'Failed to update parts status by stage ID: Status update failed'
      );
    });
  });
});
