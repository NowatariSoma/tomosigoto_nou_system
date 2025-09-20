'use client';

import { useState, useCallback } from 'react';
import { accountSettingService } from '../services/account-setting-service';
import { AccountSettingProfile, AccountSettingUpdateRequest, Department, ValidationResponse } from '../types';

export interface UseAccountSettingReturn {
  // データ
  profile: AccountSettingProfile | null;
  departments: Department[];
  validation: ValidationResponse | null;
  
  // ローディング状態
  isLoading: boolean;
  isSaving: boolean;
  isValidating: boolean;
  
  // エラー状態
  error: string | null;
  
  // アクション
  loadProfile: () => Promise<void>;
  loadDepartments: () => Promise<void>;
  saveProfile: (data: AccountSettingUpdateRequest) => Promise<boolean>;
  validateProfile: (data: Record<string, any>) => Promise<boolean>;
  clearError: () => void;
}

export function useAccountSetting(): UseAccountSettingReturn {
  const [profile, setProfile] = useState<AccountSettingProfile | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const profileData = await accountSettingService.getCurrentUserProfile();
      setProfile(profileData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'プロフィールの読み込みに失敗しました';
      setError(errorMessage);
      console.error('Failed to load profile:', err);
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
      
      // 常に新規プロフィールを作成（テスト用）
      console.log('Creating new profile with data:', data);
      const savedProfile = await accountSettingService.createProfile(data);
      
      setProfile(savedProfile);
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

  return {
    profile,
    departments,
    validation,
    isLoading,
    isSaving,
    isValidating,
    error,
    loadProfile,
    loadDepartments,
    saveProfile,
    validateProfile,
    clearError,
  };
}
