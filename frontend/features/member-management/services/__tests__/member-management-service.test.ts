import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/__mocks__/msw/server';
import { MemberManagementService } from '@/features/member-management/services/member-management-service';

// supabaseをモック
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-access-token',
          },
        },
      }),
    },
  },
}));

const mockMember = {
  id: 'member-1',
  name: '田中太郎',
  email: 'tanaka@example.com',
  role: 'basic' as const,
  is_instructor: false,
  last_active_at: '2024-01-15T10:00:00Z',
};

describe('MemberManagementService', () => {
  let service: MemberManagementService;

  beforeEach(() => {
    service = new MemberManagementService();
    vi.clearAllMocks();
  });

  describe('listMembers', () => {
    it('メンバー一覧を配列で取得する', async () => {
      server.use(
        http.get(/\/admin\/members\/$/, () => {
          return HttpResponse.json([mockMember]);
        })
      );

      const result = await service.listMembers();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('田中太郎');
    });

    it('data wrapperの場合も正しく取得する', async () => {
      server.use(
        http.get(/\/admin\/members\/$/, () => {
          return HttpResponse.json({ data: [mockMember] });
        })
      );

      const result = await service.listMembers();
      expect(result).toHaveLength(1);
    });
  });

  describe('updateRole', () => {
    it('メンバーのロールを更新する', async () => {
      const updated = { ...mockMember, role: 'admin' as const };
      server.use(
        http.patch(/\/admin\/members\/member-1\/role$/, () => {
          return HttpResponse.json(updated);
        })
      );

      const result = await service.updateRole('member-1', { role: 'admin' });
      expect(result.role).toBe('admin');
    });
  });

  describe('updateInstructorFlag', () => {
    it('指導者フラグを更新する', async () => {
      const updated = { ...mockMember, is_instructor: true };
      server.use(
        http.patch(/\/admin\/members\/member-1\/instructor$/, () => {
          return HttpResponse.json(updated);
        })
      );

      const result = await service.updateInstructorFlag('member-1', { is_instructor: true });
      expect(result.is_instructor).toBe(true);
    });
  });

  describe('deleteMember', () => {
    it('メンバーを削除する', async () => {
      server.use(
        http.delete(/\/admin\/members\/member-1$/, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      await expect(service.deleteMember('member-1')).resolves.toBeUndefined();
    });

    it('削除失敗時にエラーをスローする', async () => {
      server.use(
        http.delete(/\/admin\/members\/member-1$/, () => {
          return new HttpResponse('Forbidden', { status: 403 });
        })
      );

      await expect(service.deleteMember('member-1')).rejects.toThrow();
    });
  });
});
