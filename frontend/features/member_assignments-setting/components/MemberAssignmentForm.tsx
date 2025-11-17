'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Plus, User as UserIcon, Theater, Music, Trash2 } from 'lucide-react';
import { CreateMemberAssignmentRequest, StageWithPartsAndAssignments } from '../types';
import { UI_TEXT, CATEGORY_OPTIONS, DISPLAY_ORDER_LIMITS } from '../constants';
import { userService, User as UserType } from '../services/user-service';

interface MemberAssignmentFormProps {
  formData: CreateMemberAssignmentRequest;
  onInputChange: (field: string, value: string | number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isValid: boolean;
  isEditing?: boolean;
  stages: StageWithPartsAndAssignments[];
  selectedStageId: string;
  selectedPartId: string;
  onStageChange: (stageId: string) => void;
  onPartChange: (partId: string) => void;
}

export const MemberAssignmentForm: React.FC<MemberAssignmentFormProps> = ({
  formData,
  onInputChange,
  onSubmit,
  onCancel,
  onDelete,
  isValid,
  isEditing = false,
  stages,
  selectedStageId,
  selectedPartId,
  onStageChange,
  onPartChange,
}) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedStage = stages.find(stage => stage.id === selectedStageId);
  const availableParts = selectedStage?.parts || [];

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersData = await userService.getUsers();
        setUsers(usersData);
      } catch (error) {
        // エラーは発生したが、ログは出力しない
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleStageChange = (stageId: string) => {
    onStageChange(stageId);
    onPartChange(''); // パート選択をリセット
    onInputChange('part_id', ''); // フォームデータもリセット
  };

  return (
    <Card className="mb-8 border-2 border-blue-200 shadow-xl">
      <CardHeader className="bg-blue-50">
        <CardTitle className="text-xl text-blue-800 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {isEditing ? '所属編集' : UI_TEXT.ASSIGNMENT_TITLE}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stage Selection */}
            <div className="space-y-2">
              <Label htmlFor="stage" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Theater className="h-4 w-4 text-blue-600" />
                舞台
              </Label>
              <select
                id="stage"
                value={selectedStageId}
                onChange={(e) => handleStageChange(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                required
              >
                <option value="">舞台を選択してください</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name} ({new Date(stage.performance_date).toLocaleDateString('ja-JP')})
                  </option>
                ))}
              </select>
            </div>

            {/* Part Selection */}
            <div className="space-y-2">
              <Label htmlFor="part" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Music className="h-4 w-4 text-blue-600" />
                {UI_TEXT.PART_LABEL}
              </Label>
              <select
                id="part"
                value={selectedPartId}
                onChange={(e) => {
                onPartChange(e.target.value);
                onInputChange('part_id', e.target.value);
                }}
                className="w-full px-3 py-2 border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                required
                disabled={!selectedStageId}
              >
                <option value="">パートを選択してください</option>
                {availableParts.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Selection */}
            <div className="space-y-2">
              <Label htmlFor="userId" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-blue-600" />
                {UI_TEXT.USER_LABEL}
              </Label>
              <select
                id="userId"
                value={formData.user_id}
                onChange={(e) => onInputChange('user_id', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                required
                disabled={loading}
              >
                <option value="">ユーザーを選択してください</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Music className="h-4 w-4 text-blue-600" />
                {UI_TEXT.CATEGORY_LABEL}
              </Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => onInputChange('category', e.target.value as 'utai' | 'mai')}
                className="w-full px-3 py-2 border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                required
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <Label htmlFor="displayOrder" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Music className="h-4 w-4 text-blue-600" />
              {UI_TEXT.DISPLAY_ORDER_LABEL}
            </Label>
            <Input
              id="displayOrder"
              type="number"
              min={DISPLAY_ORDER_LIMITS.MIN}
              max={DISPLAY_ORDER_LIMITS.MAX}
              value={formData.display_order || 0}
              onChange={(e) => onInputChange('display_order', parseInt(e.target.value) || 0)}
              className="border-2 border-gray-200 focus:border-blue-500 rounded-lg"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 justify-between pt-4">
            {/* Delete Button (only show when editing) */}
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (window.confirm(UI_TEXT.CONFIRM_DELETE)) {
                    onDelete();
                  }
                }}
                className="px-6 py-2 border-2 border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {UI_TEXT.DELETE}
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
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
              >
                {isEditing ? UI_TEXT.UPDATE : UI_TEXT.ASSIGN}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
