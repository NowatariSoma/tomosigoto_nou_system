'use client';

import Select, { SelectOption } from '../../../components/ui/inputs/select';
import React, { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle, AlertCircle, Loader2, Edit, X } from 'lucide-react';
import { useAccountSetting } from '../hooks/useAccountSetting';
import { AccountSettingProfile, Department } from '../types';
import { INITIAL_ACCOUNT_FORM, UI_TEXT, VALIDATION } from '../constants';
import { mapDepartmentsToOptions } from '../mappers';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';

interface FormData {
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

// 学部のオプション
const faculties: SelectOption[] = [
  { value: 'literature', label: '文学部' },
  { value: 'economics', label: '経済学部' },
  { value: 'law', label: '法学部' },
  { value: 'science', label: '理学部' },
  { value: 'engineering', label: '工学部' },
  { value: 'medicine', label: '医学部' },
  { value: 'pharmacy', label: '薬学部' },
  { value: 'agriculture', label: '農学部' },
  { value: 'education', label: '教育学部' },
  { value: 'other', label: 'その他' },
];

const AccountSettings: React.FC = () => {
  const {
    profile,
    departments,
    validation,
    isLoading,
    isSaving,
    error,
    isEditMode,
    loadProfile,
    loadDepartments,
    saveProfile,
    clearError,
    setEditMode,
  } = useAccountSetting();

  const [formData, setFormData] = useState<FormData>(INITIAL_ACCOUNT_FORM);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const departmentOptions = mapDepartmentsToOptions(departments);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleDepartmentSelect = (department_code: string) => {
    handleInputChange('department_code', department_code);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
      console.log('Supabaseセッション:', session ? 'あり' : 'なし');

      loadProfile();
      loadDepartments();
    };

    checkAuthAndLoad();
  }, [loadProfile, loadDepartments]);

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
        email: profile.email || ''
      });
    }
  }, [profile]);

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
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
        email: profile.email || ''
      });
    }
    setEditMode(false);
    setFieldErrors({});
  };

  const handleFacultySelect = (value: string) => {
    setFormData(prev => ({
      ...prev,
      faculty: value
    }));
  };

  const handleNewUser = () => {
    // セッションストレージをクリアして新しいユーザーIDを生成
    sessionStorage.removeItem('test-user-id');
    // ページをリロード
    window.location.reload();
  };

  const handleSave = async () => {
    try {
      clearError();
      setSaveSuccess(false);
      setFieldErrors({});

      // facultyはバックエンドで使用しないため除外
      const { faculty, ...restFormData } = formData;
      const dataToSave = {
        ...restFormData,
        department_code: formData.department_code || 'LIT',
        year: typeof formData.year === 'number' && formData.year > 0 ? formData.year : 1,
      };

      console.log('Sending data:', JSON.stringify(dataToSave, null, 2));

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
      console.error('Save failed:', err);
    }
  };

  const getDepartmentName = () => {
    if (!formData.department_code) return '';
    const dept = departments.find(d => d.department_code === formData.department_code);
    return dept?.department_name || '';
  };

  return (
    <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-8">
      {error && (
        <div className="mb-6 p-4 panel-error rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 text-black mr-2" />
          <span className="text-black">{error}</span>
          <Button
            onClick={clearError}
            variant="ghost"
            size="icon"
            className="ml-auto"
          >
            ×
          </Button>
        </div>
      )}

      {saveSuccess && (
        <div className="mb-6 p-4 panel-success rounded-md flex items-center">
          <CheckCircle className="h-5 w-5 text-black mr-2" />
          <span className="text-black">{UI_TEXT.SUCCESS_MESSAGE}</span>
        </div>
      )}

      {validation && !validation.is_valid && (
        <div className="mb-6 p-4 panel-warning rounded-md">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-900 font-medium">{UI_TEXT.VALIDATION_ERROR}</span>
          </div>
          <ul className="list-disc list-inside text-yellow-800 text-sm">
            {validation.errors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {!profile && (
        <div className="mb-6 p-4 bg-white border border-blue-200 rounded-md flex items-start space-x-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-black mt-0.5" />
          <div>
            <p className="text-black font-semibold">プロフィール設定が必要です</p>
            <p className="text-sm text-black mt-1">
              サインアップ後の初回ログインでは、ここでプロフィールを登録するまで他のページへは移動できません。
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold">プロフィール情報</h3>
            {!profile && !isEditMode && (
              <p className="text-sm text-black mt-1">プロフィール情報を登録してください</p>
            )}
          </div>
          {!isEditMode && (
            <Button
              onClick={handleEdit}
              className="flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              {profile ? '編集' : '登録'}
            </Button>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center">
            <label className="w-32 text-black font-medium">学籍番号</label>
            {isEditMode ? (
              <div className="flex-1 max-w-xs">
                <Input
                  type="text"
                  value={formData.student_id}
                  onChange={(e) => handleInputChange('student_id', e.target.value)}
                  className={
                    fieldErrors.student_id ? 'border-gray-500' : ''
                  }
                />
                {fieldErrors.student_id && (
                  <p className="text-black text-sm mt-1">{fieldErrors.student_id}</p>
                )}
              </div>
            ) : (
              <span className="text-black">{formData.student_id || '-'}</span>
            )}
          </div>

          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <label className="w-32 text-black font-medium">姓</label>
              {isEditMode ? (
                <div className="w-40">
                  <Input
                    type="text"
                    value={formData.last_name_kanji}
                    onChange={(e) => handleInputChange('last_name_kanji', e.target.value)}
                    className={
                      fieldErrors.last_name_kanji ? 'border-gray-500' : ''
                    }
                  />
                  {fieldErrors.last_name_kanji && (
                    <p className="text-black text-sm mt-1">{fieldErrors.last_name_kanji}</p>
                  )}
                </div>
              ) : (
                <span className="text-black">{formData.last_name_kanji || '-'}</span>
              )}
            </div>
            <div className="flex items-center space-x-8">
              <label className="w-16 text-black font-medium">名</label>
              {isEditMode ? (
                <div className="w-40">
                  <Input
                    type="text"
                    value={formData.first_name_kanji}
                    onChange={(e) => handleInputChange('first_name_kanji', e.target.value)}
                    className={
                      fieldErrors.first_name_kanji ? 'border-gray-500' : ''
                    }
                  />
                  {fieldErrors.first_name_kanji && (
                    <p className="text-black text-sm mt-1">{fieldErrors.first_name_kanji}</p>
                  )}
                </div>
              ) : (
                <span className="text-black">{formData.first_name_kanji || '-'}</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <label className="w-32 text-black font-medium">セイ</label>
              {isEditMode ? (
                <div className="w-40">
                  <Input
                    type="text"
                    value={formData.last_name_katakana}
                    onChange={(e) => handleInputChange('last_name_katakana', e.target.value)}
                    className={
                      fieldErrors.last_name_katakana ? 'border-gray-500' : ''
                    }
                  />
                  {fieldErrors.last_name_katakana && (
                    <p className="text-black text-sm mt-1">{fieldErrors.last_name_katakana}</p>
                  )}
                </div>
              ) : (
                <span className="text-black">{formData.last_name_katakana || '-'}</span>
              )}
            </div>
            <div className="flex items-center">
              <label className="w-24 text-black font-medium">メイ</label>
              {isEditMode ? (
                <div className="w-40">
                  <Input
                    type="text"
                    value={formData.first_name_katakana}
                    onChange={(e) => handleInputChange('first_name_katakana', e.target.value)}
                    className={
                      fieldErrors.first_name_katakana ? 'border-gray-500' : ''
                    }
                  />
                  {fieldErrors.first_name_katakana && (
                    <p className="text-black text-sm mt-1">{fieldErrors.first_name_katakana}</p>
                  )}
                </div>
              ) : (
                <span className="text-black">{formData.first_name_katakana || '-'}</span>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <label className="w-32 text-black font-medium">学年</label>
            {isEditMode ? (
              <div className="w-20">
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('year', value === '' ? '' : parseInt(value));
                  }}
                  min="1"
                  max="6"
                  className={
                    fieldErrors.year ? 'border-gray-500' : ''
                  }
                />
                {fieldErrors.year && (
                  <p className="text-black text-sm mt-1">{fieldErrors.year}</p>
                )}
              </div>
            ) : (
              <span className="text-black">{formData.year || '-'}年</span>
            )}
          </div>

          <div className="flex items-center">
            <label className="w-32 text-black font-medium">学部</label>
            {isEditMode ? (
              <Select
                options={departmentOptions}
                value={formData.department_code}
                onChange={handleDepartmentSelect}
                width="w-40"
              />
            ) : (
              <span className="text-black">{getDepartmentName() || '-'}</span>
            )}
          </div>

          <div className="flex items-center">
            <label className="w-32 text-black font-medium">メールアドレス</label>
            {isEditMode && !profile ? (
              <div className="flex-1">
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="example@mail.doshisha.ac.jp"
                  className={`max-w-md ${
                    fieldErrors.email ? 'border-gray-500' : ''
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-black text-sm mt-1">{fieldErrors.email}</p>
                )}
                <p className="text-sm text-black mt-1">※大学のメールアドレス</p>
              </div>
            ) : (
              <div className="flex-1">
                <span className="text-black">{formData.email || '-'}</span>
                <p className="text-sm text-black mt-1">
                  ※メールアドレスは{profile ? '変更できません' : '初回登録後は変更できません'}
                </p>
              </div>
            )}
          </div>

          {isEditMode && (
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                className="px-6 flex items-center bg-gray-500 text-white hover:bg-gray-600 hover:text-white"
              >
                <X className="h-4 w-4 mr-2" />
                キャンセル
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="px-6 font-medium flex items-center"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {UI_TEXT.SAVING_TEXT}
                  </>
                ) : (
                  UI_TEXT.SAVE_BUTTON
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;