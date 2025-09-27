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
    <Card className="mb-8 border-2 border-emerald-200 shadow-xl">
      <CardHeader className="bg-emerald-50">
        <CardTitle className="text-xl text-emerald-800 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {isEditing ? '舞台編集' : UI_TEXT.REGISTRATION_TITLE}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Input */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                {UI_TEXT.DATE_LABEL}
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => onInputChange('date', e.target.value)}
                className="border-2 border-gray-200 focus:border-emerald-500 rounded-lg"
                required
              />
            </div>

            {/* Stage Name Input */}
            <div className="space-y-2">
              <Label htmlFor="stageName" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Theater className="h-4 w-4 text-emerald-600" />
                {UI_TEXT.STAGE_NAME_LABEL}
              </Label>
              <Input
                id="stageName"
                type="text"
                placeholder={UI_TEXT.STAGE_NAME_PLACEHOLDER}
                value={formData.stageName}
                onChange={(e) => onInputChange('stageName', e.target.value)}
                className="border-2 border-gray-200 focus:border-emerald-500 rounded-lg"
                required
              />
            </div>
          </div>

          {/* Part Count Control */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
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
                  onClick={() => onPartCountChange(Math.min(PART_COUNT_LIMITS.MAX, formData.partCount + 1))}
                  disabled={formData.partCount >= PART_COUNT_LIMITS.MAX}
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
                    className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                  >
                    <User className="h-4 w-4 text-emerald-600" />
                    {UI_TEXT.PART_LABEL}{index + 1}
                  </Label>
                  <Input
                    id={`part${index}`}
                    type="text"
                    placeholder={`${UI_TEXT.PART_LABEL}${index + 1}${UI_TEXT.PART_PLACEHOLDER}`}
                    value={formData.parts[index] || ''}
                    onChange={(e) => {
                      const newParts = [...formData.parts];
                      newParts[index] = e.target.value;
                      onInputChange('parts', newParts);
                    }}
                    className="border-2 border-gray-200 focus:border-emerald-500 rounded-lg"
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
                className="px-6 py-2 border-2 border-red-300 text-red-600 hover:bg-red-50"
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
                className="px-6 py-2 border-2 border-gray-300 hover:bg-gray-50"
              >
                {UI_TEXT.CANCEL}
              </Button>
              <Button
                type="submit"
                disabled={!isValid}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-300"
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
