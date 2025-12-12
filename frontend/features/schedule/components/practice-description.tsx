'use client';

import React from 'react';

interface PracticeDescriptionProps {
  /**
   * 練習の説明文
   */
  description?: string;
}

/**
 * 練習内容を表示するコンポーネント
 * @param description - 練習の説明文
 */
export const PracticeDescription: React.FC<PracticeDescriptionProps> = ({
  description,
}) => {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        練習内容
      </h2>
      <p className="text-sm text-black whitespace-pre-wrap">
        {description || '練習内容が登録されていません'}
      </p>
    </div>
  );
};

PracticeDescription.displayName = 'PracticeDescription';

