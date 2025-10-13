'use client';

import { useState, useCallback } from 'react';
import { accountSettingService } from '../services/account-setting-service';
import { AccountSettingProfile, AccountSettingUpdateRequest, Department, ValidationResponse, UserRole, UserInfo } from '../types';

export interface UseAccountSettingReturn {
  // データ
  profile: AccountSettingProfile | null;
  departments: Department[];
  validation: ValidationResponse | null;
  userRole: UserRole | null;
  userInfo: UserInfo | null;

  // ローディング状態
  isLoading: boolean;
  isSaving: boolean;
  isValidating: boolean;

  // エラー状態
  error: string | null;

  // 編集モード
  isEditMode: boolean;

  // アクション
  loadProfile: () => Promise<void>;
  loadDepartments: () => Promise<void>;
  loadUserRole: () => Promise<void>;
  loadUserInfo: () => Promise<void>;
  saveProfile: (data: AccountSettingUpdateRequest) => Promise<boolean>;
  validateProfile: (data: Record<string, any>) => Promise<boolean>;
  clearError: () => void;
  setEditMode: (mode: boolean) => void;
}

export function useAccountSetting(): UseAccountSettingReturn {
  const [profile, setProfile] = useState<AccountSettingProfile | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const profileData = await accountSettingService.getCurrentUserProfile();
      setProfile(profileData);
    } catch (err: any) {
      if (err?.status === 404 || err?.status === 403) {
        setProfile(null);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'プロフィールの読み込みに失敗しました';
        setError(errorMessage);
        console.error('Failed to load profile:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const departmentsData = await accountSettingService.getAllDepartments();
      setDepartments(departmentsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '学部データの読み込みに失敗しました';
      setError(errorMessage);
      console.error('Failed to load departments:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUserRole = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const roleData = await accountSettingService.getCurrentUserRole();
      setUserRole(roleData);
    } catch (err: any) {
      if (err?.status === 403) {
        console.log('認証エラー: ロール情報の取得に失敗');
      } else {
        console.error('Failed to load user role:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUserInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const infoData = await accountSettingService.getCurrentUserInfo();
      setUserInfo(infoData);
    } catch (err: any) {
      if (err?.status === 403) {
        console.log('認証エラー: ユーザー情報の取得に失敗');
      } else {
        console.error('Failed to load user info:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateProfile = useCallback(async (data: Record<string, any>): Promise<boolean> => {
    try {
      setIsValidating(true);
      setError(null);
      
      // 必須フィールドのチェック
      const requiredFields = ['student_id', 'first_name_kanji', 'last_name_kanji', 'first_name_katakana', 'last_name_katakana', 'year', 'department_code'];
      const missingFields = requiredFields.filter(field => !data[field] || data[field] === '');
      
      if (missingFields.length > 0) {
        const errorMessage = `必須フィールドが入力されていません: ${missingFields.join(', ')}`;
        setError(errorMessage);
        return false;
      }
      
      const validationResult = await accountSettingService.validateProfileData(data);
      setValidation(validationResult);
      return validationResult.is_valid;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'バリデーションに失敗しました';
      setError(errorMessage);
      console.error('Failed to validate profile:', err);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const saveProfile = useCallback(async (data: AccountSettingUpdateRequest): Promise<boolean> => {
    try {
      setIsSaving(true);
      setError(null);
      
      // バリデーション実行
      const isValid = await validateProfile(data);
      if (!isValid) {
        return false;
      }
      
      const savedProfile = profile
        ? await accountSettingService.updateProfile(data)
        : await accountSettingService.createProfile(data);
      
      setProfile(savedProfile);
      setIsEditMode(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'プロフィールの保存に失敗しました';
      setError(errorMessage);
      console.error('Failed to save profile:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [profile, validateProfile]);

  const setEditMode = useCallback((mode: boolean) => {
    setIsEditMode(mode);
  }, []);

  return {
    profile,
    departments,
    validation,
    userRole,
    userInfo,
    isLoading,
    isSaving,
    isValidating,
    error,
    isEditMode,
    loadProfile,
    loadDepartments,
    loadUserRole,
    loadUserInfo,
    saveProfile,
    validateProfile,
    clearError,
    setEditMode,
  };
}
