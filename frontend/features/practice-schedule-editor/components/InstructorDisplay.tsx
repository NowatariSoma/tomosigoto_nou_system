/**
 * インストラクター表示コンポーネント
 */

import React from 'react';
import { SessionInstructorWithDetails } from '../services/session-instructor-service';

interface InstructorDisplayProps {
  scheduleId?: string;
  slotOrder?: number;
  instructors?: SessionInstructorWithDetails[]; // 直接指導者データを渡す場合はこちらを使用
  className?: string;
  fallbackInstructors?: string[]; // フォールバック用のインストラクター名配列
  showEmail?: boolean;
  maxDisplay?: number; // 表示する最大指導者数
}

export const InstructorDisplay: React.FC<InstructorDisplayProps> = ({
  scheduleId,
  slotOrder,
  instructors: providedInstructors,
  className = '',
  fallbackInstructors = [],
  showEmail = false,
  maxDisplay = 3,
}) => {
  // propsで指導者データが直接渡されている場合はそれを使用（API呼び出しなし）
  const instructors = providedInstructors || [];

  // propsで指導者データが直接渡されている場合（推奨）
  if (providedInstructors !== undefined) {
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
    // フォールバック表示
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
  }

  // scheduleIdとslotOrderが指定されている場合はAPI呼び出し（後方互換性のため）
  // ただし、この方法は非推奨（パフォーマンスの問題があるため）
  if (scheduleId && slotOrder !== undefined) {
    // 動的インポートでuseSlotInstructorsを使用（条件付きフック呼び出しを避けるため）
    const DynamicInstructorDisplay = React.lazy(() => 
      import('./InstructorDisplayWithAPI').then(module => ({ default: module.InstructorDisplayWithAPI }))
    );
    return (
      <React.Suspense fallback={<div className={className}>読み込み中...</div>}>
        <DynamicInstructorDisplay
          scheduleId={scheduleId}
          slotOrder={slotOrder}
          className={className}
          fallbackInstructors={fallbackInstructors}
          showEmail={showEmail}
          maxDisplay={maxDisplay}
        />
      </React.Suspense>
    );
  }

  return null;
};

/**
 * APIから取得した指導者情報を表示
 */
export const InstructorApiDisplay: React.FC<{
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
    <div className={`text-xs text-gray-800 ${className}`}>
      <span className="mr-1">🎭</span>
      {displayInstructors.map((instructor, index) => (
        <span key={instructor.id}>
          <span className="font-semibold">
            {instructor.user_name || 
             (instructor.user_email ? instructor.user_email.split('@')[0] : `指導者${instructor.id.slice(-4)}`)}
          </span>
          {showEmail && instructor.user_email && !instructor.user_name && (
            <span className="text-gray-700 ml-1">
              ({instructor.user_email})
            </span>
          )}
          {index < displayInstructors.length - 1 && ', '}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="text-gray-700 ml-1">
          他{remainingCount}名
        </span>
      )}
    </div>
  );
};

/**
 * フォールバック用の指導者情報表示（既存のstring[]形式）
 */
export const InstructorFallbackDisplay: React.FC<{
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
    <div className={`text-xs text-gray-800 ${className}`}>
      <span className="mr-1">🎭</span>
      {displayInstructors.map((instructor, index) => (
        <span key={index}>
          <span className="font-semibold">{instructor}</span>
          {index < displayInstructors.length - 1 && ', '}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="text-gray-700 ml-1">
          他{remainingCount}名
        </span>
      )}
    </div>
  );
};
