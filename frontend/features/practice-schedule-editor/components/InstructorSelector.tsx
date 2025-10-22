/**
 * インストラクター選択コンポーネント
 * 学年4かつ出席記録があるユーザーから選択
 */

import React, { useEffect, useState } from 'react';
import { Check, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInstructorCandidates } from '../hooks';
import { InstructorCandidate } from '../services/session-instructor-service';

interface InstructorSelectorProps {
  practiceScheduleId: string;
  selectedInstructors: string[]; // attendance_idの配列
  onSelectionChange: (attendanceIds: string[]) => void;
  className?: string;
  maxSelections?: number;
}

export const InstructorSelector: React.FC<InstructorSelectorProps> = ({
  practiceScheduleId,
  selectedInstructors,
  onSelectionChange,
  className = '',
  maxSelections = 3,
}) => {
  const { candidates, loading, error, fetchCandidates } = useInstructorCandidates();
  const [searchTerm, setSearchTerm] = useState('');

  // 候補を取得
  useEffect(() => {
    if (practiceScheduleId) {
      fetchCandidates(practiceScheduleId);
    }
  }, [practiceScheduleId, fetchCandidates]);

  // 検索フィルタリング
  const filteredCandidates = candidates.filter(candidate => {
    const fullName = `${candidate.last_name_kanji} ${candidate.first_name_kanji}`;
    const searchLower = searchTerm.toLowerCase();
    return (
      fullName.toLowerCase().includes(searchLower) ||
      candidate.student_id.toLowerCase().includes(searchLower) ||
      candidate.email.toLowerCase().includes(searchLower)
    );
  });

  // 選択状態の切り替え
  const toggleSelection = (attendanceId: string) => {
    if (selectedInstructors.includes(attendanceId)) {
      // 選択解除
      onSelectionChange(selectedInstructors.filter(id => id !== attendanceId));
    } else {
      // 選択追加（最大選択数チェック）
      if (selectedInstructors.length < maxSelections) {
        onSelectionChange([...selectedInstructors, attendanceId]);
      }
    }
  };

  // ローディング表示
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-gray-500">インストラクター候補を読み込み中...</span>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className={cn("p-4 text-center", className)}>
        <div className="text-sm text-red-500">
          エラー: {error}
        </div>
      </div>
    );
  }

  // 候補がない場合
  if (candidates.length === 0) {
    return (
      <div className={cn("p-4 text-center", className)}>
        <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
        <div className="text-sm text-gray-500">
          インストラクター候補が見つかりません
        </div>
        <div className="text-xs text-gray-400 mt-1">
          （学年4かつ出席記録があるユーザー）
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* 検索バー */}
      <div className="relative">
        <input
          type="text"
          placeholder="名前、学籍番号、メールで検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 選択状況表示 */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>
          選択中: {selectedInstructors.length}/{maxSelections}
        </span>
        {selectedInstructors.length > 0 && (
          <button
            onClick={() => onSelectionChange([])}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            すべて解除
          </button>
        )}
      </div>

      {/* 候補リスト */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {filteredCandidates.map((candidate) => {
          const isSelected = selectedInstructors.includes(candidate.attendance_id);
          const isDisabled = !isSelected && selectedInstructors.length >= maxSelections;
          
          return (
            <div
              key={candidate.attendance_id}
              className={cn(
                "flex items-center p-3 border rounded-lg cursor-pointer transition-colors",
                isSelected
                  ? "bg-blue-50 border-blue-200"
                  : isDisabled
                  ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-50"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              )}
              onClick={() => !isDisabled && toggleSelection(candidate.attendance_id)}
            >
              {/* チェックボックス */}
              <div className={cn(
                "w-4 h-4 border rounded mr-3 flex items-center justify-center",
                isSelected
                  ? "bg-blue-500 border-blue-500"
                  : "border-gray-300"
              )}>
                {isSelected && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>

              {/* ユーザー情報 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">
                    {candidate.last_name_kanji} {candidate.first_name_kanji}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({candidate.student_id})
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {candidate.email}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-400">
                    学年{candidate.grade}
                  </span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    candidate.attendance_status === 'present'
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  )}>
                    {candidate.attendance_status === 'present' ? '出席' : '遅刻'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 検索結果が0件の場合 */}
      {filteredCandidates.length === 0 && searchTerm && (
        <div className="text-center py-4 text-sm text-gray-500">
          「{searchTerm}」に一致する候補が見つかりません
        </div>
      )}
    </div>
  );
};

InstructorSelector.displayName = 'InstructorSelector';
