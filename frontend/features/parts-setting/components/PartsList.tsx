import React from 'react';
import { StageData } from '../types';
import { StageCard } from './StageCard';
import { UI_TEXT } from '../constants';
import { Theater } from 'lucide-react';

interface PartsListProps {
  stages: StageData[];
  onStageClick: (stage: StageData) => void;
}

export const PartsList: React.FC<PartsListProps> = ({ stages, onStageClick }) => {
  // stagesが未定義の場合のフォールバック処理
  const safeStages = stages || [];
  
  if (safeStages.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-gray-500">
          <Theater className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">{UI_TEXT.NO_STAGES}</p>
          <p className="text-gray-500">{UI_TEXT.START_MESSAGE}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
        {safeStages.map((stage) => (
          <StageCard key={stage.id} stage={stage} onClick={() => onStageClick(stage)} />
        ))}
      </div>
    </div>
  );
};
