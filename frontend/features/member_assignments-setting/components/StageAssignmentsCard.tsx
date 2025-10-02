import React, { useState } from 'react';
import { StageWithPartsAndAssignments } from '../types';
import { UI_TEXT } from '../constants';
import { Theater, ChevronDown, ChevronUp } from 'lucide-react';

interface StageAssignmentsCardProps {
  stage: StageWithPartsAndAssignments;
  onPartClick: (partId: string, stageId: string) => void;
}

export const StageAssignmentsCard: React.FC<StageAssignmentsCardProps> = ({ 
  stage, 
  onPartClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_VISIBLE_PARTS = 3;
  const parts = stage.parts || [];
  const hasMoreParts = parts.length > MAX_VISIBLE_PARTS;
  const visibleParts = isExpanded ? parts : parts.slice(0, MAX_VISIBLE_PARTS);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };


  const handlePartClick = (partId: string) => {
    onPartClick(partId, stage.id);
  };


  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-4 border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <Theater className="h-6 w-6 text-blue-600" />
        <h3 className="text-2xl font-bold text-gray-800">{stage.name}</h3>
      </div>
      
      <div className="text-sm">
        <span className="text-gray-600 font-medium">パート:</span>
        <div className="mt-1">
          <div className="grid grid-cols-1 gap-1">
              {visibleParts.map((part) => (
                <div key={part.id} className="bg-white rounded p-2 border border-blue-200">
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-blue-50 rounded p-3 -m-1 transition-colors"
                    onClick={() => handlePartClick(part.id)}
                  >
                    <h4 className="font-bold text-blue-900 text-lg">{part.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {part.member_assignments.length}名
                      </span>
                      <span className="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
                        メンバー追加
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
            {hasMoreParts && (
              <button
                onClick={handleExpandClick}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    折りたたむ
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    他{parts.length - MAX_VISIBLE_PARTS}件のパートを表示
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
