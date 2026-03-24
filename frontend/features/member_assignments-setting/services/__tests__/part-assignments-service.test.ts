import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/__mocks__/msw/server';
import { PartAssignmentsService } from '@/features/member_assignments-setting/services/part-assignments-service';

const API_BASE = 'http://localhost:8000/api/v1';

describe('PartAssignmentsService', () => {
  let service: PartAssignmentsService;

  beforeEach(() => {
    service = new PartAssignmentsService();
  });

  const mockStageResponse = {
    id: 'stage-1',
    name: '羽衣',
    performance_date: '2024-06-01',
    description: '能楽堂にて',
    parts: [
      {
        id: 'part-1',
        name: 'シテ',
        stage_id: 'stage-1',
        member_assignments: [
          {
            id: 'assignment-1',
            user_id: 'user-1',
            part_id: 'part-1',
            category: 'utai',
            display_order: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            user: {
              id: 'user-1',
              first_name_katakana: 'タロウ',
              last_name_katakana: 'タナカ',
              first_name_kanji: '太郎',
              last_name_kanji: '田中',
              email: 'tanaka@example.com',
            },
          },
        ],
      },
      {
        id: 'part-2',
        name: 'ワキ',
        stage_id: 'stage-1',
        member_assignments: [
          {
            id: 'assignment-2',
            user_id: 'user-2',
            part_id: 'part-2',
            category: 'mai',
            display_order: 1,
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            user: {
              id: 'user-2',
              first_name_katakana: 'ハナコ',
              last_name_katakana: 'スズキ',
              first_name_kanji: '花子',
              last_name_kanji: '鈴木',
              email: 'suzuki@example.com',
            },
          },
        ],
      },
    ],
  };

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
        part_id: 'part-1',
        category: 'utai',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-1',
          first_name_katakana: 'タロウ',
          last_name_katakana: 'タナカ',
          first_name_kanji: '太郎',
          last_name_kanji: '田中',
          email: 'tanaka@example.com',
        },
      },
    ],
  };

  const mockAssignmentResponse = {
    id: 'assignment-1',
    user_id: 'user-1',
    part_id: 'part-1',
    category: 'utai',
    display_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user: {
      id: 'user-1',
      first_name_katakana: 'タロウ',
      last_name_katakana: 'タナカ',
      first_name_kanji: '太郎',
      last_name_kanji: '田中',
      email: 'tanaka@example.com',
    },
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

  describe('getStagesWithPartsAndAssignments', () => {
    it('ステージ一覧をパートとアサインメント付きで正常に取得する', async () => {
      server.use(
        http.get(`${API_BASE}/member-assignments/stages-with-parts`, () => {
          return HttpResponse.json([mockStageResponse]);
        })
      );

      const result = await service.getStagesWithPartsAndAssignments();

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
      server.use(
        http.get(`${API_BASE}/member-assignments/stages-with-parts`, () => {
          return HttpResponse.json({ detail: 'Database error' }, { status: 500 });
        })
      );

      await expect(service.getStagesWithPartsAndAssignments()).rejects.toThrow();
    });

    it('データが空の場合は空配列を返す', async () => {
      server.use(
        http.get(`${API_BASE}/member-assignments/stages-with-parts`, () => {
          return HttpResponse.json([]);
        })
      );

      const result = await service.getStagesWithPartsAndAssignments();
      expect(result).toEqual([]);
    });

    it('ユーザー情報がない場合はUnknown Userを表示する', async () => {
      const stageNoUser = {
        ...mockStageResponse,
        parts: [
          {
            ...mockStageResponse.parts[0],
            member_assignments: [
              { ...mockStageResponse.parts[0].member_assignments[0], user: null },
            ],
          },
        ],
      };
      server.use(
        http.get(`${API_BASE}/member-assignments/stages-with-parts`, () => {
          return HttpResponse.json([stageNoUser]);
        })
      );

      const result = await service.getStagesWithPartsAndAssignments();
      expect(result[0].parts[0].member_assignments[0].user.name).toBe('Unknown User');
    });
  });

  describe('getPartWithAssignments', () => {
    it('パートをアサインメント付きで正常に取得する', async () => {
      server.use(
        http.get(`${API_BASE}/member-assignments/parts/part-1`, () => {
          return HttpResponse.json(mockPartResponse);
        })
      );

      const result = await service.getPartWithAssignments('part-1');

      expect(result.id).toBe('part-1');
      expect(result.name).toBe('シテ');
      expect(result.stage_id).toBe('stage-1');
      expect(result.stage_name).toBe('羽衣');
      expect(result.performance_date).toBe('2024-06-01');
      expect(result.member_assignments).toHaveLength(1);
      expect(result.member_assignments[0].user.name).toBe('タナカ タロウ');
    });

    it('エラー時に例外をスローする', async () => {
      server.use(
        http.get(`${API_BASE}/member-assignments/parts/invalid-id`, () => {
          return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
        })
      );

      await expect(service.getPartWithAssignments('invalid-id')).rejects.toThrow();
    });
  });

  describe('getAssignmentsByStage', () => {
    it('ステージIDで割り当て一覧を正常に取得する', async () => {
      server.use(
        http.get(`${API_BASE}/member-assignments`, () => {
          return HttpResponse.json([mockAssignmentResponse]);
        })
      );

      const result = await service.getAssignmentsByStage('stage-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('assignment-1');
      expect(result[0].user.name).toBe('タナカ タロウ');
      expect(result[0].part.name).toBe('シテ');
      expect(result[0].part.stage.name).toBe('羽衣');
    });

    it('エラー時に例外をスローする', async () => {
      server.use(
        http.get(`${API_BASE}/member-assignments`, () => {
          return HttpResponse.json({ detail: 'Query failed' }, { status: 500 });
        })
      );

      await expect(service.getAssignmentsByStage('stage-1')).rejects.toThrow();
    });

    it('データが空の場合は空配列を返す', async () => {
      server.use(
        http.get(`${API_BASE}/member-assignments`, () => {
          return HttpResponse.json([]);
        })
      );

      const result = await service.getAssignmentsByStage('stage-1');
      expect(result).toEqual([]);
    });
  });
});
