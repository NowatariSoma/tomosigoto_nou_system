import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  MemberAssignmentWithDetails,
  CreateMemberAssignmentRequest,
  StageWithPartsAndAssignments
} from '../types';
import { UI_TEXT, CATEGORY_OPTIONS, DISPLAY_ORDER_LIMITS } from '../constants';
import { userService, User as UserType } from '../services/user-service';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/inputs/select';

interface MemberAssignmentModalProps {
  assignment: MemberAssignmentWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignment: CreateMemberAssignmentRequest) => void;
  onDelete?: () => void;
  stages: StageWithPartsAndAssignments[];
}

export const MemberAssignmentModal: React.FC<MemberAssignmentModalProps> = ({ 
  assignment, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  stages
}) => {
  const [formData, setFormData] = useState<CreateMemberAssignmentRequest>({
    user_id: '',
    part_id: '',
    category: 'utai',
    display_order: 0,
  });
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (assignment) {
      setFormData({
        user_id: assignment.user_id,
        part_id: assignment.part_id,
        category: assignment.category,
        display_order: assignment.display_order,
      });
      setSelectedPartId(assignment.part_id);
      // パートから舞台IDを取得
      const stage = stages.find(s => 
        s.parts.some(p => p.id === assignment.part_id)
      );
      if (stage) {
        setSelectedStageId(stage.id);
      }
    }
  }, [assignment, stages]);

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

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStageChange = (stageId: string) => {
    setSelectedStageId(stageId);
    setSelectedPartId('');
    setFormData(prev => ({
      ...prev,
      partId: ''
    }));
  };

  const handlePartChange = (partId: string) => {
    setSelectedPartId(partId);
    setFormData(prev => ({
      ...prev,
      partId
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const selectedStage = stages.find(stage => stage.id === selectedStageId);
  const availableParts = selectedStage?.parts || [];

  const isFormValid = formData.user_id && formData.part_id;

  if (!isOpen || !assignment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {UI_TEXT.ASSIGNMENT_TITLE}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-6 w-6 text-gray-500" />
          </Button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 舞台選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              舞台
            </label>
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

          {/* パート選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UI_TEXT.PART_LABEL}
            </label>
            <Select
              value={selectedPartId}
              onValueChange={handlePartChange}
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

          {/* 謡舞区分 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UI_TEXT.CATEGORY_LABEL}
            </label>
            <div className="flex gap-4">
              {CATEGORY_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    value={option.value}
                    checked={formData.category === option.value}
                    onChange={(e) => handleInputChange('category', e.target.value as 'utai' | 'mai')}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 表示順序 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UI_TEXT.DISPLAY_ORDER_LABEL}
            </label>
            <Input
              type="number"
              min={DISPLAY_ORDER_LIMITS.MIN}
              max={DISPLAY_ORDER_LIMITS.MAX}
              value={formData.display_order || 0}
              onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 0)}
            />
          </div>

          {/* 現在の所属情報表示 */}
          {assignment && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">現在の所属情報</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ユーザー:</span>
                  <span className="font-medium">{assignment.user.name} ({assignment.user.email})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">パート:</span>
                  <span className="font-medium">{assignment.part.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">舞台:</span>
                  <span className="font-medium">{assignment.part.stage.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">謡舞区分:</span>
                  <span className="font-medium">
                    {formData.category === 'utai' ? '謡' : '舞'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">表示順序:</span>
                  <span className="font-medium">{assignment.display_order}</span>
                </div>
              </div>
            </div>
          )}

          {/* ボタン */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-6 py-3 border-2"
              >
                {UI_TEXT.CANCEL}
              </Button>
              {onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  className="px-6 py-3"
                >
                  {UI_TEXT.DELETE}
                </Button>
              )}
            </div>
            <Button
              type="submit"
              disabled={!isFormValid}
              className="px-8 py-3 text-lg"
            >
              {UI_TEXT.UPDATE}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
