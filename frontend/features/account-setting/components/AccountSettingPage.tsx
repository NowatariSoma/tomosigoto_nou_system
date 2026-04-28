'use client';

import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Edit } from 'lucide-react';
import { useAccountSetting } from '../hooks/useAccountSetting';
import { useProfileForm } from '../hooks/useProfileForm';
import { UI_TEXT } from '../constants';
import { mapDepartmentsToOptions } from '../mappers';
import { Button } from '@/components/ui/forms/button';
import ProfileFormFields from './ProfileFormFields';

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

  const {
    formData,
    fieldErrors,
    saveSuccess,
    handleInputChange,
    handleDepartmentSelect,
    handleEdit,
    handleCancel,
    handleSave,
    getDepartmentName,
  } = useProfileForm(
    profile,
    departments,
    validation,
    isEditMode,
    saveProfile,
    clearError,
    setEditMode,
  );

  const departmentOptions = mapDepartmentsToOptions(departments);

  useEffect(() => {
    loadProfile();
    loadDepartments();
  }, [loadProfile, loadDepartments]);

  return (
    <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-8">
      {error && (
        <div className="mb-6 p-4 panel-error rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 text-black mr-2" />
          <span className="text-black">{error}</span>
          <Button onClick={clearError} variant="ghost" size="icon" className="ml-auto">
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
            <Button onClick={handleEdit} className="flex items-center">
              <Edit className="h-4 w-4 mr-2" />
              {profile ? '編集' : '登録'}
            </Button>
          )}
        </div>

        <ProfileFormFields
          formData={formData}
          fieldErrors={fieldErrors}
          isEditMode={isEditMode}
          isSaving={isSaving}
          isLoading={isLoading}
          profile={profile}
          departmentOptions={departmentOptions}
          getDepartmentName={getDepartmentName}
          onInputChange={handleInputChange}
          onDepartmentSelect={handleDepartmentSelect}
          onCancel={handleCancel}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default AccountSettings;
