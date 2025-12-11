import React, { useState } from 'react';
import { StageData } from '../types';
import { UI_TEXT } from '../constants';
import { Calendar, Theater, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';

interface StageCardProps {
  stage: StageData;
  onClick: () => void;
}

export const StageCard: React.FC<StageCardProps> = ({ stage, onClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_VISIBLE_PARTS = 3;
  const parts = stage.parts || [];
  const hasMoreParts = parts.length > MAX_VISIBLE_PARTS;
  const visibleParts = isExpanded ? parts : parts.slice(0, MAX_VISIBLE_PARTS);

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className="card-blue-hover rounded-2xl p-6 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-3 mb-4">
        <Theater className="h-6 w-6 text-black" />
        <h3 className="text-xl font-semibold text-black">{stage.stageName}</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-black mr-2" />
          <span className="text-black font-medium min-w-[80px]">日付</span>
          <span className="text-black">：</span>
          <span className="text-black ml-2">
            {new Date(stage.date).toLocaleDateString('ja-JP')}
          </span>
        </div>

        <div className="flex items-center">
          <span className="text-black font-medium min-w-[80px]">ステータス</span>
          <span className="text-black">：</span>
          <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold ${
            (stage.status || 'active') === 'active'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-500 text-white'
          }`}>
            {(stage.status || 'active') === 'active' ? 'アクティブ' : '非アクティブ'}
          </span>
        </div>
        
        {stage.description && (
          <div className="flex items-start">
            <span className="text-black font-medium min-w-[80px] pt-1">説明</span>
            <span className="text-black pt-1">：</span>
            <span className="text-black ml-2 flex-1">{stage.description}</span>
          </div>
        )}

        <div className="flex items-start">
          <User className="h-4 w-4 text-black mr-2 mt-1" />
          <span className="text-black font-medium min-w-[80px] pt-1">パート</span>
          <span className="text-black pt-1">：</span>
          <div className="ml-2 flex-1">
            <div className="space-y-1">
              {visibleParts.map((part, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-sm text-black w-8">{index + 1}.</span>
                  <span className="text-black">{part || UI_TEXT.NOT_SET}</span>
                </div>
              ))}

              {hasMoreParts && (
                <Button
                  variant="ghost"
                  onClick={handleExpandClick}
                  className="flex items-center gap-1 text-black hover:text-black text-sm font-medium mt-2 transition-colors h-auto p-0"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      折りたたむ
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      他{parts.length - MAX_VISIBLE_PARTS}件を表示
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
