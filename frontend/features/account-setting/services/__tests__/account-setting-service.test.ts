import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/__mocks__/msw/server';
import { AccountSettingService } from '@/features/account-setting/services/account-setting-service';

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

// AccountSettingServiceはprocess.env.NEXT_PUBLIC_API_URLを使い、テスト環境では '/api/v1' となる
// jsdom環境ではfetchの相対URLが http://localhost/api/v1/... に解決される
// MSWハンドラではRegExpでURLをマッチさせる

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
      server.use(
        http.get(/\/account-setting\/profile$/, () => {
          return HttpResponse.json(mockProfile);
        })
      );

      const result = await service.getCurrentUserProfile();
      expect(result).not.toBeNull();
      expect(result!.student_id).toBe('1234567890');
    });

    it('404の場合はnullを返す', async () => {
      server.use(
        http.get(/\/account-setting\/profile$/, () => {
          return HttpResponse.json(
            { detail: 'Not found' },
            { status: 404 }
          );
        })
      );

      const result = await service.getCurrentUserProfile();
      expect(result).toBeNull();
    });
  });

  describe('getCurrentUserRole', () => {
    it('ユーザーロールを取得する', async () => {
      server.use(
        http.get(/\/users\/me\/role/, () => {
          return HttpResponse.json({
            role_type: 'admin',
            is_visible_to_general: true,
          });
        })
      );

      const result = await service.getCurrentUserRole();
      expect(result.role_type).toBe('admin');
    });

    it('失敗時にエラーをスローする', async () => {
      server.use(
        http.get(/\/users\/me\/role/, () => {
          return HttpResponse.json(
            { detail: 'Server error' },
            { status: 500 }
          );
        })
      );

      await expect(service.getCurrentUserRole()).rejects.toThrow();
    });
  });

  describe('getCurrentUserInfo', () => {
    it('ユーザー情報を取得する', async () => {
      server.use(
        http.get(/\/users\/me$/, () => {
          return HttpResponse.json({
            id: 'user-1',
            email: 'test@example.com',
          });
        })
      );

      const result = await service.getCurrentUserInfo();
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('createProfile', () => {
    it('プロフィールを作成する', async () => {
      server.use(
        http.post(/\/account-setting\/profile$/, () => {
          return HttpResponse.json(mockProfile);
        })
      );

      const result = await service.createProfile({
        student_id: '1234567890',
        first_name_kanji: '太郎',
        last_name_kanji: '田中',
      });
      expect(result.student_id).toBe('1234567890');
    });
  });

  describe('updateProfile', () => {
    it('プロフィールを更新する', async () => {
      const updated = { ...mockProfile, first_name_kanji: '次郎' };
      server.use(
        http.put(/\/account-setting\/profile$/, () => {
          return HttpResponse.json(updated);
        })
      );

      const result = await service.updateProfile({ first_name_kanji: '次郎' });
      expect(result.first_name_kanji).toBe('次郎');
    });

    it('更新失敗時にエラーをスローする', async () => {
      server.use(
        http.put(/\/account-setting\/profile$/, () => {
          return HttpResponse.json(
            { detail: 'Validation error' },
            { status: 400 }
          );
        })
      );

      await expect(service.updateProfile({})).rejects.toThrow();
    });
  });

  describe('getAllDepartments', () => {
    it('学部一覧を取得する', async () => {
      server.use(
        http.get(/\/account-setting\/departments$/, () => {
          return HttpResponse.json([
            {
              id: 'dept-1',
              department_code: 'LIT',
              department_name: '文学部',
              is_active: true,
            },
          ]);
        })
      );

      const result = await service.getAllDepartments();
      expect(result).toHaveLength(1);
      expect(result[0].department_name).toBe('文学部');
    });
  });

  describe('validateProfileData', () => {
    it('バリデーション結果を取得する', async () => {
      server.use(
        http.post(/\/account-setting\/validate$/, () => {
          return HttpResponse.json({
            is_valid: true,
            errors: [],
            warnings: [],
          });
        })
      );

      const result = await service.validateProfileData({ student_id: '1234567890' });
      expect(result.is_valid).toBe(true);
    });
  });

  describe('getProfileHistory', () => {
    it('プロフィール履歴を取得する', async () => {
      server.use(
        http.get(/\/account-setting\/profile\/history/, () => {
          return HttpResponse.json([
            { id: 'h1', changed_at: '2024-01-01' },
          ]);
        })
      );

      const result = await service.getProfileHistory(10);
      expect(result).toHaveLength(1);
    });
  });
});
