'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/forms/button';
import { Plus } from 'lucide-react';
import { useStageParts } from '../hooks/useStageParts';
import { PartsForm } from './PartsForm';
import { PartsList } from './PartsList';
import { CreateStageRequest, StageData } from '../types';
import { UI_TEXT, PART_COUNT_LIMITS } from '../constants';

export const PartsSettingsPage: React.FC = () => {
  const { stages, loading, error, createStage, updateStage, deleteStage } = useStageParts();
  const [showForm, setShowForm] = useState(false);
  const [editingStage, setEditingStage] = useState<StageData | null>(null);
  const [formData, setFormData] = useState<CreateStageRequest>({
    date: '',
    stageName: '',
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
        parts: Array(PART_COUNT_LIMITS.DEFAULT).fill(''),
        partCount: PART_COUNT_LIMITS.DEFAULT,
      });
      setEditingStage(null);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to save stage:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStage(null);
    setFormData({
      date: '',
      stageName: '',
      parts: Array(PART_COUNT_LIMITS.DEFAULT).fill(''),
      partCount: PART_COUNT_LIMITS.DEFAULT,
    });
  };

  const handleStageClick = (stage: StageData) => {
    setEditingStage(stage);
    setFormData({
      date: stage.date,
      stageName: stage.stageName,
      parts: [...(stage.parts || [])],
      partCount: stage.partCount || PART_COUNT_LIMITS.DEFAULT,
    });
    setShowForm(true);
  };

  const handleDeleteStage = async (stageId: string) => {
    try {
      await deleteStage(stageId);
    } catch (error) {
      console.error('Failed to delete stage:', error);
    }
  };

  const isFormValid = formData.date && formData.stageName && 
                     formData.parts.some(part => part.trim() !== '');

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

      {/* Registration Form */}
      {showForm && (
        <PartsForm
          formData={formData}
          onInputChange={handleInputChange}
          onPartCountChange={handlePartCountChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDelete={editingStage ? () => handleDeleteStage(editingStage.id) : undefined}
          isValid={isFormValid}
          isEditing={!!editingStage}
        />
      )}

      {/* Registration List */}
      <PartsList 
        stages={stages} 
        onStageClick={handleStageClick}
      />
    </div>
  );
};
