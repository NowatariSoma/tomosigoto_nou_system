import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient, createMockSupabaseQuery } from '@/__mocks__/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

import { MemberAssignmentService } from '@/features/member_assignments-setting/services/member-assignment-service';

describe('MemberAssignmentService', () => {
  let service: MemberAssignmentService;

  beforeEach(() => {
    service = new MemberAssignmentService();
    vi.clearAllMocks();
  });

  // テスト用プロフィールデータ
  const mockProfile = {
    user_id: 'user-1',
    first_name_katakana: 'タロウ',
    last_name_katakana: 'タナカ',
    first_name_kanji: '太郎',
    last_name_kanji: '田中',
    email: 'tanaka@example.com',
  };

  // テスト用のアサインメントレスポンス（ネストされたpart/stageを含む）
  const mockAssignmentResponse = {
    id: 'assignment-1',
    user_id: 'user-1',
    part_id: 'part-1',
    category: 'utai',
    display_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    part: {
      id: 'part-1',
      name: 'シテ',
      stage: {
        id: 'stage-1',
        name: '羽衣',
        performance_date: '2024-06-01',
      },
    },
  };

  const mockAssignmentResponse2 = {
    id: 'assignment-2',
    user_id: 'user-2',
    part_id: 'part-2',
    category: 'mai',
    display_order: 2,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    part: {
      id: 'part-2',
      name: 'ワキ',
      stage: {
        id: 'stage-1',
        name: '羽衣',
        performance_date: '2024-06-01',
      },
    },
  };

  const mockProfile2 = {
    user_id: 'user-2',
    first_name_katakana: 'ハナコ',
    last_name_katakana: 'スズキ',
    first_name_kanji: '花子',
    last_name_kanji: '鈴木',
    email: 'suzuki@example.com',
  };

  /**
   * テーブル名に基づいてモッククエリを返すヘルパー
   */
  function setupMockFrom(
    assignmentResult: { data: unknown; error: unknown },
    profileResult: { data: unknown; error: unknown }
  ) {
    const assignmentQuery = createMockSupabaseQuery(assignmentResult);
    const profileQuery = createMockSupabaseQuery(profileResult);

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'account_setting_profile') return profileQuery;
      return assignmentQuery;
    });

    return { assignmentQuery, profileQuery };
  }

  describe('getMemberAssignments', () => {
    it('詳細付きメンバー割り当て一覧を正常に取得する', async () => {
      const { assignmentQuery } = setupMockFrom(
        { data: [mockAssignmentResponse], error: null },
        { data: mockProfile, error: null }
      );

      const result = await service.getMemberAssignments();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('member_assignments');
      expect(assignmentQuery.select).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('assignment-1');
      expect(result[0].user.name).toBe('タナカ タロウ');
      expect(result[0].user.email).toBe('tanaka@example.com');
      expect(result[0].part.name).toBe('シテ');
      expect(result[0].part.stage.name).toBe('羽衣');
    });

    it('エラー時に例外をスローする', async () => {
      setupMockFrom(
        { data: null, error: { message: 'Database error' } },
        { data: null, error: null }
      );

      await expect(service.getMemberAssignments()).rejects.toThrow(
        'Failed to fetch member assignments: Database error'
      );
    });

    it('データが空の場合は空配列を返す', async () => {
      setupMockFrom(
        { data: [], error: null },
        { data: null, error: null }
      );

      const result = await service.getMemberAssignments();
      expect(result).toEqual([]);
    });
  });

  describe('getMemberAssignment', () => {
    it('指定IDの詳細付きメンバー割り当てを正常に取得する', async () => {
      setupMockFrom(
        { data: mockAssignmentResponse, error: null },
        { data: mockProfile, error: null }
      );

      const result = await service.getMemberAssignment('assignment-1');

      expect(result.id).toBe('assignment-1');
      expect(result.user.id).toBe('user-1');
      expect(result.user.name).toBe('タナカ タロウ');
      expect(result.user.first_name_kanji).toBe('太郎');
      expect(result.user.last_name_kanji).toBe('田中');
      expect(result.part.id).toBe('part-1');
      expect(result.part.stage.performance_date).toBe('2024-06-01');
    });

    it('エラー時に例外をスローする', async () => {
      setupMockFrom(
        { data: null, error: { message: 'Not found' } },
        { data: null, error: null }
      );

      await expect(service.getMemberAssignment('invalid-id')).rejects.toThrow(
        'Failed to fetch member assignment: Not found'
      );
    });

    it('ユーザー情報が取得できない場合はデフォルト値を使用する', async () => {
      setupMockFrom(
        { data: mockAssignmentResponse, error: null },
        { data: null, error: null }
      );

      const result = await service.getMemberAssignment('assignment-1');

      expect(result.user.name).toBe('Unknown User');
      expect(result.user.email).toBe('');
      expect(result.user.id).toBe('user-1');
    });
  });

  describe('getMemberAssignmentsByPart', () => {
    it('パートIDでフィルタリングした割り当て一覧を取得する', async () => {
      const { assignmentQuery } = setupMockFrom(
        { data: [mockAssignmentResponse], error: null },
        { data: mockProfile, error: null }
      );

      const result = await service.getMemberAssignmentsByPart('part-1');

      expect(assignmentQuery.eq).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].part_id).toBe('part-1');
      expect(result[0].user.name).toBe('タナカ タロウ');
    });

    it('エラー時に例外をスローする', async () => {
      setupMockFrom(
        { data: null, error: { message: 'Query failed' } },
        { data: null, error: null }
      );

      await expect(service.getMemberAssignmentsByPart('part-1')).rejects.toThrow(
        'Failed to fetch member assignments by part: Query failed'
      );
    });
  });

  describe('getMemberAssignmentsByUser', () => {
    it('ユーザーIDでフィルタリングした割り当て一覧を取得する', async () => {
      setupMockFrom(
        { data: [mockAssignmentResponse], error: null },
        { data: mockProfile, error: null }
      );

      const result = await service.getMemberAssignmentsByUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe('user-1');
      expect(result[0].user.name).toBe('タナカ タロウ');
      expect(result[0].part.name).toBe('シテ');
    });

    it('エラー時に例外をスローする', async () => {
      setupMockFrom(
        { data: null, error: { message: 'Query failed' } },
        { data: null, error: null }
      );

      await expect(service.getMemberAssignmentsByUser('user-1')).rejects.toThrow(
        'Failed to fetch member assignments by user: Query failed'
      );
    });
  });

  describe('createMemberAssignment', () => {
    it('詳細付きメンバー割り当てを正常に作成する', async () => {
      const createData = {
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'utai' as const,
        display_order: 1,
      };

      const { assignmentQuery } = setupMockFrom(
        { data: mockAssignmentResponse, error: null },
        { data: mockProfile, error: null }
      );

      const result = await service.createMemberAssignment(createData);

      expect(assignmentQuery.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'utai',
        display_order: 1,
      });
      expect(result.id).toBe('assignment-1');
      expect(result.user.name).toBe('タナカ タロウ');
      expect(result.part.name).toBe('シテ');
    });

    it('エラー時に例外をスローする', async () => {
      setupMockFrom(
        { data: null, error: { message: 'Insert failed' } },
        { data: null, error: null }
      );

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
    it('詳細付きメンバー割り当てを正常に更新する', async () => {
      const updateData = {
        category: 'mai' as const,
      };
      const updatedResponse = { ...mockAssignmentResponse, category: 'mai' };

      const { assignmentQuery } = setupMockFrom(
        { data: updatedResponse, error: null },
        { data: mockProfile, error: null }
      );

      const result = await service.updateMemberAssignment('assignment-1', updateData);

      expect(assignmentQuery.update).toHaveBeenCalledWith({ category: 'mai' });
      expect(result.category).toBe('mai');
      expect(result.user.name).toBe('タナカ タロウ');
    });

    it('エラー時に例外をスローする', async () => {
      setupMockFrom(
        { data: null, error: { message: 'Update failed' } },
        { data: null, error: null }
      );

      await expect(
        service.updateMemberAssignment('assignment-1', { category: 'mai' })
      ).rejects.toThrow('Failed to update member assignment: Update failed');
    });
  });

  describe('deleteMemberAssignment', () => {
    it('メンバー割り当てを正常に削除する', async () => {
      const { assignmentQuery } = setupMockFrom(
        { data: null, error: null },
        { data: null, error: null }
      );

      await service.deleteMemberAssignment('assignment-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('member_assignments');
      expect(assignmentQuery.delete).toHaveBeenCalled();
    });

    it('エラー時に例外をスローする', async () => {
      setupMockFrom(
        { data: null, error: { message: 'Delete failed' } },
        { data: null, error: null }
      );

      await expect(service.deleteMemberAssignment('assignment-1')).rejects.toThrow(
        'Failed to delete member assignment: Delete failed'
      );
    });
  });
});
