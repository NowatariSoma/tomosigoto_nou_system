import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient, createMockSupabaseQuery } from '@/__mocks__/supabase';

// supabaseモジュールをモック
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

import { StagesService } from '@/features/parts-setting/services/stages-service';

describe('StagesService', () => {
  let service: StagesService;

  beforeEach(() => {
    service = new StagesService();
    vi.clearAllMocks();
  });

  // テストデータ
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
      const query = createMockSupabaseQuery({
        data: [mockStageResponse, mockStageResponse2],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.getStages();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('stages');
      expect(query.select).toHaveBeenCalledWith('*');
      expect(query.order).toHaveBeenCalledWith('performance_date', { ascending: false });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expectedStageData);
      expect(result[1].name).toBe('夏の公演');
    });

    it('データがnullの場合は空配列を返す', async () => {
      const query = createMockSupabaseQuery({ data: null, error: null });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.getStages();

      expect(result).toEqual([]);
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
    it('指定IDのステージを取得しマッピングする', async () => {
      const query = createMockSupabaseQuery({
        data: mockStageResponse,
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.getStage('stage-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('stages');
      expect(query.select).toHaveBeenCalledWith('*');
      expect(query.eq).toHaveBeenCalledWith('id', 'stage-1');
      expect(query.single).toHaveBeenCalled();
      expect(result).toEqual(expectedStageData);
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
    it('ステージを作成しマッピングされた結果を返す', async () => {
      const query = createMockSupabaseQuery({
        data: mockStageResponse,
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.createStage({
        name: '春の公演',
        description: '春季公演です',
        performanceDate: '2024-04-15',
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('stages');
      expect(query.insert).toHaveBeenCalledWith({
        name: '春の公演',
        description: '春季公演です',
        performance_date: '2024-04-15',
        status: 'active',
      });
      expect(query.select).toHaveBeenCalled();
      expect(query.single).toHaveBeenCalled();
      expect(result).toEqual(expectedStageData);
    });

    it('statusを指定して作成できる', async () => {
      const query = createMockSupabaseQuery({
        data: { ...mockStageResponse, status: 'inactive' },
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await service.createStage({
        name: '春の公演',
        status: 'inactive',
      });

      expect(query.insert).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'inactive' })
      );
    });

    it('エラー発生時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Insert failed' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(
        service.createStage({ name: '春の公演' })
      ).rejects.toThrow('Failed to create stage: Insert failed');
    });
  });

  describe('updateStage', () => {
    it('ステージを更新しマッピングされた結果を返す', async () => {
      const updatedResponse = { ...mockStageResponse, name: '更新済み公演' };
      const query = createMockSupabaseQuery({
        data: updatedResponse,
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.updateStage('stage-1', { name: '更新済み公演' });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('stages');
      expect(query.update).toHaveBeenCalledWith({ name: '更新済み公演' });
      expect(query.eq).toHaveBeenCalledWith('id', 'stage-1');
      expect(query.select).toHaveBeenCalled();
      expect(query.single).toHaveBeenCalled();
      expect(result.name).toBe('更新済み公演');
    });

    it('複数フィールドを同時に更新できる', async () => {
      const query = createMockSupabaseQuery({
        data: mockStageResponse,
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await service.updateStage('stage-1', {
        name: '新しい公演名',
        description: '新しい説明',
        performanceDate: '2024-05-01',
        status: 'inactive',
      });

      expect(query.update).toHaveBeenCalledWith({
        name: '新しい公演名',
        description: '新しい説明',
        performance_date: '2024-05-01',
        status: 'inactive',
      });
    });

    it('エラー発生時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Update failed' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(
        service.updateStage('stage-1', { name: 'テスト' })
      ).rejects.toThrow('Failed to update stage: Update failed');
    });
  });

  describe('deleteStage', () => {
    it('指定IDのステージを削除する', async () => {
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
