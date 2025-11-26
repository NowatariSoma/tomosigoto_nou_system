'use client';

import Select, { SelectOption } from '../../../components/ui/inputs/select';
import React, { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle, AlertCircle, Loader2, Edit, X } from 'lucide-react';
import { useAccountSetting } from '../hooks/useAccountSetting';
import { AccountSettingProfile, Department } from '../types';
import { INITIAL_ACCOUNT_FORM, UI_TEXT, VALIDATION } from '../constants';
import { mapDepartmentsToOptions } from '../mappers';

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
    userRole,
    userInfo,
    isLoading,
    isSaving,
    error,
    isEditMode,
    loadProfile,
    loadDepartments,
    loadUserRole,
    loadUserInfo,
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
      loadUserRole();
      loadUserInfo();
    };

    checkAuthAndLoad();
  }, [loadProfile, loadDepartments, loadUserRole, loadUserInfo]);

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

  const getRoleLabel = (roleType: string) => {
    switch (roleType) {
      case 'admin':
        return '管理者';
      case 'general':
        return '一般ユーザー';
      default:
        return roleType;
    }
  };

  const getDepartmentName = () => {
    if (!formData.department_code) return '';
    const dept = departments.find(d => d.department_code === formData.department_code);
    return dept?.department_name || '';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={clearError}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <span className="text-green-700">{UI_TEXT.SUCCESS_MESSAGE}</span>
        </div>
      )}

      {validation && !validation.is_valid && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="text-yellow-700 font-medium">{UI_TEXT.VALIDATION_ERROR}</span>
          </div>
          <ul className="list-disc list-inside text-yellow-700 text-sm">
            {validation.errors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {!profile && (
        <div className="mb-6 p-4 bg-white border border-blue-200 rounded-md flex items-start space-x-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <p className="text-gray-900 font-semibold">プロフィール設定が必要です</p>
            <p className="text-sm text-gray-800 mt-1">
              サインアップ後の初回ログインでは、ここでプロフィールを登録するまで他のページへは移動できません。
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {userInfo && (
          <div className="pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-4">ユーザー情報</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <label className="w-32 text-gray-700 font-medium">ユーザーID</label>
                <span className="text-gray-900">{userInfo.id}</span>
              </div>
              {userRole && (
                <div className="flex items-center">
                  <label className="w-32 text-gray-700 font-medium">ロール</label>
                  <span className="text-gray-900">{getRoleLabel(userRole.role_type)}</span>
                </div>
              )}
              {userInfo.last_sign_in_at && (
                <div className="flex items-center">
                  <label className="w-32 text-gray-700 font-medium">最終ログイン</label>
                  <span className="text-gray-900">{new Date(userInfo.last_sign_in_at).toLocaleString('ja-JP')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold">プロフィール情報</h3>
            {!profile && !isEditMode && (
              <p className="text-sm text-gray-500 mt-1">プロフィール情報を登録してください</p>
            )}
          </div>
          {!isEditMode && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              {profile ? '編集' : '登録'}
            </button>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center">
            <label className="w-32 text-gray-700 font-medium">学籍番号</label>
            {isEditMode ? (
              <div className="flex-1 max-w-xs">
                <input
                  type="text"
                  value={formData.student_id}
                  onChange={(e) => handleInputChange('student_id', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldErrors.student_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.student_id && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.student_id}</p>
                )}
              </div>
            ) : (
              <span className="text-gray-900">{formData.student_id || '-'}</span>
            )}
          </div>

          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <label className="w-32 text-gray-700 font-medium">姓</label>
              {isEditMode ? (
                <div className="w-40">
                  <input
                    type="text"
                    value={formData.last_name_kanji}
                    onChange={(e) => handleInputChange('last_name_kanji', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      fieldErrors.last_name_kanji ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.last_name_kanji && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.last_name_kanji}</p>
                  )}
                </div>
              ) : (
                <span className="text-gray-900">{formData.last_name_kanji || '-'}</span>
              )}
            </div>
            <div className="flex items-center space-x-8">
              <label className="w-16 text-gray-700 font-medium">名</label>
              {isEditMode ? (
                <div className="w-40">
                  <input
                    type="text"
                    value={formData.first_name_kanji}
                    onChange={(e) => handleInputChange('first_name_kanji', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      fieldErrors.first_name_kanji ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.first_name_kanji && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.first_name_kanji}</p>
                  )}
                </div>
              ) : (
                <span className="text-gray-900">{formData.first_name_kanji || '-'}</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <label className="w-32 text-gray-700 font-medium">セイ</label>
              {isEditMode ? (
                <div className="w-40">
                  <input
                    type="text"
                    value={formData.last_name_katakana}
                    onChange={(e) => handleInputChange('last_name_katakana', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      fieldErrors.last_name_katakana ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.last_name_katakana && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.last_name_katakana}</p>
                  )}
                </div>
              ) : (
                <span className="text-gray-900">{formData.last_name_katakana || '-'}</span>
              )}
            </div>
            <div className="flex items-center">
              <label className="w-24 text-gray-700 font-medium">メイ</label>
              {isEditMode ? (
                <div className="w-40">
                  <input
                    type="text"
                    value={formData.first_name_katakana}
                    onChange={(e) => handleInputChange('first_name_katakana', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      fieldErrors.first_name_katakana ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.first_name_katakana && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.first_name_katakana}</p>
                  )}
                </div>
              ) : (
                <span className="text-gray-900">{formData.first_name_katakana || '-'}</span>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <label className="w-32 text-gray-700 font-medium">学年</label>
            {isEditMode ? (
              <div className="w-20">
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('year', value === '' ? '' : parseInt(value));
                  }}
                  min="1"
                  max="6"
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldErrors.year ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.year && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.year}</p>
                )}
              </div>
            ) : (
              <span className="text-gray-900">{formData.year || '-'}年</span>
            )}
          </div>

          <div className="flex items-center">
            <label className="w-32 text-gray-700 font-medium">学部</label>
            {isEditMode ? (
              <Select
                options={departmentOptions}
                value={formData.department_code}
                onChange={handleDepartmentSelect}
                width="w-40"
              />
            ) : (
              <span className="text-gray-900">{getDepartmentName() || '-'}</span>
            )}
          </div>

          <div className="flex items-center">
            <label className="w-32 text-gray-700 font-medium">メールアドレス</label>
            {isEditMode && !profile ? (
              <div className="flex-1">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="example@mail.doshisha.ac.jp"
                  className={`w-full max-w-md px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">※大学のメールアドレス</p>
              </div>
            ) : (
              <div className="flex-1">
                <span className="text-gray-900">{formData.email || '-'}</span>
                <p className="text-sm text-gray-500 mt-1">
                  ※メールアドレスは{profile ? '変更できません' : '初回登録後は変更できません'}
                </p>
              </div>
            )}
          </div>

          {isEditMode && (
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {UI_TEXT.SAVING_TEXT}
                  </>
                ) : (
                  UI_TEXT.SAVE_BUTTON
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;