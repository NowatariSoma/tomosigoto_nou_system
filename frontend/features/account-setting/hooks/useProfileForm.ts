'use client';

import { useState, useEffect, useCallback } from 'react';
import { AccountSettingProfile, Department, ValidationResponse } from '../types';
import { INITIAL_ACCOUNT_FORM, VALIDATION } from '../constants';

export interface ProfileFormData {
  student_id: string;
  last_name_kanji: string;
  first_name_kanji: string;
  last_name_katakana: string;
  first_name_katakana: string;
  year: number | '';
  faculty: string;
  department_code: string;
  email: string;
}

export interface UseProfileFormReturn {
  formData: ProfileFormData;
  fieldErrors: Record<string, string>;
  saveSuccess: boolean;
  handleInputChange: (field: keyof ProfileFormData, value: string | number) => void;
  handleDepartmentSelect: (departmentCode: string) => void;
  handleEdit: () => void;
  handleCancel: () => void;
  handleSave: () => Promise<void>;
  getDepartmentName: () => string;
}

export function useProfileForm(
  profile: AccountSettingProfile | null,
  departments: Department[],
  validation: ValidationResponse | null,
  isEditMode: boolean,
  saveProfile: (data: any) => Promise<boolean>,
  clearError: () => void,
  setEditMode: (mode: boolean) => void,
): UseProfileFormReturn {
  const [formData, setFormData] = useState<ProfileFormData>(INITIAL_ACCOUNT_FORM as unknown as ProfileFormData);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // プロフィール変更時にフォームデータを同期
  useEffect(() => {
    if (profile) {
      setFormData({
        student_id: profile.student_id || '',
        last_name_kanji: profile.last_name_kanji || '',
        first_name_kanji: profile.first_name_kanji || '',
        last_name_katakana: profile.last_name_katakana || '',
        first_name_katakana: profile.first_name_katakana || '',
        year: profile.year || VALIDATION.MIN_YEAR,
        faculty: profile.faculty || '',
        department_code: profile.department_code || '',
        email: profile.email || '',
      });
    }
  }, [profile]);

  const handleInputChange = useCallback((field: keyof ProfileFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [fieldErrors]);

  const handleDepartmentSelect = useCallback((departmentCode: string) => {
    handleInputChange('department_code', departmentCode);
  }, [handleInputChange]);

  const handleEdit = useCallback(() => {
    setEditMode(true);
  }, [setEditMode]);

  const handleCancel = useCallback(() => {
    if (profile) {
      setFormData({
        student_id: profile.student_id || '',
        last_name_kanji: profile.last_name_kanji || '',
        first_name_kanji: profile.first_name_kanji || '',
        last_name_katakana: profile.last_name_katakana || '',
        first_name_katakana: profile.first_name_katakana || '',
        year: profile.year || VALIDATION.MIN_YEAR,
        faculty: profile.faculty || '',
        department_code: profile.department_code || '',
        email: profile.email || '',
      });
    }
    setEditMode(false);
    setFieldErrors({});
  }, [profile, setEditMode]);

  const handleSave = useCallback(async () => {
    try {
      clearError();
      setSaveSuccess(false);
      setFieldErrors({});

      const { faculty, ...restFormData } = formData;
      const dataToSave = {
        ...restFormData,
        department_code: formData.department_code || 'LIT',
        year: typeof formData.year === 'number' && formData.year > 0 ? formData.year : 1,
      };

      const success = await saveProfile(dataToSave);
      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else if (validation && !validation.is_valid) {
        const errors: Record<string, string> = {};
        validation.errors.forEach(error => {
          errors[error.field] = error.message;
        });
        setFieldErrors(errors);
      }
    } catch (err) {
      // エラーはuseAccountSettingで処理される
    }
  }, [formData, validation, saveProfile, clearError]);

  const getDepartmentName = useCallback(() => {
    if (!formData.department_code) return '';
    const dept = departments.find(d => d.department_code === formData.department_code);
    return dept?.department_name || '';
  }, [formData.department_code, departments]);

  return {
    formData,
    fieldErrors,
    saveSuccess,
    handleInputChange,
    handleDepartmentSelect,
    handleEdit,
    handleCancel,
    handleSave,
    getDepartmentName,
  };
}
