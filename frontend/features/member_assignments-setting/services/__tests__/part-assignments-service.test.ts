import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient, createMockSupabaseQuery } from '@/__mocks__/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

import { PartAssignmentsService } from '@/features/member_assignments-setting/services/part-assignments-service';

describe('PartAssignmentsService', () => {
  let service: PartAssignmentsService;

  beforeEach(() => {
    service = new PartAssignmentsService();
    vi.clearAllMocks();
  });

  // テスト用ユーザープロフィールデータ
  const mockProfile1 = {
    user_id: 'user-1',
    first_name_katakana: 'タロウ',
    last_name_katakana: 'タナカ',
    first_name_kanji: '太郎',
    last_name_kanji: '田中',
    email: 'tanaka@example.com',
  };

  const mockProfile2 = {
    user_id: 'user-2',
    first_name_katakana: 'ハナコ',
    last_name_katakana: 'スズキ',
    first_name_kanji: '花子',
    last_name_kanji: '鈴木',
    email: 'suzuki@example.com',
  };

  // テスト用ステージデータ（ネストされたparts/member_assignmentsを含む）
  const mockStageResponse = {
    id: 'stage-1',
    name: '羽衣',
    performance_date: '2024-06-01',
    description: '能楽堂にて',
    parts: [
      {
        id: 'part-1',
        name: 'シテ',
        member_assignments: [
          {
            id: 'assignment-1',
            user_id: 'user-1',
            category: 'utai',
            display_order: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      },
      {
        id: 'part-2',
        name: 'ワキ',
        member_assignments: [
          {
            id: 'assignment-2',
            user_id: 'user-2',
            category: 'mai',
            display_order: 1,
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
        ],
      },
    ],
  };

  // テスト用パートデータ（ネストされたstage/member_assignmentsを含む）
  const mockPartResponse = {
    id: 'part-1',
    name: 'シテ',
    stage_id: 'stage-1',
    stage: {
      id: 'stage-1',
      name: '羽衣',
      performance_date: '2024-06-01',
    },
    member_assignments: [
      {
        id: 'assignment-1',
        user_id: 'user-1',
        category: 'utai',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
  };

  // テスト用アサインメントデータ（ネストされたpart/stageを含む）
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

  /**
   * テーブル名に基づいてモッククエリを返すヘルパー
   */
  function setupMockFrom(configs: Record<string, { data: unknown; error: unknown }>) {
    const queries: Record<string, ReturnType<typeof createMockSupabaseQuery>> = {};
    for (const [table, result] of Object.entries(configs)) {
      queries[table] = createMockSupabaseQuery(result);
    }

    mockSupabaseClient.from.mockImplementation((table: string) => {
      return queries[table] || createMockSupabaseQuery({ data: null, error: null });
    });

    return queries;
  }

  describe('getStagesWithPartsAndAssignments', () => {
    it('ステージ一覧をパートとアサインメント付きで正常に取得する', async () => {
      const queries = setupMockFrom({
        stages: { data: [mockStageResponse], error: null },
        account_setting_profile: { data: [mockProfile1, mockProfile2], error: null },
      });

      const result = await service.getStagesWithPartsAndAssignments();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('stages');
      expect(queries.stages.select).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('stage-1');
      expect(result[0].name).toBe('羽衣');
      expect(result[0].parts).toHaveLength(2);
      expect(result[0].parts[0].name).toBe('シテ');
      expect(result[0].parts[0].member_assignments).toHaveLength(1);
      expect(result[0].parts[0].member_assignments[0].user.name).toBe('タナカ タロウ');
      expect(result[0].parts[1].name).toBe('ワキ');
      expect(result[0].parts[1].member_assignments[0].user.name).toBe('スズキ ハナコ');
    });

    it('エラー時に例外をスローする', async () => {
      setupMockFrom({
        stages: { data: null, error: { message: 'Database error' } },
        account_setting_profile: { data: [], error: null },
      });

      await expect(service.getStagesWithPartsAndAssignments()).rejects.toThrow(
        'Failed to fetch stages with parts and assignments: Database error'
      );
    });

    it('データが空の場合は空配列を返す', async () => {
      setupMockFrom({
        stages: { data: [], error: null },
        account_setting_profile: { data: [], error: null },
      });

      const result = await service.getStagesWithPartsAndAssignments();
      expect(result).toEqual([]);
    });

    it('ユーザー情報が取得できない場合はUnknown Userを表示する', async () => {
      setupMockFrom({
        stages: { data: [mockStageResponse], error: null },
        account_setting_profile: { data: [], error: null },
      });

      const result = await service.getStagesWithPartsAndAssignments();

      expect(result[0].parts[0].member_assignments[0].user.name).toBe('Unknown User');
    });

    it('アサインメントがないステージを正常に処理する', async () => {
      const stageWithoutAssignments = {
        id: 'stage-2',
        name: '松風',
        performance_date: '2024-07-01',
        description: null,
        parts: [
          {
            id: 'part-3',
            name: 'シテ',
            member_assignments: [],
          },
        ],
      };

      setupMockFrom({
        stages: { data: [stageWithoutAssignments], error: null },
        account_setting_profile: { data: [], error: null },
      });

      const result = await service.getStagesWithPartsAndAssignments();

      expect(result).toHaveLength(1);
      expect(result[0].parts[0].member_assignments).toHaveLength(0);
    });
  });

  describe('getPartWithAssignments', () => {
    it('パートをアサインメント付きで正常に取得する', async () => {
      const queries = setupMockFrom({
        parts: { data: mockPartResponse, error: null },
        account_setting_profile: { data: [mockProfile1], error: null },
      });

      const result = await service.getPartWithAssignments('part-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('parts');
      expect(queries.parts.select).toHaveBeenCalled();
      expect(result.id).toBe('part-1');
      expect(result.name).toBe('シテ');
      expect(result.stage_id).toBe('stage-1');
      expect(result.stage_name).toBe('羽衣');
      expect(result.performance_date).toBe('2024-06-01');
      expect(result.member_assignments).toHaveLength(1);
      expect(result.member_assignments[0].user.name).toBe('タナカ タロウ');
    });

    it('エラー時に例外をスローする', async () => {
      setupMockFrom({
        parts: { data: null, error: { message: 'Not found' } },
        account_setting_profile: { data: [], error: null },
      });

      await expect(service.getPartWithAssignments('invalid-id')).rejects.toThrow(
        'Failed to fetch part with assignments: Not found'
      );
    });

    it('アサインメントがないパートを正常に処理する', async () => {
      const partWithoutAssignments = {
        ...mockPartResponse,
        member_assignments: [],
      };

      setupMockFrom({
        parts: { data: partWithoutAssignments, error: null },
        account_setting_profile: { data: [], error: null },
      });

      const result = await service.getPartWithAssignments('part-1');

      expect(result.member_assignments).toHaveLength(0);
    });
  });

  describe('getAssignmentsByStage', () => {
    it('ステージIDで割り当て一覧を正常に取得する', async () => {
      const queries = setupMockFrom({
        member_assignments: { data: [mockAssignmentResponse], error: null },
        account_setting_profile: { data: [mockProfile1], error: null },
      });

      const result = await service.getAssignmentsByStage('stage-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('member_assignments');
      expect(queries.member_assignments.select).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('assignment-1');
      expect(result[0].user.name).toBe('タナカ タロウ');
      expect(result[0].part.name).toBe('シテ');
      expect(result[0].part.stage.name).toBe('羽衣');
    });

    it('エラー時に例外をスローする', async () => {
      setupMockFrom({
        member_assignments: { data: null, error: { message: 'Query failed' } },
        account_setting_profile: { data: [], error: null },
      });

      await expect(service.getAssignmentsByStage('stage-1')).rejects.toThrow(
        'Failed to fetch assignments by stage: Query failed'
      );
    });

    it('データが空の場合は空配列を返す', async () => {
      setupMockFrom({
        member_assignments: { data: [], error: null },
        account_setting_profile: { data: [], error: null },
      });

      const result = await service.getAssignmentsByStage('stage-1');
      expect(result).toEqual([]);
    });

    it('ユーザー情報が取得できない場合はUnknown Userを使用する', async () => {
      setupMockFrom({
        member_assignments: { data: [mockAssignmentResponse], error: null },
        account_setting_profile: { data: [], error: null },
      });

      const result = await service.getAssignmentsByStage('stage-1');

      expect(result[0].user.name).toBe('Unknown User');
      expect(result[0].user.email).toBe('');
    });
  });
});
