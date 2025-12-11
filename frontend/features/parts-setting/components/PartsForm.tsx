'use client';

import React from 'react';
import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Plus, Calendar, Theater, User, PlusCircle, MinusCircle, Trash2 } from 'lucide-react';
import { CreateStageRequest } from '../types';
import { UI_TEXT, PART_COUNT_LIMITS } from '../constants';

interface PartsFormProps {
  formData: CreateStageRequest;
  onInputChange: (field: string, value: string | number | string[]) => void;
  onPartCountChange: (newCount: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isValid: boolean;
  isEditing?: boolean;
}

export const PartsForm: React.FC<PartsFormProps> = ({
  formData,
  onInputChange,
  onPartCountChange,
  onSubmit,
  onCancel,
  onDelete,
  isValid,
  isEditing = false,
}) => {
  return (
    <Card className="mb-8 card-blue shadow-xl">
      <CardHeader className="panel-info">
        <CardTitle className="text-xl text-black flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {isEditing ? '舞台編集' : UI_TEXT.REGISTRATION_TITLE}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Input */}
            <div className="space-y-2">
              <Label htmlFor="date" className="label-form-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {UI_TEXT.DATE_LABEL}
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => onInputChange('date', e.target.value)}
                className="input-field"
                required
              />
            </div>

            {/* Stage Name Input */}
            <div className="space-y-2">
              <Label htmlFor="stageName" className="label-form-semibold flex items-center gap-2">
                <Theater className="h-4 w-4" />
                {UI_TEXT.STAGE_NAME_LABEL}
              </Label>
              <Input
                id="stageName"
                type="text"
                placeholder={UI_TEXT.STAGE_NAME_PLACEHOLDER}
                value={formData.stageName}
                onChange={(e) => onInputChange('stageName', e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label className="label-form-semibold flex items-center gap-2">
              <Theater className="h-4 w-4" />
              ステータス
            </Label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={(e) => onInputChange('status', e.target.value)}
                  className="mr-2 text-black focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">アクティブ</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === 'inactive'}
                  onChange={(e) => onInputChange('status', e.target.value)}
                  className="mr-2 text-black focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">非アクティブ</span>
              </label>
            </div>
          </div>

          {/* Part Count Control */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="label-form-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                パート数
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onPartCountChange(Math.max(PART_COUNT_LIMITS.MIN, formData.partCount - 1))}
                  disabled={formData.partCount <= PART_COUNT_LIMITS.MIN}
                  className="p-2"
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-8 text-center">{formData.partCount}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onPartCountChange(formData.partCount + 1)}
                  className="p-2"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Part Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: formData.partCount }, (_, index) => (
                <div key={index} className="space-y-2">
                  <Label
                    htmlFor={`part${index}`}
                    className="label-form-semibold flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    {UI_TEXT.PART_LABEL}{index + 1}
                  </Label>
                  <Input
                    id={`part${index}`}
                    type="text"
                    placeholder={`パート名${index + 1}`}
                    value={formData.parts[index] || ''}
                    onChange={(e) => {
                      const newParts = [...formData.parts];
                      newParts[index] = e.target.value;
                      onInputChange('parts', newParts);
                    }}
                    className="input-field"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 justify-between pt-4">
            {/* Delete Button (only show when editing) */}
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (window.confirm('この舞台を削除しますか？')) {
                    onDelete();
                  }
                }}
                className="px-6 py-2"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                削除する
              </Button>
            )}
            
            {/* Right side buttons */}
            <div className="flex gap-4 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="px-6 py-2"
              >
                {UI_TEXT.CANCEL}
              </Button>
              <Button
                type="submit"
                disabled={!isValid}
                className="px-6 py-2"
              >
                {isEditing ? '更新する' : UI_TEXT.REGISTER}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
