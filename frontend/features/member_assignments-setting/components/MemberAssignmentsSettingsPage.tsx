'use client';

import React, { useState } from 'react';
import { useStageAssignments } from '../hooks/useStageAssignments';
import { MemberAssignmentsList } from './MemberAssignmentsList';
import { MemberRegistrationModal } from './MemberRegistrationModal';
import { UI_TEXT } from '../constants';

export const MemberAssignmentsSettingsPage: React.FC = () => {
  const { stages, loading, error, refreshStages } = useStageAssignments();
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [selectedPartName, setSelectedPartName] = useState<string>('');
  const [selectedStageName, setSelectedStageName] = useState<string>('');



  const handlePartClick = (partId: string, stageId: string) => {
    // パートと舞台の情報を取得
    const stage = stages.find(s => s.id === stageId);
    const part = stage?.parts.find(p => p.id === partId);
    
    if (stage && part) {
      setSelectedPartId(partId);
      setSelectedStageId(stageId);
      setSelectedPartName(part.name);
      setSelectedStageName(stage.name);
      setIsRegistrationModalOpen(true);
    }
  };


  const handleCloseRegistrationModal = () => {
    setIsRegistrationModalOpen(false);
    setSelectedPartId('');
    setSelectedStageId('');
    setSelectedPartName('');
    setSelectedStageName('');
  };

  const handleRegistrationSuccess = () => {
    refreshStages();
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">{UI_TEXT.LOADING_TEXT}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        エラー: {error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">

      {/* Assignment List */}
      <MemberAssignmentsList 
        stages={stages} 
        onPartClick={handlePartClick}
      />


      {/* Member Registration Modal */}
      <MemberRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={handleCloseRegistrationModal}
        partId={selectedPartId}
        stageId={selectedStageId}
        partName={selectedPartName}
        stageName={selectedStageName}
        onSuccess={handleRegistrationSuccess}
      />
    </div>
  );
};
