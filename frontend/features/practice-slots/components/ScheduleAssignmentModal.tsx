import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Minus } from 'lucide-react';
import { Group, Part, ScheduleAssignmentWithDetails, ScheduleAssignmentCreate, ScheduleAssignmentUpdate } from '@/features/practice-slots/types';
import { scheduleAssignmentsAPI } from '@/lib/api/schedule-assignments';

interface ScheduleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  timeSlot: string;
  groupId: string;
  groupName: string;
  groupColor: string;
  practiceSlotId: string;
  availableParts: Part[];
  existingAssignments?: ScheduleAssignmentWithDetails[];
}

export const ScheduleAssignmentModal: React.FC<ScheduleAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  timeSlot,
  groupId,
  groupName,
  groupColor,
  practiceSlotId,
  availableParts,
  existingAssignments = []
}) => {
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingAssignments && existingAssignments.length > 0) {
      setSelectedPartIds(existingAssignments.map(a => a.part_id));
      setNotes(existingAssignments[0].notes || '');
    } else {
      setSelectedPartIds([]);
      setNotes('');
    }
    setError(null);
  }, [existingAssignments, isOpen]);

  const handleAddPart = () => {
    if (selectedPartIds.length < availableParts.length) {
      setSelectedPartIds([...selectedPartIds, '']);
    }
  };

  const handleRemovePart = (index: number) => {
    setSelectedPartIds(selectedPartIds.filter((_, i) => i !== index));
  };

  const handlePartChange = (index: number, partId: string) => {
    const newPartIds = [...selectedPartIds];
    newPartIds[index] = partId;
    setSelectedPartIds(newPartIds);
  };

  const handleSave = async () => {
    if (selectedPartIds.length === 0 || selectedPartIds.some(id => !id)) {
      setError('すべてのパートを選択してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // デバッグ用ログ: 送信するデータを確認
      console.log('Creating assignment with data:', {
        practice_slot_id: practiceSlotId,
        time_slot: timeSlot,
        group_id: groupId,
        selectedPartIds: selectedPartIds
      });

      // 既存の割り当てをすべて削除
      for (const assignment of existingAssignments) {
        await scheduleAssignmentsAPI.deleteAssignment(assignment.id);
      }

      // 新しい割り当てを作成
      for (let i = 0; i < selectedPartIds.length; i++) {
        const createData: ScheduleAssignmentCreate = {
          practice_slot_id: practiceSlotId,
          time_slot: timeSlot,
          group_id: groupId,
          part_id: selectedPartIds[i],
          notes: i === 0 ? notes : undefined, // 最初のパートにのみ備考を設定
          is_active: true,
          sort_order: i,
        };

        console.log('Sending create data:', createData);

        const response = await scheduleAssignmentsAPI.createAssignment(createData);
        if (!response.success) {
          console.error('API Error:', response.error);
          setError(response.error || '保存に失敗しました');
          return;
        }
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving assignments:', err);
      setError('保存中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (existingAssignments.length === 0) return;

    if (!confirm('この割り当てを削除しますか？')) return;

    setIsLoading(true);
    setError(null);

    try {
      for (const assignment of existingAssignments) {
        const response = await scheduleAssignmentsAPI.deleteAssignment(assignment.id);
        if (!response.success) {
          setError(response.error || '削除に失敗しました');
          return;
        }
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Error deleting assignments:', err);
      setError('削除中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            パート割り当て編集
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* 時間とグループ情報 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: groupColor }}
              ></div>
              <div>
                <p className="font-medium text-gray-900">{timeSlot} - {groupName}</p>
                <p className="text-sm text-gray-600">グループ</p>
              </div>
            </div>
          </div>

          {/* パート選択 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                パート *
              </label>
              <button
                type="button"
                onClick={handleAddPart}
                disabled={selectedPartIds.length >= availableParts.length}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>パート追加</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {selectedPartIds.map((partId, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <select
                    value={partId}
                    onChange={(e) => handlePartChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  >
                    <option value="">パートを選択してください</option>
                    {availableParts.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.display_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemovePart(index)}
                    disabled={isLoading}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 備考 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              備考
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="備考を入力してください（任意）"
              disabled={isLoading}
            />
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* ボタン */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div>
            {existingAssignments.length > 0 && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>削除</span>
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || selectedPartIds.length === 0 || selectedPartIds.some(id => !id)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? '保存中...' : '保存'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};