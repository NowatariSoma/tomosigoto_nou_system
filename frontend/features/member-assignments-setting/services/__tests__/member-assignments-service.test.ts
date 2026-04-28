import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/__mocks__/msw/server';
import { MemberAssignmentsService } from '@/features/member-assignments-setting/services/member-assignments-service';

const API_BASE = 'http://localhost:8000/api/v1';

describe('MemberAssignmentsService', () => {
  let service: MemberAssignmentsService;

  beforeEach(() => {
    service = new MemberAssignmentsService();
  });

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
      server.use(
        http.get(`${API_BASE}/member-assignments`, () => {
          return HttpResponse.json([mockAssignment, mockAssignment2]);
        })
      );

      const result = await service.getMemberAssignments();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('assignment-1');
      expect(result[0].user_id).toBe('user-1');
      expect(result[0].category).toBe('utai');
      expect(result[1].id).toBe('assignment-2');
      expect(result[1].display_order).toBe(2);
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
    it('指定IDのメンバー割り当てを正常に取得する', async () => {
      server.use(
        http.get(`${API_BASE}/member-assignments/assignment-1`, () => {
          return HttpResponse.json(mockAssignment);
        })
      );

      const result = await service.getMemberAssignment('assignment-1');

      expect(result.id).toBe('assignment-1');
      expect(result.user_id).toBe('user-1');
      expect(result.part_id).toBe('part-1');
      expect(result.category).toBe('utai');
    });

    it('エラー時に例外をスローする', async () => {
      server.use(
        http.get(`${API_BASE}/member-assignments/invalid-id`, () => {
          return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
        })
      );

      await expect(service.getMemberAssignment('invalid-id')).rejects.toThrow();
    });
  });

  describe('createMemberAssignment', () => {
    it('メンバー割り当てを正常に作成する', async () => {
      server.use(
        http.post(`${API_BASE}/member-assignments`, () => {
          return HttpResponse.json(mockAssignment);
        })
      );

      const result = await service.createMemberAssignment({
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'utai',
        display_order: 1,
      });

      expect(result.id).toBe('assignment-1');
      expect(result.user_id).toBe('user-1');
    });

    it('display_order未指定時にデフォルト値0を使用する', async () => {
      server.use(
        http.post(`${API_BASE}/member-assignments`, async ({ request }) => {
          const body = await request.json() as any;
          return HttpResponse.json({ ...mockAssignment, display_order: body.display_order });
        })
      );

      const result = await service.createMemberAssignment({
        user_id: 'user-1',
        part_id: 'part-1',
        category: 'mai',
      });

      expect(result.display_order).toBe(0);
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
    it('メンバー割り当てを正常に更新する', async () => {
      const updatedAssignment = { ...mockAssignment, category: 'mai', display_order: 5 };
      server.use(
        http.put(`${API_BASE}/member-assignments/assignment-1`, () => {
          return HttpResponse.json(updatedAssignment);
        })
      );

      const result = await service.updateMemberAssignment('assignment-1', {
        category: 'mai',
        display_order: 5,
      });

      expect(result.category).toBe('mai');
      expect(result.display_order).toBe(5);
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
