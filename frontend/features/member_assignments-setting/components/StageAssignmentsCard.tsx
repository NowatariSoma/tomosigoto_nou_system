import React, { useState } from 'react';
import { StageWithPartsAndAssignments } from '../types';
import { UI_TEXT } from '../constants';
import { Theater, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';

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
    <div className="card-blue-hover p-4">
      <div className="flex items-center gap-3 mb-4">
        <Theater className="h-6 w-6 text-black" />
        <h3 className="text-2xl font-bold text-black">{stage.name}</h3>
      </div>

      <div className="text-sm">
        <span className="text-black font-medium">パート:</span>
        <div className="mt-1">
          <div className="grid grid-cols-1 gap-1">
              {visibleParts.map((part) => (
                <div key={part.id} className="bg-white rounded p-2 border border-blue-200">
                  <div 
                    className="flex items-center justify-between cursor-pointer hover-subtle rounded p-3 -m-1"
                    onClick={() => handlePartClick(part.id)}
                  >
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-black text-lg">{part.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-black">
                        <span>舞: {part.member_assignments.filter(ma => ma.category === 'mai').length}人</span>
                        <span>謡: {part.member_assignments.filter(ma => ma.category === 'utai').length}人</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm bg-blue-100 text-black px-3 py-1 rounded-full">
                        メンバー編集
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
            {hasMoreParts && (
              <Button
                variant="ghost"
                onClick={handleExpandClick}
                className="flex items-center gap-1 text-black text-sm font-medium mt-2 h-auto p-0"
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
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
