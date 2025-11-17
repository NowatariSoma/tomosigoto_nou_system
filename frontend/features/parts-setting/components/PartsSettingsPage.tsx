'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/forms/button';
import { Plus } from 'lucide-react';
import { useStageParts } from '../hooks/useStageParts';
import { PartsForm } from './PartsForm';
import { PartsList } from './PartsList';
import { StageModal } from './StageModal';
import { CreateStageRequest, StageData } from '../types';
import { UI_TEXT, PART_COUNT_LIMITS } from '../constants';

export const PartsSettingsPage: React.FC = () => {
  const { stages, loading, error, createStage, updateStage, deleteStage } = useStageParts();
  const [showForm, setShowForm] = useState(false);
  const [editingStage, setEditingStage] = useState<StageData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateStageRequest>({
    date: '',
    stageName: '',
    description: '',
    status: 'active',
    parts: Array(PART_COUNT_LIMITS.DEFAULT).fill(''),
    partCount: PART_COUNT_LIMITS.DEFAULT,
  });

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePartCountChange = (newCount: number) => {
    const currentParts = formData.parts;
    const newParts = Array(newCount).fill('').map((_, index) => currentParts[index] || '');
    
    setFormData(prev => ({
      ...prev,
      partCount: newCount,
      parts: newParts
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingStage) {
        // 更新モード
        await updateStage(editingStage.id, formData);
      } else {
        // 作成モード
        await createStage(formData);
      }
      
      setFormData({
        date: '',
        stageName: '',
        description: '',
        status: 'active',
        parts: Array(PART_COUNT_LIMITS.DEFAULT).fill(''),
        partCount: PART_COUNT_LIMITS.DEFAULT,
      });
      setEditingStage(null);
      setShowForm(false);
    } catch (error) {
      // エラーは発生したが、ログは出力しない
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStage(null);
    setFormData({
      date: '',
      stageName: '',
      description: '',
      status: 'active',
      parts: Array(PART_COUNT_LIMITS.DEFAULT).fill(''),
      partCount: PART_COUNT_LIMITS.DEFAULT,
    });
  };

  const handleStageClick = (stage: StageData) => {
    setEditingStage(stage);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStage(null);
  };

  const handleSaveStage = async (data: CreateStageRequest) => {
    try {
      if (editingStage) {
        await updateStage(editingStage.id, data);
      } else {
        await createStage(data);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save stage:', error);
    }
  };

  const handleDeleteStage = async () => {
    if (editingStage) {
      try {
        await deleteStage(editingStage.id);
        handleCloseModal();
      } catch (error) {
        console.error('Failed to delete stage:', error);
      }
    }
  };

  const isFormValid = Boolean(formData.date && formData.stageName && 
                     formData.parts.some(part => part.trim() !== ''));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">読み込み中...</span>
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

      {/* New Registration Button */}
      <div className="text-center mb-8">
        <Button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          {UI_TEXT.NEW_REGISTRATION}
        </Button>
      </div>

      {/* Registration Form (新規登録時のみ) */}
      {showForm && !editingStage && (
        <PartsForm
          formData={formData}
          onInputChange={handleInputChange}
          onPartCountChange={handlePartCountChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isValid={isFormValid}
          isEditing={false}
        />
      )}

      {/* Registration List */}
      <PartsList 
        stages={stages} 
        onStageClick={handleStageClick}
      />

      {/* Stage Modal */}
      <StageModal
        stage={editingStage}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveStage}
        onDelete={editingStage ? handleDeleteStage : undefined}
      />
    </div>
  );
};
