import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/__mocks__/msw/server';
import { MemberAssignmentService } from '@/features/member-assignments-setting/services/member-assignment-service';

const API_BASE = 'http://localhost:8000/api/v1';

describe('MemberAssignmentService', () => {
  let service: MemberAssignmentService;

  beforeEach(() => {
    service = new MemberAssignmentService();
  });

  const mockAssignmentWithDetails = {
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

  describe('getMemberAssignments', () => {
    it('詳細付きメンバー割り当て一覧を正常に取得する', async () => {
      server.use(
        http.get(`${API_BASE}/member-assignments`, () => {
          return HttpResponse.json([mockAssignmentWithDetails]);
        })
      );

      const result = await service.getMemberAssignments();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('assignment-1');
      expect(result[0].user.name).toBe('タナカ タロウ');
      expect(result[0].user.email).toBe('tanaka@example.com');
      expect(result[0].part.name).toBe('シテ');
      expect(result[0].part.stage.name).toBe('羽衣');
    });

    it('エラー時に例外をスローする', async () => {
      server.use(
        http.get(`${API_BASE}/member-assignments`, () => {
          return HttpResponse.json({ detail: 'Database error' }, { status: 500 });
        })
      );

      await expect(service.getMemberAssignments()).rejects.toThrow();
    });

    it('データが空の場合は空配列を返す', async () => {
      server.use(
        http.get(`${API_BASE}/member-assignments`, () => {
          return HttpResponse.json([]);
        })
      );

      const result = await service.getMemberAssignments();
      expect(result).toEqual([]);
    });
  });

  describe('getMemberAssignment', () => {
    it('指定IDの詳細付きメンバー割り当てを正常に取得する', async () => {
      server.use(
        http.get(`${API_BASE}/member-assignments/assignment-1`, () => {
          return HttpResponse.json(mockAssignmentWithDetails);
        })
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
      server.use(
        http.get(`${API_BASE}/member-assignments/invalid-id`, () => {
          return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
        })
      );

      await expect(service.getMemberAssignment('invalid-id')).rejects.toThrow();
    });

    it('ユーザー情報がない場合はデフォルト値を使用する', async () => {
      const noUserAssignment = { ...mockAssignmentWithDetails, user: null };
      server.use(
        http.get(`${API_BASE}/member-assignments/assignment-1`, () => {
          return HttpResponse.json(noUserAssignment);
        })
      );

      const result = await service.getMemberAssignment('assignment-1');

      expect(result.user.name).toBe('Unknown User');
      expect(result.user.email).toBe('');
      expect(result.user.id).toBe('user-1');
    });
  });

  describe('getMemberAssignmentsByPart', () => {
    it('パートIDでフィルタリングした割り当て一覧を取得する', async () => {
      server.use(
        http.get(`${API_BASE}/member-assignments`, () => {
          return HttpResponse.json([mockAssignmentWithDetails]);
        })
      );

      const result = await service.getMemberAssignmentsByPart('part-1');

      expect(result).toHaveLength(1);
      expect(result[0].part_id).toBe('part-1');
      expect(result[0].user.name).toBe('タナカ タロウ');
    });

    it('エラー時に例外をスローする', async () => {
      server.use(
        http.get(`${API_BASE}/member-assignments`, () => {
          return HttpResponse.json({ detail: 'Query failed' }, { status: 500 });
        })
      );

      await expect(service.getMemberAssignmentsByPart('part-1')).rejects.toThrow();
    });
  });

  describe('getMemberAssignmentsByUser', () => {
    it('ユーザーIDでフィルタリングした割り当て一覧を取得する', async () => {
      server.use(
        http.get(`${API_BASE}/member-assignments`, () => {
          return HttpResponse.json([mockAssignmentWithDetails]);
        })
      );

      const result = await service.getMemberAssignmentsByUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe('user-1');
      expect(result[0].user.name).toBe('タナカ タロウ');
      expect(result[0].part.name).toBe('シテ');
    });
  });

  describe('createMemberAssignment', () => {
    it('詳細付きメンバー割り当てを正常に作成する', async () => {
      server.use(
        http.post(`${API_BASE}/member-assignments`, () => {
          return HttpResponse.json(mockAssignmentWithDetails);
        })
      );

      const result = await service.createMemberAssignment({
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
      server.use(
        http.post(`${API_BASE}/member-assignments`, () => {
          return HttpResponse.json({ detail: 'Insert failed' }, { status: 500 });
        })
      );

      await expect(
        service.createMemberAssignment({
          user_id: 'user-1',
          part_id: 'part-1',
          category: 'utai',
        })
      ).rejects.toThrow();
    });
  });

  describe('updateMemberAssignment', () => {
    it('詳細付きメンバー割り当てを正常に更新する', async () => {
      const updatedResponse = { ...mockAssignmentWithDetails, category: 'mai' };
      server.use(
        http.put(`${API_BASE}/member-assignments/assignment-1`, () => {
          return HttpResponse.json(updatedResponse);
        })
      );

      const result = await service.updateMemberAssignment('assignment-1', { category: 'mai' });

      expect(result.category).toBe('mai');
      expect(result.user.name).toBe('タナカ タロウ');
    });

    it('エラー時に例外をスローする', async () => {
      server.use(
        http.put(`${API_BASE}/member-assignments/assignment-1`, () => {
          return HttpResponse.json({ detail: 'Update failed' }, { status: 500 });
        })
      );

      await expect(
        service.updateMemberAssignment('assignment-1', { category: 'mai' })
      ).rejects.toThrow();
    });
  });

  describe('deleteMemberAssignment', () => {
    it('メンバー割り当てを正常に削除する', async () => {
      server.use(
        http.delete(`${API_BASE}/member-assignments/assignment-1`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(service.deleteMemberAssignment('assignment-1')).resolves.not.toThrow();
    });

    it('エラー時に例外をスローする', async () => {
      server.use(
        http.delete(`${API_BASE}/member-assignments/assignment-1`, () => {
          return HttpResponse.json({ detail: 'Delete failed' }, { status: 500 });
        })
      );

      await expect(service.deleteMemberAssignment('assignment-1')).rejects.toThrow();
    });
  });
});
