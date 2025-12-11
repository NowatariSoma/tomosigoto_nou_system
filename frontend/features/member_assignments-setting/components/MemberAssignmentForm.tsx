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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/inputs/select';

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
    <Card className="mb-8 card-blue shadow-xl">
      <CardHeader className="panel-info">
        <CardTitle className="text-xl text-black flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {isEditing ? '所属編集' : UI_TEXT.ASSIGNMENT_TITLE}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stage Selection */}
            <div className="space-y-2">
              <Label htmlFor="stage" className="label-form-semibold flex items-center gap-2">
                <Theater className="h-4 w-4" />
                舞台
              </Label>
              <Select value={selectedStageId} onValueChange={handleStageChange} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="舞台を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name} ({new Date(stage.performance_date).toLocaleDateString('ja-JP')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Part Selection */}
            <div className="space-y-2">
              <Label htmlFor="part" className="label-form-semibold flex items-center gap-2">
                <Music className="h-4 w-4" />
                {UI_TEXT.PART_LABEL}
              </Label>
              <Select
                value={selectedPartId}
                onValueChange={(value) => {
                  onPartChange(value);
                  onInputChange('part_id', value);
                }}
                disabled={!selectedStageId}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="パートを選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {availableParts.map((part) => (
                    <SelectItem key={part.id} value={part.id}>
                      {part.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Selection */}
            <div className="space-y-2">
              <Label htmlFor="userId" className="label-form-semibold flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                {UI_TEXT.USER_LABEL}
              </Label>
              <Select
                value={formData.user_id}
                onValueChange={(value) => onInputChange('user_id', value)}
                disabled={loading}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="ユーザーを選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category" className="label-form-semibold flex items-center gap-2">
                <Music className="h-4 w-4" />
                {UI_TEXT.CATEGORY_LABEL}
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => onInputChange('category', value as 'utai' | 'mai')}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <Label htmlFor="displayOrder" className="label-form-semibold flex items-center gap-2">
              <Music className="h-4 w-4" />
              {UI_TEXT.DISPLAY_ORDER_LABEL}
            </Label>
            <Input
              id="displayOrder"
              type="number"
              min={DISPLAY_ORDER_LIMITS.MIN}
              max={DISPLAY_ORDER_LIMITS.MAX}
              value={formData.display_order || 0}
              onChange={(e) => onInputChange('display_order', parseInt(e.target.value) || 0)}
              className="input-field"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 justify-between pt-4">
            {/* Delete Button (only show when editing) */}
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (window.confirm(UI_TEXT.CONFIRM_DELETE)) {
                    onDelete();
                  }
                }}
                className="px-6 py-2"
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
                className="px-6 py-2"
              >
                {UI_TEXT.CANCEL}
              </Button>
              <Button
                type="submit"
                disabled={!isValid}
                className="px-6 py-2"
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
