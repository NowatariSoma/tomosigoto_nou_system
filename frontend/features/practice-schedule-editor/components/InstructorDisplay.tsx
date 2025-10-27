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
  fallbackInstructors?: string[]; // フォールバック用のインストラクター名配列
  showEmail?: boolean;
  maxDisplay?: number; // 表示する最大指導者数
}

export const InstructorDisplay: React.FC<InstructorDisplayProps> = ({
  scheduleId,
  slotOrder,
  className = '',
  fallbackInstructors = [],
  showEmail = false,
  maxDisplay = 3,
}) => {
  const { instructors, loading, error, fetchData } = useSlotInstructors(scheduleId, slotOrder);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ローディング中の表示
  if (loading) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        <Users className="h-3 w-3 inline mr-1" />
        読み込み中...
      </div>
    );
  }

  // エラー時はフォールバック表示
  if (error) {
    console.warn('指導者情報の取得に失敗:', error);
    // 開発環境でのみ詳細なエラー情報を表示
    if (process.env.NODE_ENV === 'development') {
      console.error('InstructorDisplay API Error:', {
        scheduleId,
        slotOrder,
        error,
        fallbackInstructors
      });
    }
    return (
      <InstructorFallbackDisplay 
        instructors={fallbackInstructors} 
        className={className}
        maxDisplay={maxDisplay}
      />
    );
  }

  // APIから取得した指導者情報がある場合
  if (instructors && instructors.length > 0) {
    return (
      <InstructorApiDisplay 
        instructors={instructors}
        className={className}
        showEmail={showEmail}
        maxDisplay={maxDisplay}
      />
    );
  }

  // APIから取得した指導者情報がない場合はフォールバック表示
  if (fallbackInstructors.length > 0) {
    return (
      <InstructorFallbackDisplay 
        instructors={fallbackInstructors} 
        className={className}
        maxDisplay={maxDisplay}
      />
    );
  }

  // 指導者情報が全くない場合は何も表示しない
  return null;
};

/**
 * APIから取得した指導者情報を表示
 */
const InstructorApiDisplay: React.FC<{
  instructors: SessionInstructorWithDetails[];
  className?: string;
  showEmail?: boolean;
  maxDisplay?: number;
}> = ({ instructors, className, showEmail = false, maxDisplay = 3 }) => {
  // 指導者がいない場合は何も表示しない
  if (!instructors || instructors.length === 0) {
    return null;
  }

  const displayInstructors = instructors.slice(0, maxDisplay);
  const remainingCount = Math.max(0, instructors.length - maxDisplay);

  return (
    <div className={`text-xs text-gray-600 ${className}`}>
      <span className="mr-1">🎭</span>
      {displayInstructors.map((instructor, index) => (
        <span key={instructor.id}>
          <span className="font-medium">
            {instructor.user_name || 
             (instructor.user_email ? instructor.user_email.split('@')[0] : `指導者${instructor.id.slice(-4)}`)}
          </span>
          {showEmail && instructor.user_email && !instructor.user_name && (
            <span className="text-gray-500 ml-1">
              ({instructor.user_email})
            </span>
          )}
          {index < displayInstructors.length - 1 && ', '}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="text-gray-500 ml-1">
          他{remainingCount}名
        </span>
      )}
    </div>
  );
};

/**
 * フォールバック用の指導者情報表示（既存のstring[]形式）
 */
const InstructorFallbackDisplay: React.FC<{
  instructors: string[];
  className?: string;
  maxDisplay?: number;
}> = ({ instructors, className, maxDisplay = 3 }) => {
  // 指導者がいない場合は何も表示しない
  if (!instructors || instructors.length === 0) {
    return null;
  }

  const displayInstructors = instructors.slice(0, maxDisplay);
  const remainingCount = Math.max(0, instructors.length - maxDisplay);

  return (
    <div className={`text-xs text-gray-600 ${className}`}>
      <span className="mr-1">🎭</span>
      {displayInstructors.map((instructor, index) => (
        <span key={index}>
          <span className="font-medium">{instructor}</span>
          {index < displayInstructors.length - 1 && ', '}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="text-gray-500 ml-1">
          他{remainingCount}名
        </span>
      )}
    </div>
  );
};
