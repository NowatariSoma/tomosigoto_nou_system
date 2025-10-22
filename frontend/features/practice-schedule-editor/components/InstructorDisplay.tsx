/**
 * インストラクター表示コンポーネント
 */

import React, { useEffect } from 'react';
import { Users } from 'lucide-react';
import { useSlotInstructors } from '../hooks';
import { SessionInstructorWithDetails } from '../services/session-instructor-service';

interface InstructorDisplayProps {
  scheduleId: string;
  slotOrder: number;
  className?: string;
}

export const InstructorDisplay: React.FC<InstructorDisplayProps> = ({
  scheduleId,
  slotOrder,
  className = '',
}) => {
  const { instructors, loading, error, fetchData } = useSlotInstructors(scheduleId, slotOrder);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        <Users className="h-3 w-3 inline mr-1" />
        読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-xs text-red-500 ${className}`}>
        <Users className="h-3 w-3 inline mr-1" />
        エラー
      </div>
    );
  }

  // 指導者がいない場合は何も表示しない
  if (!instructors || instructors.length === 0) {
    return null;
  }

  return (
    <div className={`text-xs text-blue-600 ${className}`}>
      <Users className="h-3 w-3 inline mr-1" />
      {instructors.length === 1 ? (
        <span>{instructors[0].user_name || '名前未設定'}</span>
      ) : (
        <span>{instructors.length}名</span>
      )}
    </div>
  );
};
