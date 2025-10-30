/**
 * インストラクター表示コンポーネント（API呼び出し版）
 * 後方互換性のため残していますが、propsで指導者データを直接渡す方法を推奨します
 */

import React, { useEffect } from 'react';
import { Users } from 'lucide-react';
import { useSlotInstructors } from '../hooks';
import { SessionInstructorWithDetails } from '../services/session-instructor-service';
import { InstructorApiDisplay, InstructorFallbackDisplay } from './InstructorDisplay';

interface InstructorDisplayWithAPIProps {
  scheduleId: string;
  slotOrder: number;
  className?: string;
  fallbackInstructors?: string[];
  showEmail?: boolean;
  maxDisplay?: number;
}

export const InstructorDisplayWithAPI: React.FC<InstructorDisplayWithAPIProps> = ({
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
      <div className={`text-xs text-gray-600 ${className}`}>
        <Users className="h-3 w-3 inline mr-1" />
        読み込み中...
      </div>
    );
  }

  // エラー時はフォールバック表示
  if (error) {
    console.warn('指導者情報の取得に失敗:', error);
    if (process.env.NODE_ENV === 'development') {
      console.error('InstructorDisplayWithAPI API Error:', {
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

  return null;
};

