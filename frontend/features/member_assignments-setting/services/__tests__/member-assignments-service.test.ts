import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient, createMockSupabaseQuery } from '@/__mocks__/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

import { MemberAssignmentsService } from '@/features/member_assignments-setting/services/member-assignments-service';

describe('MemberAssignmentsService', () => {
  let service: MemberAssignmentsService;

  beforeEach(() => {
    service = new MemberAssignmentsService();
    vi.clearAllMocks();
  });

  // テスト用データ
  const mockAssignment = {
    id: 'assignment-1',
    user_id: 'user-1',
    part_id: 'part-1',
    category: 'utai',
    display_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockAssignment2 = {
    id: 'assignment-2',
    user_id: 'user-2',
    part_id: 'part-2',
    category: 'mai',
    display_order: 2,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  describe('getMemberAssignments', () => {
    it('メンバー割り当て一覧を正常に取得する', async () => {
      const query = createMockSupabaseQuery({
        data: [mockAssignment, mockAssignment2],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.getMemberAssignments();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('member_assignments');
      expect(query.select).toHaveBeenCalledWith('*');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('assignment-1');
      expect(result[0].user_id).toBe('user-1');
      expect(result[0].category).toBe('utai');
      expect(result[1].id).toBe('assignment-2');
      expect(result[1].display_order).toBe(2);
    });

    it('エラー時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Database error' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(service.getMemberAssignments()).rejects.toThrow(
        'Failed to fetch member assignments: Database error'
      );
    });

    it('データが空の場合は空配列を返す', async () => {
      const query = createMockSupabaseQuery({
        data: [],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.getMemberAssignments();
      expect(result).toEqual([]);
    });
  });

  describe('getMemberAssignment', () => {
    it('指定IDのメンバー割り当てを正常に取得する', async () => {
      const query = createMockSupabaseQuery({
        data: mockAssignment,
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.getMemberAssignment('assignment-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('member_assignments');
      expect(query.select).toHaveBeenCalledWith('*');
      expect(result.id).toBe('assignment-1');
      expect(result.user_id).toBe('user-1');
      expect(result.part_id).toBe('part-1');
      expect(result.category).toBe('utai');
    });

    it('エラー時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Not found' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(service.getMemberAssignment('invalid-id')).rejects.toThrow(
        'Failed to fetch member assignment: Not found'
      );
    });
  });

  describe('createMemberAssignment', () => {
    it('メンバー割り当てを正常に作成する', async () => {
      const createData = {
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'utai' as const,
        display_order: 1,
      };
      const query = createMockSupabaseQuery({
        data: mockAssignment,
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.createMemberAssignment(createData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('member_assignments');
      expect(query.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'utai',
        display_order: 1,
      });
      expect(result.id).toBe('assignment-1');
      expect(result.user_id).toBe('user-1');
    });

    it('display_order未指定時にデフォルト値0を使用する', async () => {
      const createData = {
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'mai' as const,
      };
      const query = createMockSupabaseQuery({
        data: { ...mockAssignment, display_order: 0 },
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await service.createMemberAssignment(createData);

      expect(query.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'mai',
        display_order: 0,
      });
    });

    it('エラー時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Insert failed' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(
        service.createMemberAssignment({
          user_id: 'user-1',
          part_id: 'part-1',
          category: 'utai',
        })
      ).rejects.toThrow('Failed to create member assignment: Insert failed');
    });
  });

  describe('updateMemberAssignment', () => {
    it('メンバー割り当てを正常に更新する', async () => {
      const updateData = {
        category: 'mai' as const,
        display_order: 5,
      };
      const updatedAssignment = { ...mockAssignment, category: 'mai', display_order: 5 };
      const query = createMockSupabaseQuery({
        data: updatedAssignment,
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      const result = await service.updateMemberAssignment('assignment-1', updateData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('member_assignments');
      expect(query.update).toHaveBeenCalledWith({
        category: 'mai',
        display_order: 5,
      });
      expect(result.category).toBe('mai');
      expect(result.display_order).toBe(5);
    });

    it('エラー時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Update failed' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(
        service.updateMemberAssignment('assignment-1', { category: 'mai' })
      ).rejects.toThrow('Failed to update member assignment: Update failed');
    });
  });

  describe('deleteMemberAssignment', () => {
    it('メンバー割り当てを正常に削除する', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: null,
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await service.deleteMemberAssignment('assignment-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('member_assignments');
      expect(query.delete).toHaveBeenCalled();
    });

    it('エラー時に例外をスローする', async () => {
      const query = createMockSupabaseQuery({
        data: null,
        error: { message: 'Delete failed' },
      });
      mockSupabaseClient.from.mockReturnValue(query);

      await expect(service.deleteMemberAssignment('assignment-1')).rejects.toThrow(
        'Failed to delete member assignment: Delete failed'
      );
    });
  });
});
