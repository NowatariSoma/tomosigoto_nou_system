import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAccountSetting } from '@/features/account-setting/hooks/useAccountSetting';

// accountSettingServiceをモック
const mockGetCurrentUserProfile = vi.fn();
const mockGetAllDepartments = vi.fn();
const mockGetCurrentUserRole = vi.fn();
const mockGetCurrentUserInfo = vi.fn();
const mockValidateProfileData = vi.fn();
const mockCreateProfile = vi.fn();
const mockUpdateProfile = vi.fn();

vi.mock('@/features/account-setting/services/account-setting-service', () => ({
  accountSettingService: {
    getCurrentUserProfile: (...args: unknown[]) => mockGetCurrentUserProfile(...args),
    getAllDepartments: (...args: unknown[]) => mockGetAllDepartments(...args),
    getCurrentUserRole: (...args: unknown[]) => mockGetCurrentUserRole(...args),
    getCurrentUserInfo: (...args: unknown[]) => mockGetCurrentUserInfo(...args),
    validateProfileData: (...args: unknown[]) => mockValidateProfileData(...args),
    createProfile: (...args: unknown[]) => mockCreateProfile(...args),
    updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
  },
}));

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

describe('useAccountSetting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態を正しく設定する', () => {
    const { result } = renderHook(() => useAccountSetting());
    expect(result.current.profile).toBeNull();
    expect(result.current.departments).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isEditMode).toBe(false);
  });

  it('loadProfileでプロフィールを読み込む', async () => {
    mockGetCurrentUserProfile.mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useAccountSetting());

    await act(async () => {
      await result.current.loadProfile();
    });

    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.isLoading).toBe(false);
  });

  it('loadProfile失敗時にエラーを設定する', async () => {
    mockGetCurrentUserProfile.mockRejectedValue(new Error('プロフィール取得失敗'));

    const { result } = renderHook(() => useAccountSetting());

    await act(async () => {
      await result.current.loadProfile();
    });

    expect(result.current.error).toBe('プロフィール取得失敗');
  });

  it('404エラーの場合はprofileをnullに設定しエラーは設定しない', async () => {
    mockGetCurrentUserProfile.mockRejectedValue({ status: 404, message: 'Not found' });

    const { result } = renderHook(() => useAccountSetting());

    await act(async () => {
      await result.current.loadProfile();
    });

    expect(result.current.profile).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('loadDepartmentsで学部データを読み込む', async () => {
    const departments = [
      { id: 'dept-1', department_code: 'LIT', department_name: '文学部', is_active: true },
    ];
    mockGetAllDepartments.mockResolvedValue(departments);

    const { result } = renderHook(() => useAccountSetting());

    await act(async () => {
      await result.current.loadDepartments();
    });

    expect(result.current.departments).toEqual(departments);
  });

  it('loadUserRoleでユーザーロールを読み込む', async () => {
    const roleData = { role_type: 'admin', is_visible_to_general: true };
    mockGetCurrentUserRole.mockResolvedValue(roleData);

    const { result } = renderHook(() => useAccountSetting());

    await act(async () => {
      await result.current.loadUserRole();
    });

    expect(result.current.userRole).toEqual(roleData);
  });

  it('loadUserInfoでユーザー情報を読み込む', async () => {
    const userInfo = { id: 'user-1', email: 'test@example.com' };
    mockGetCurrentUserInfo.mockResolvedValue(userInfo);

    const { result } = renderHook(() => useAccountSetting());

    await act(async () => {
      await result.current.loadUserInfo();
    });

    expect(result.current.userInfo).toEqual(userInfo);
  });

  it('validateProfileで必須フィールドが不足している場合はfalseを返す', async () => {
    const { result } = renderHook(() => useAccountSetting());

    let isValid: boolean = false;
    await act(async () => {
      isValid = await result.current.validateProfile({ student_id: '' });
    });

    expect(isValid).toBe(false);
    expect(result.current.error).toContain('必須フィールド');
  });

  it('validateProfileで全フィールドが揃っている場合はAPIバリデーションを実行する', async () => {
    mockValidateProfileData.mockResolvedValue({ is_valid: true, errors: [], warnings: [] });

    const { result } = renderHook(() => useAccountSetting());

    const validData = {
      student_id: '1234567890',
      first_name_kanji: '太郎',
      last_name_kanji: '田中',
      first_name_katakana: 'タロウ',
      last_name_katakana: 'タナカ',
      year: 2,
      department_code: 'LIT',
    };

    let isValid: boolean = false;
    await act(async () => {
      isValid = await result.current.validateProfile(validData);
    });

    expect(isValid).toBe(true);
  });

  it('clearErrorでエラーをクリアする', async () => {
    mockGetCurrentUserProfile.mockRejectedValue(new Error('エラー'));

    const { result } = renderHook(() => useAccountSetting());

    await act(async () => {
      await result.current.loadProfile();
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('setEditModeで編集モードを切り替える', () => {
    const { result } = renderHook(() => useAccountSetting());

    act(() => {
      result.current.setEditMode(true);
    });

    expect(result.current.isEditMode).toBe(true);

    act(() => {
      result.current.setEditMode(false);
    });

    expect(result.current.isEditMode).toBe(false);
  });
});
