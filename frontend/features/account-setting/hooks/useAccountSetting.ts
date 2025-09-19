'use client';

import { useState, useCallback } from 'react';
import { accountSettingService, AccountSettingProfile, AccountSettingUpdateRequest, Faculty, ValidationResponse } from '../services/account-setting-service';

export interface UseAccountSettingReturn {
  // データ
  profile: AccountSettingProfile | null;
  faculties: Faculty[];
  validation: ValidationResponse | null;
  
  // ローディング状態
  isLoading: boolean;
  isSaving: boolean;
  isValidating: boolean;
  
  // エラー状態
  error: string | null;
  
  // アクション
  loadProfile: () => Promise<void>;
  loadFaculties: () => Promise<void>;
  saveProfile: (data: AccountSettingUpdateRequest) => Promise<boolean>;
  validateProfile: (data: Record<string, any>) => Promise<boolean>;
  clearError: () => void;
}

export function useAccountSetting(): UseAccountSettingReturn {
  const [profile, setProfile] = useState<AccountSettingProfile | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
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

  const loadFaculties = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const facultiesData = await accountSettingService.getAllFaculties();
      setFaculties(facultiesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '学部データの読み込みに失敗しました';
      setError(errorMessage);
      console.error('Failed to load faculties:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateProfile = useCallback(async (data: Record<string, any>): Promise<boolean> => {
    try {
      setIsValidating(true);
      setError(null);
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
    faculties,
    validation,
    isLoading,
    isSaving,
    isValidating,
    error,
    loadProfile,
    loadFaculties,
    saveProfile,
    validateProfile,
    clearError,
  };
}
