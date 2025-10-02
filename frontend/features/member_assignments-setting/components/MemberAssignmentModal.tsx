import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { 
  MemberAssignmentWithDetails, 
  CreateMemberAssignmentRequest, 
  StageWithPartsAndAssignments 
} from '../types';
import { UI_TEXT, CATEGORY_OPTIONS, DISPLAY_ORDER_LIMITS } from '../constants';
import { userService, User as UserType } from '../services/user-service';

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
        console.error('Failed to fetch users:', error);
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
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 舞台選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              舞台
            </label>
            <select
              value={selectedStageId}
              onChange={(e) => handleStageChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          {/* パート選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UI_TEXT.PART_LABEL}
            </label>
            <select
              value={selectedPartId}
              onChange={(e) => handlePartChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <input
              type="number"
              min={DISPLAY_ORDER_LIMITS.MIN}
              max={DISPLAY_ORDER_LIMITS.MAX}
              value={formData.display_order || 0}
              onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-semibold"
              >
                {UI_TEXT.CANCEL}
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  {UI_TEXT.DELETE}
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!isFormValid}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
            >
              {UI_TEXT.UPDATE}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
