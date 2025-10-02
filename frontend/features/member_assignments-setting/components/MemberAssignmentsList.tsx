import React from 'react';
import { StageWithPartsAndAssignments } from '../types';
import { StageAssignmentsCard } from './StageAssignmentsCard';
import { UI_TEXT } from '../constants';
import { Theater } from 'lucide-react';

interface MemberAssignmentsListProps {
  stages: StageWithPartsAndAssignments[];
  onPartClick: (partId: string, stageId: string) => void;
}

export const MemberAssignmentsList: React.FC<MemberAssignmentsListProps> = ({ 
  stages, 
  onPartClick
}) => {
  // stagesが未定義の場合のフォールバック処理
  const safeStages = stages || [];
  
  if (safeStages.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-gray-500">
          <Theater className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">{UI_TEXT.NO_ASSIGNMENTS}</p>
          <p className="text-gray-500">{UI_TEXT.START_MESSAGE}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
        {safeStages.map((stage) => (
          <StageAssignmentsCard 
            key={stage.id} 
            stage={stage} 
            onPartClick={onPartClick}
          />
        ))}
      </div>
    </div>
  );
};
