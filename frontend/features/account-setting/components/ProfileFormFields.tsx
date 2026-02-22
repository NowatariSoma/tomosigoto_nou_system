'use client';

import React from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import Select from '@/components/ui/inputs/select';
import { UI_TEXT } from '../constants';
import type { ProfileFormData } from '../hooks/useProfileForm';
import type { SelectOption } from '@/components/ui/inputs/select';

interface ProfileFormFieldsProps {
  formData: ProfileFormData;
  fieldErrors: Record<string, string>;
  isEditMode: boolean;
  isSaving: boolean;
  isLoading: boolean;
  profile: any;
  departmentOptions: SelectOption[];
  getDepartmentName: () => string;
  onInputChange: (field: keyof ProfileFormData, value: string | number) => void;
  onDepartmentSelect: (departmentCode: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

interface FieldRowProps {
  label: string;
  labelWidth?: string;
  isEditMode: boolean;
  displayValue: string;
  error?: string;
  children: React.ReactNode;
}

const FieldRow: React.FC<FieldRowProps> = ({
  label,
  labelWidth = 'w-32',
  isEditMode,
  displayValue,
  error,
  children,
}) => (
  <div className="flex items-center">
    <label className={`${labelWidth} text-black font-medium`}>{label}</label>
    {isEditMode ? (
      <div className="flex-1 max-w-xs">
        {children}
        {error && <p className="text-black text-sm mt-1">{error}</p>}
      </div>
    ) : (
      <span className="text-black">{displayValue}</span>
    )}
  </div>
);

const ProfileFormFields: React.FC<ProfileFormFieldsProps> = ({
  formData,
  fieldErrors,
  isEditMode,
  isSaving,
  isLoading,
  profile,
  departmentOptions,
  getDepartmentName,
  onInputChange,
  onDepartmentSelect,
  onCancel,
  onSave,
}) => (
  <div className="space-y-6">
    {/* 学籍番号 */}
    <FieldRow
      label="学籍番号"
      isEditMode={isEditMode}
      displayValue={formData.student_id || '-'}
      error={fieldErrors.student_id}
    >
      <Input
        type="text"
        value={formData.student_id}
        onChange={(e) => onInputChange('student_id', e.target.value)}
        className={fieldErrors.student_id ? 'border-gray-500' : ''}
      />
    </FieldRow>

    {/* 姓名（漢字） */}
    <div className="flex items-center space-x-8">
      <div className="flex items-center">
        <label className="w-32 text-black font-medium">姓</label>
        {isEditMode ? (
          <div className="w-40">
            <Input
              type="text"
              value={formData.last_name_kanji}
              onChange={(e) => onInputChange('last_name_kanji', e.target.value)}
              className={fieldErrors.last_name_kanji ? 'border-gray-500' : ''}
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
              onChange={(e) => onInputChange('first_name_kanji', e.target.value)}
              className={fieldErrors.first_name_kanji ? 'border-gray-500' : ''}
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

    {/* 姓名（カタカナ） */}
    <div className="flex items-center space-x-8">
      <div className="flex items-center">
        <label className="w-32 text-black font-medium">セイ</label>
        {isEditMode ? (
          <div className="w-40">
            <Input
              type="text"
              value={formData.last_name_katakana}
              onChange={(e) => onInputChange('last_name_katakana', e.target.value)}
              className={fieldErrors.last_name_katakana ? 'border-gray-500' : ''}
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
              onChange={(e) => onInputChange('first_name_katakana', e.target.value)}
              className={fieldErrors.first_name_katakana ? 'border-gray-500' : ''}
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

    {/* 学年 */}
    <div className="flex items-center">
      <label className="w-32 text-black font-medium">学年</label>
      {isEditMode ? (
        <div className="w-20">
          <Input
            type="number"
            value={formData.year}
            onChange={(e) => {
              const value = e.target.value;
              onInputChange('year', value === '' ? '' : parseInt(value));
            }}
            min="1"
            max="6"
            className={fieldErrors.year ? 'border-gray-500' : ''}
          />
          {fieldErrors.year && (
            <p className="text-black text-sm mt-1">{fieldErrors.year}</p>
          )}
        </div>
      ) : (
        <span className="text-black">{formData.year || '-'}年</span>
      )}
    </div>

    {/* 学部 */}
    <div className="flex items-center">
      <label className="w-32 text-black font-medium">学部</label>
      {isEditMode ? (
        <Select
          options={departmentOptions}
          value={formData.department_code}
          onChange={onDepartmentSelect}
          width="w-40"
        />
      ) : (
        <span className="text-black">{getDepartmentName() || '-'}</span>
      )}
    </div>

    {/* メールアドレス */}
    <div className="flex items-center">
      <label className="w-32 text-black font-medium">メールアドレス</label>
      {isEditMode && !profile ? (
        <div className="flex-1">
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            placeholder="example@mail.doshisha.ac.jp"
            className={`max-w-md ${fieldErrors.email ? 'border-gray-500' : ''}`}
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

    {/* 保存/キャンセルボタン */}
    {isEditMode && (
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="px-6 flex items-center bg-gray-500 text-white hover:bg-gray-600 hover:text-white"
        >
          <X className="h-4 w-4 mr-2" />
          キャンセル
        </Button>
        <Button
          type="button"
          onClick={onSave}
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
);

export default ProfileFormFields;
