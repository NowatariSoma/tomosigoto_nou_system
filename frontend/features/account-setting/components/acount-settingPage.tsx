'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAccountSetting } from '../hooks/useAccountSetting';

interface FormData {
  student_id: string;
  last_name_kanji: string;
  first_name_kanji: string;
  last_name_katakana: string;
  first_name_katakana: string;
  year: number;
  faculty: string;
  email: string;
}

const AccountSettings: React.FC = () => {
  const {
    profile,
    faculties,
    validation,
    isLoading,
    isSaving,
    error,
    loadProfile,
    loadFaculties,
    saveProfile,
    clearError,
  } = useAccountSetting();

  const [formData, setFormData] = useState<FormData>({
    student_id: '1111111111',
    last_name_kanji: '田中',
    first_name_kanji: '太郎',
    last_name_katakana: 'タナカ',
    first_name_katakana: 'タロウ',
    year: 3,
    faculty: 'LIT',
    email: ''
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const facultyOptions = [
    { value: 'LIT', label: '文学部' },
    { value: 'LAW', label: '法学部' },
    { value: 'ECO', label: '経済学部' },
    { value: 'COM', label: '商学部' },
    { value: 'ENG', label: '理工学部' },
    { value: 'SPS', label: '社会学部' },
    { value: 'PSY', label: '心理学部' },
    { value: 'POL', label: '政策学部' },
    { value: 'CUL', label: '文化情報学部' },
    { value: 'GCS', label: 'グローバル・コミュニケーション学部' },
    { value: 'GRM', label: 'グローバル地域文化学部' },
    { value: 'LHS', label: '生命医科学部' },
    { value: 'SHS', label: 'スポーツ健康科学部' }
  ];

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

  const handleFacultySelect = (faculty: string) => {
    handleInputChange('faculty', faculty);
    setIsDropdownOpen(false);
  };

  // 初期データの読み込み
  useEffect(() => {
    loadProfile();
    loadFaculties();
  }, [loadProfile, loadFaculties]);

  // プロフィールデータが読み込まれたらフォームに反映
  useEffect(() => {
    if (profile) {
      setFormData({
        student_id: profile.student_id || '',
        last_name_kanji: profile.last_name_kanji || '',
        first_name_kanji: profile.first_name_kanji || '',
        last_name_katakana: profile.last_name_katakana || '',
        first_name_katakana: profile.first_name_katakana || '',
        year: profile.year || 1,
        faculty: profile.faculty || 'LIT',
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
      
      const success = await saveProfile(formData);
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
          <span className="text-green-700">プロフィールが正常に保存されました</span>
        </div>
      )}

      {/* バリデーションエラー */}
      {validation && !validation.is_valid && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="text-yellow-700 font-medium">入力内容に問題があります</span>
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
            <div className="relative">
            <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-40 px-4 py-2 border rounded-md bg-white text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center justify-between ${
                  fieldErrors.faculty ? 'border-red-500' : 'border-gray-300'
                }`}
            >
                <span>{facultyOptions.find(f => f.value === formData.faculty)?.label || formData.faculty}</span>
                <ChevronDown 
                className={`w-4 h-4 text-gray-500 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                }`} 
                />
            </button>
            
            {isDropdownOpen && (
                <div className="absolute z-10 w-40 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                <div className="max-h-60 overflow-y-auto">
                    {facultyOptions.map((faculty) => (
                    <button
                        key={faculty.value}
                        type="button"
                        onClick={() => handleFacultySelect(faculty.value)}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
                    >
                        {faculty.label}
                    </button>
                    ))}
                </div>
                </div>
            )}
            </div>
            {fieldErrors.faculty && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.faculty}</p>
            )}
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
            新しいユーザーで開始
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
                保存中...
              </>
            ) : (
              '保存'
            )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;