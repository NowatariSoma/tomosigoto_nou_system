'use client';

import Select, { SelectOption } from '../../../components/ui/inputs/select';
import React, { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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
  year: number;
  department_code: string;
  email: string;
}

const AccountSettings: React.FC = () => {
  const {
    profile,
    departments,
    validation,
    isLoading,
    isSaving,
    error,
    loadProfile,
    loadDepartments,
    saveProfile,
    clearError,
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
    
    // フィールドエラーをクリア
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

  // 初期データの読み込み
  useEffect(() => {
    loadProfile();
    loadDepartments();
  }, [loadProfile, loadDepartments]);

  // プロフィールデータが読み込まれたらフォームに反映
  useEffect(() => {
    if (profile) {
      setFormData({
        student_id: profile.student_id || '',
        last_name_kanji: profile.last_name_kanji || '',
        first_name_kanji: profile.first_name_kanji || '',
        last_name_katakana: profile.last_name_katakana || '',
        first_name_katakana: profile.first_name_katakana || '',
        year: profile.year || VALIDATION.MIN_YEAR,
        department_code: profile.department_code || '',
        email: profile.email || ''
      });
    }
    // プロフィールが存在しない場合は何もしない（初期値のまま）
  }, [profile]);

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
      
      // 必須フィールドのデフォルト値を設定
      const dataToSave = {
        ...formData,
        department_code: formData.department_code || 'LIT', // デフォルト学部を設定
        year: formData.year || 1, // デフォルト学年を設定
      };
      
      const success = await saveProfile(dataToSave);
      if (success) {
        setSaveSuccess(true);
        // 3秒後に成功メッセージを非表示
        setTimeout(() => setSaveSuccess(false), 3000);
      } else if (validation && !validation.is_valid) {
        // バリデーションエラーをフィールド別に表示
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      {/* エラーメッセージ */}
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

      {/* 成功メッセージ */}
      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
               <span className="text-green-700">{UI_TEXT.SUCCESS_MESSAGE}</span>
        </div>
      )}

      {/* バリデーションエラー */}
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
        
      <div className="space-y-8">
        {/* Student ID */}
        <div className="flex items-center">
            <label className="w-32 text-gray-700 font-medium">学籍番号</label>
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
        </div>

        {/* Name Fields */}
        <div className="flex items-center space-x-8">
            <div className="flex items-center">
            <label className="w-32 text-gray-700 font-medium">姓</label>
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
            </div>
            <div className="flex items-center space-x-8">
            <label className="w-16 text-gray-700 font-medium">名</label>
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
            </div>
        </div>

        {/* Kana Fields */}
        <div className="flex items-center space-x-8">
            <div className="flex items-center">
            <label className="w-32 text-gray-700 font-medium">セイ</label>
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
            </div>
            <div className="flex items-center">
            <label className="w-24 text-gray-700 font-medium">メイ</label>
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
            </div>
        </div>

        {/* Year */}
        <div className="flex items-center">
            <label className="w-32 text-gray-700 font-medium">学年</label>
            <div className="w-20">
              <input
              type="number"
              value={formData.year}
              onChange={(e) => handleInputChange('year', parseInt(e.target.value) || 1)}
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
        </div>

        {/* Faculty Dropdown */}
        <div className="flex items-center">
            <label className="w-32 text-gray-700 font-medium">学部</label>
            <Select
                options={faculties}
                value={formData.faculty}
                onChange={handleFacultySelect}
                width="w-40"
            />
        </div>

        {/* Email */}
        <div className="flex items-center">
            <label className="w-32 text-gray-700 font-medium">メールアドレス</label>
            <div className="flex-1">
            <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="example@mail[].doshisha.ac.jp"
                className={`w-full max-w-md px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">※大学のメールアドレス</p>
            </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={handleNewUser}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            {UI_TEXT.NEW_USER_BUTTON}
          </button>
          <div>
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
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;