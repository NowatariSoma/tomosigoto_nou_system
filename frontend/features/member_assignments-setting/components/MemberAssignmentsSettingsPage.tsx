'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/forms/button';
import { Plus } from 'lucide-react';
import { useStageAssignments } from '../hooks/useStageAssignments';
import { memberAssignmentService } from '../services/member-assignment-service';
import { MemberAssignmentForm } from './MemberAssignmentForm';
import { MemberAssignmentsList } from './MemberAssignmentsList';
import { MemberAssignmentModal } from './MemberAssignmentModal';
import { CreateMemberAssignmentRequest, MemberAssignmentWithDetails } from '../types';
import { UI_TEXT } from '../constants';

export const MemberAssignmentsSettingsPage: React.FC = () => {
  const { stages, loading, error, refreshStages } = useStageAssignments();
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<MemberAssignmentWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [formData, setFormData] = useState<CreateMemberAssignmentRequest>({
    user_id: '',
    part_id: '',
    category: 'utai',
    display_order: 0,
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await memberAssignmentService.createMemberAssignment(formData);
      
      setFormData({
        user_id: '',
        part_id: '',
        category: 'utai',
        display_order: 0,
      });
      setEditingAssignment(null);
      setShowForm(false);
      
      // データを再取得
      await refreshStages();
    } catch (error) {
      console.error('Failed to save member assignment:', error);
      alert('メンバー所属の作成に失敗しました。');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAssignment(null);
    setFormData({
      user_id: '',
      part_id: '',
      category: 'utai',
      display_order: 0,
    });
  };

  const handleAssignmentClick = (assignment: MemberAssignmentWithDetails) => {
    setEditingAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAssignment(null);
  };

  const handleSaveAssignment = async (data: CreateMemberAssignmentRequest) => {
    try {
      if (editingAssignment) {
        await memberAssignmentService.updateMemberAssignment(editingAssignment.id, data);
      } else {
        await memberAssignmentService.createMemberAssignment(data);
      }
      handleCloseModal();
      
      // データを再取得
      await refreshStages();
    } catch (error) {
      console.error('Failed to save member assignment:', error);
      alert('メンバー所属の保存に失敗しました。');
    }
  };

  const handleDeleteAssignment = async () => {
    if (editingAssignment) {
      try {
        await memberAssignmentService.deleteMemberAssignment(editingAssignment.id);
        handleCloseModal();
        
        // データを再取得
        await refreshStages();
      } catch (error) {
        console.error('Failed to delete member assignment:', error);
        alert('メンバー所属の削除に失敗しました。');
      }
    }
  };

  const isFormValid = Boolean(formData.user_id && formData.part_id);

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
      {/* New Assignment Button */}
      <div className="text-center mb-8">
        <Button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          {UI_TEXT.NEW_ASSIGNMENT}
        </Button>
      </div>

      {/* Assignment Form (新規登録時のみ) */}
      {showForm && !editingAssignment && (
        <MemberAssignmentForm
          formData={formData}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isValid={isFormValid}
          isEditing={false}
          stages={stages}
          selectedStageId={selectedStageId}
          selectedPartId={selectedPartId}
          onStageChange={setSelectedStageId}
          onPartChange={setSelectedPartId}
        />
      )}

      {/* Assignment List */}
      <MemberAssignmentsList 
        stages={stages} 
        onAssignmentClick={handleAssignmentClick}
      />

      {/* Assignment Modal */}
      <MemberAssignmentModal
        assignment={editingAssignment}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveAssignment}
        onDelete={editingAssignment ? handleDeleteAssignment : undefined}
        stages={stages}
      />
    </div>
  );
};
