/**
 * 指導者情報表示コンポーネント
 * session_instructors APIから取得した指導者情報を表示
 */

import * as React from 'react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SessionInstructorWithDetails } from '../types/practice-schedule-types';
import { useSessionInstructors } from '../hooks/use-session-instructors';

interface InstructorDisplayProps {
  scheduleId?: string;
  slotOrder?: number;
  className?: string;
  fallbackInstructors?: string[]; // 既存のstring[]形式の指導者情報（フォールバック用）
  showEmail?: boolean;
  maxDisplay?: number; // 表示する最大指導者数
}

/**
 * 指導者情報を表示するコンポーネント
 *
 * パフォーマンス最適化: fallbackInstructorsが提供されている場合、
 * 追加のAPIコールをスキップしてfallbackデータを直接使用します。
 * これによりN+1問題を回避し、ボトムシートの表示速度を大幅に改善します。
 */
export const InstructorDisplay: React.FC<InstructorDisplayProps> = ({
  scheduleId,
  slotOrder,
  className,
  fallbackInstructors = [],
  showEmail = false,
  maxDisplay = 3,
}) => {
  // fallbackがある場合はAPIコールをスキップ（パフォーマンス最適化）
  // BundleAPIから既に指導者情報が取得されているため、追加のAPIコールは不要
  if (fallbackInstructors.length > 0) {
    return (
      <InstructorFallbackDisplay
        instructors={fallbackInstructors}
        className={className}
        maxDisplay={maxDisplay}
      />
    );
  }

  // fallbackがない場合のみAPIから取得
  return (
    <InstructorDisplayWithFetch
      scheduleId={scheduleId}
      slotOrder={slotOrder}
      className={className}
      showEmail={showEmail}
      maxDisplay={maxDisplay}
    />
  );
};

/**
 * APIから指導者情報を取得して表示するコンポーネント（内部用）
 * fallbackがない場合にのみ使用
 */
const InstructorDisplayWithFetch: React.FC<Omit<InstructorDisplayProps, 'fallbackInstructors'>> = ({
  scheduleId,
  slotOrder,
  className,
  showEmail = false,
  maxDisplay = 3,
}) => {
  const {
    instructors,
    loading,
    error,
    fetchInstructorsForSlot,
    clearInstructors
  } = useSessionInstructors();

  // scheduleIdとslotOrderが変更されたときにデータを取得
  useEffect(() => {
    if (scheduleId && slotOrder !== undefined) {
      fetchInstructorsForSlot(scheduleId, slotOrder);
    } else {
      clearInstructors();
    }
  }, [scheduleId, slotOrder, fetchInstructorsForSlot, clearInstructors]);

  // ローディング中の表示
  if (loading) {
    return (
      <div className={cn("text-xs text-gray-500", className)}>
        🎭 読み込み中...
      </div>
    );
  }

  // エラー時は何も表示しない（fallbackもないため）
  if (error) {
    return null;
  }

  // APIから取得した指導者情報がある場合
  if (instructors.length > 0) {
    return (
      <InstructorApiDisplay
        instructors={instructors}
        className={className}
        showEmail={showEmail}
        maxDisplay={maxDisplay}
      />
    );
  }

  // 指導者情報がない場合は何も表示しない
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
    <div className={cn("text-xs text-gray-600", className)}>
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
    <div className={cn("text-xs text-gray-600", className)}>
      <span className="mr-1">🎭</span>
      {displayInstructors.join(', ')}
      {remainingCount > 0 && (
        <span className="text-gray-500 ml-1">
          他{remainingCount}名
        </span>
      )}
    </div>
  );
};

InstructorDisplay.displayName = 'InstructorDisplay';
