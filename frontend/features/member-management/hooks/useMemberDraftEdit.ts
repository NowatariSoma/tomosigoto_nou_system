import { useCallback, useState } from 'react';
import { MemberSummary } from '@/features/member-management/types';
import { DraftChange } from '@/features/member-management/constants';

export function useMemberDraftEdit(
  members: MemberSummary[],
  handleRoleChange: (memberId: string, newRole: MemberSummary['role']) => Promise<void>,
  handleInstructorFlagChange: (memberId: string, isInstructor: boolean) => Promise<void>,
) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftChanges, setDraftChanges] = useState<Record<string, DraftChange>>({});

  const pendingChangeCount = Object.keys(draftChanges).length;

  const resolveDraftRole = useCallback((member: MemberSummary) => {
    return draftChanges[member.id]?.role ?? member.role;
  }, [draftChanges]);

  const resolveDraftInstructor = useCallback((member: MemberSummary) => {
    return draftChanges[member.id]?.is_instructor ?? member.is_instructor;
  }, [draftChanges]);

  const updateDraft = useCallback((memberId: string, updates: DraftChange) => {
    setDraftChanges(prev => {
      const target = members.find(member => member.id === memberId);
      if (!target) {
        return prev;
      }

      const merged = { ...prev[memberId], ...updates };
      const nextRole = merged.role ?? target.role;
      const nextInstructor = merged.is_instructor ?? target.is_instructor;

      const roleChanged = nextRole !== target.role;
      const instructorChanged = nextInstructor !== target.is_instructor;

      if (!roleChanged && !instructorChanged) {
        if (!(memberId in prev)) {
          return prev;
        }
        const { [memberId]: _, ...rest } = prev;
        return rest;
      }

      const normalized: DraftChange = {};
      if (roleChanged) {
        normalized.role = nextRole;
      }
      if (instructorChanged) {
        normalized.is_instructor = nextInstructor;
      }

      return {
        ...prev,
        [memberId]: normalized,
      };
    });
  }, [members]);

  const handleEnterEditMode = useCallback(() => {
    setSaveError(null);
    setIsEditMode(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (pendingChangeCount > 0 && !confirm('保存されていない変更があります。キャンセルしますか？')) {
      return;
    }
    setDraftChanges({});
    setSaveError(null);
    setIsEditMode(false);
  }, [pendingChangeCount]);

  const handleSaveChanges = useCallback(async () => {
    if (pendingChangeCount === 0) {
      setIsEditMode(false);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      for (const [memberId, changes] of Object.entries(draftChanges)) {
        if (changes.role !== undefined) {
          await handleRoleChange(memberId, changes.role);
        }
        if (changes.is_instructor !== undefined) {
          await handleInstructorFlagChange(memberId, changes.is_instructor);
        }
      }

      setDraftChanges({});
      setIsEditMode(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : '変更の保存に失敗しました';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }, [draftChanges, handleInstructorFlagChange, handleRoleChange, pendingChangeCount]);

  return {
    isEditMode,
    isSaving,
    saveError,
    draftChanges,
    pendingChangeCount,
    resolveDraftRole,
    resolveDraftInstructor,
    updateDraft,
    handleEnterEditMode,
    handleCancelEdit,
    handleSaveChanges,
  };
}
