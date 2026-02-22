import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemberManagementService } from '@/features/member-management/services/member-management-service';

const mockFetchApi = vi.fn();
vi.mock('@/lib/api', () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

function mockJsonResponse(data: unknown) {
  return { json: vi.fn().mockResolvedValue(data) };
}

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
      mockFetchApi.mockResolvedValue(mockJsonResponse([mockMember]));

      const result = await service.listMembers();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('田中太郎');
      expect(mockFetchApi).toHaveBeenCalledWith('/admin/members/');
    });

    it('data wrapperの場合も正しく取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse({ data: [mockMember] }));

      const result = await service.listMembers();
      expect(result).toHaveLength(1);
    });

    it('取得失敗時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('取得失敗'));

      await expect(service.listMembers()).rejects.toThrow('取得失敗');
    });
  });

  describe('updateRole', () => {
    it('メンバーのロールを更新する', async () => {
      const updated = { ...mockMember, role: 'admin' as const };
      mockFetchApi.mockResolvedValue(mockJsonResponse(updated));

      const result = await service.updateRole('member-1', { role: 'admin' });
      expect(result.role).toBe('admin');
      expect(mockFetchApi).toHaveBeenCalledWith('/admin/members/member-1/role', {
        method: 'PATCH',
        body: JSON.stringify({ role: 'admin' }),
      });
    });

    it('更新失敗時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('更新失敗'));

      await expect(service.updateRole('member-1', { role: 'admin' })).rejects.toThrow('更新失敗');
    });
  });

  describe('updateInstructorFlag', () => {
    it('指導者フラグを更新する', async () => {
      const updated = { ...mockMember, is_instructor: true };
      mockFetchApi.mockResolvedValue(mockJsonResponse(updated));

      const result = await service.updateInstructorFlag('member-1', { is_instructor: true });
      expect(result.is_instructor).toBe(true);
      expect(mockFetchApi).toHaveBeenCalledWith('/admin/members/member-1/instructor', {
        method: 'PATCH',
        body: JSON.stringify({ is_instructor: true }),
      });
    });

    it('更新失敗時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('更新失敗'));

      await expect(service.updateInstructorFlag('member-1', { is_instructor: true })).rejects.toThrow();
    });
  });

  describe('deleteMember', () => {
    it('メンバーを削除する', async () => {
      mockFetchApi.mockResolvedValue(undefined);

      await expect(service.deleteMember('member-1')).resolves.toBeUndefined();
      expect(mockFetchApi).toHaveBeenCalledWith('/admin/members/member-1', {
        method: 'DELETE',
      });
    });

    it('削除失敗時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Forbidden'));

      await expect(service.deleteMember('member-1')).rejects.toThrow();
    });
  });
});
