'use client';

import { useMemo } from 'react';
import { Edit, Save, X, AlertCircle, Loader2 } from 'lucide-react';
import { useMemberManagement } from '../hooks/useMemberManagement';
import { useMemberFilter } from '../hooks/useMemberFilter';
import { useMemberDraftEdit } from '../hooks/useMemberDraftEdit';
import { MemberSummaryCards } from './MemberSummaryCards';
import { MemberFilterBar } from './MemberFilterBar';
import { MemberTable } from './MemberTable';
import { MemberCardList } from './MemberCardList';
import { Button } from '@/components/ui/forms/button';

export function MemberManagementPage() {
  const {
    members,
    isLoading,
    error,
    adminCount,
    handleRoleChange,
    handleInstructorFlagChange,
  } = useMemberManagement();

  const {
    roleFilter,
    setRoleFilter,
    instructorFilter,
    setInstructorFilter,
    searchQuery,
    setSearchQuery,
    filteredMembers,
  } = useMemberFilter(members);

  const {
    isEditMode,
    isSaving,
    saveError,
    pendingChangeCount,
    resolveDraftRole,
    resolveDraftInstructor,
    updateDraft,
    handleEnterEditMode,
    handleCancelEdit,
    handleSaveChanges,
  } = useMemberDraftEdit(members, handleRoleChange, handleInstructorFlagChange);

  const totalMembers = members.length;
  const viewerCount = useMemo(() => members.filter(m => m.role === 'viewer').length, [members]);
  const instructorCount = useMemo(() => members.filter(m => m.is_instructor).length, [members]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        {isEditMode ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={handleSaveChanges}
              disabled={pendingChangeCount === 0 || isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? '保存中...' : `変更を保存${pendingChangeCount ? ` (${pendingChangeCount})` : ''}`}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            onClick={handleEnterEditMode}
            disabled={isLoading || members.length === 0}
            className="gap-2 btn-add"
          >
            <Edit className="h-4 w-4" />
            編集モード
          </Button>
        )}
      </div>

      <MemberSummaryCards
        totalMembers={totalMembers}
        adminCount={adminCount}
        instructorCount={instructorCount}
        viewerCount={viewerCount}
      />

      <MemberFilterBar
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        instructorFilter={instructorFilter}
        setInstructorFilter={setInstructorFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2 p-4 rounded-md border border-amber-200 bg-amber-50 text-amber-800 text-sm">
          <AlertCircle className="h-4 w-4" />
          {saveError}
        </div>
      )}

      <div className="card-blue">
        <MemberTable
          members={filteredMembers}
          isLoading={isLoading}
          isEditMode={isEditMode}
          resolveDraftRole={resolveDraftRole}
          resolveDraftInstructor={resolveDraftInstructor}
          updateDraft={updateDraft}
        />
        <MemberCardList
          members={filteredMembers}
          isLoading={isLoading}
          isEditMode={isEditMode}
          resolveDraftRole={resolveDraftRole}
          resolveDraftInstructor={resolveDraftInstructor}
          updateDraft={updateDraft}
        />
      </div>
    </div>
  );
}
