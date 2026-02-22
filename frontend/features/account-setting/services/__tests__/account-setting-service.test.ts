import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountSettingService } from '@/features/account-setting/services/account-setting-service';
import { ApiError } from '@/lib/api';

const mockFetchApi = vi.fn();
vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }
  return {
    fetchApi: (...args: unknown[]) => mockFetchApi(...args),
    ApiError,
  };
});

function mockJsonResponse(data: unknown) {
  return { json: vi.fn().mockResolvedValue(data) };
}

const mockProfile = {
  id: 'prof-1',
  user_id: 'user-1',
  student_id: '1234567890',
  first_name_kanji: '太郎',
  first_name_katakana: 'タロウ',
  last_name_kanji: '田中',
  last_name_katakana: 'タナカ',
  year: 2,
  faculty: '文学部',
  department_code: 'LIT',
  email: 'test@example.com',
};

describe('AccountSettingService', () => {
  let service: AccountSettingService;

  beforeEach(() => {
    service = new AccountSettingService();
    vi.clearAllMocks();
  });

  describe('getCurrentUserProfile', () => {
    it('現在のユーザープロフィールを取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockProfile));

      const result = await service.getCurrentUserProfile();
      expect(result).not.toBeNull();
      expect(result!.student_id).toBe('1234567890');
      expect(mockFetchApi).toHaveBeenCalledWith('/account-setting/profile');
    });

    it('404の場合はnullを返す', async () => {
      mockFetchApi.mockRejectedValue(new ApiError(404, 'Not found'));

      const result = await service.getCurrentUserProfile();
      expect(result).toBeNull();
    });

    it('404以外のエラーはスローする', async () => {
      mockFetchApi.mockRejectedValue(new ApiError(500, 'Server error'));

      await expect(service.getCurrentUserProfile()).rejects.toThrow('Server error');
    });

    it('非ApiErrorもスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Network error'));

      await expect(service.getCurrentUserProfile()).rejects.toThrow('Network error');
    });
  });

  describe('getCurrentUserRole', () => {
    it('ユーザーロールを取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse({
        role_type: 'admin',
        is_visible_to_general: true,
      }));

      const result = await service.getCurrentUserRole();
      expect(result.role_type).toBe('admin');
      expect(mockFetchApi).toHaveBeenCalledWith('/users/me/role');
    });

    it('失敗時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Server error'));

      await expect(service.getCurrentUserRole()).rejects.toThrow();
    });
  });

  describe('getCurrentUserInfo', () => {
    it('ユーザー情報を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse({
        id: 'user-1',
        email: 'test@example.com',
      }));

      const result = await service.getCurrentUserInfo();
      expect(result.email).toBe('test@example.com');
      expect(mockFetchApi).toHaveBeenCalledWith('/users/me');
    });
  });

  describe('createProfile', () => {
    it('プロフィールを作成する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse(mockProfile));

      const result = await service.createProfile({
        student_id: '1234567890',
        first_name_kanji: '太郎',
        last_name_kanji: '田中',
      });
      expect(result.student_id).toBe('1234567890');
      expect(mockFetchApi).toHaveBeenCalledWith('/account-setting/profile', {
        method: 'POST',
        body: expect.any(String),
      });
    });
  });

  describe('updateProfile', () => {
    it('プロフィールを更新する', async () => {
      const updated = { ...mockProfile, first_name_kanji: '次郎' };
      mockFetchApi.mockResolvedValue(mockJsonResponse(updated));

      const result = await service.updateProfile({ first_name_kanji: '次郎' });
      expect(result.first_name_kanji).toBe('次郎');
      expect(mockFetchApi).toHaveBeenCalledWith('/account-setting/profile', {
        method: 'PUT',
        body: expect.any(String),
      });
    });

    it('更新失敗時にエラーをスローする', async () => {
      mockFetchApi.mockRejectedValue(new Error('Validation error'));

      await expect(service.updateProfile({})).rejects.toThrow();
    });
  });

  describe('deleteProfile', () => {
    it('プロフィールを削除する', async () => {
      mockFetchApi.mockResolvedValue(undefined);

      await expect(service.deleteProfile()).resolves.toBeUndefined();
      expect(mockFetchApi).toHaveBeenCalledWith('/account-setting/profile', {
        method: 'DELETE',
      });
    });
  });

  describe('getAllDepartments', () => {
    it('学部一覧を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([
        {
          id: 'dept-1',
          department_code: 'LIT',
          department_name: '文学部',
          is_active: true,
        },
      ]));

      const result = await service.getAllDepartments();
      expect(result).toHaveLength(1);
      expect(result[0].department_name).toBe('文学部');
      expect(mockFetchApi).toHaveBeenCalledWith('/account-setting/departments');
    });
  });

  describe('getDepartmentByCode', () => {
    it('学部コードで部門を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse({
        id: 'dept-1',
        department_code: 'LIT',
        department_name: '文学部',
      }));

      const result = await service.getDepartmentByCode('LIT');
      expect(result.department_code).toBe('LIT');
      expect(mockFetchApi).toHaveBeenCalledWith('/account-setting/departments/LIT');
    });
  });

  describe('validateProfileData', () => {
    it('バリデーション結果を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse({
        is_valid: true,
        errors: [],
        warnings: [],
      }));

      const result = await service.validateProfileData({ student_id: '1234567890' });
      expect(result.is_valid).toBe(true);
      expect(mockFetchApi).toHaveBeenCalledWith('/account-setting/validate', {
        method: 'POST',
        body: expect.any(String),
      });
    });
  });

  describe('getProfileHistory', () => {
    it('プロフィール履歴を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([
        { id: 'h1', changed_at: '2024-01-01' },
      ]));

      const result = await service.getProfileHistory(10);
      expect(result).toHaveLength(1);
      expect(mockFetchApi).toHaveBeenCalledWith('/account-setting/profile/history?limit=10');
    });

    it('デフォルトのlimitは50', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([]));

      await service.getProfileHistory();
      expect(mockFetchApi).toHaveBeenCalledWith('/account-setting/profile/history?limit=50');
    });
  });

  describe('getFieldHistory', () => {
    it('フィールド履歴を取得する', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([
        { id: 'h1', old_value: 'old', new_value: 'new' },
      ]));

      const result = await service.getFieldHistory('first_name_kanji', 5);
      expect(result).toHaveLength(1);
      expect(mockFetchApi).toHaveBeenCalledWith('/account-setting/profile/history/first_name_kanji?limit=5');
    });

    it('デフォルトのlimitは20', async () => {
      mockFetchApi.mockResolvedValue(mockJsonResponse([]));

      await service.getFieldHistory('email');
      expect(mockFetchApi).toHaveBeenCalledWith('/account-setting/profile/history/email?limit=20');
    });
  });
});
