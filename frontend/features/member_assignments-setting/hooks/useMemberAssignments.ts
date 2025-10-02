import { useState, useCallback, useEffect } from 'react';
import { memberAssignmentsService } from '../services/member-assignments-service';
import { 
  MemberAssignmentData, 
  CreateMemberAssignmentRequest, 
  UpdateMemberAssignmentRequest 
} from '../types';

interface UseMemberAssignmentsState {
  memberAssignments: MemberAssignmentData[];
  loading: boolean;
  error: string | null;
}

export const useMemberAssignments = () => {
  const [state, setState] = useState<UseMemberAssignmentsState>({
    memberAssignments: [],
    loading: false,
    error: null,
  });

  const fetchMemberAssignments = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const memberAssignments = await memberAssignmentsService.getMemberAssignments();
      setState({
        memberAssignments,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'メンバー所属の取得に失敗しました',
      }));
    }
  }, []);

  const getMemberAssignment = useCallback((id: string) => {
    return state.memberAssignments.find((assignment) => assignment.id === id);
  }, [state.memberAssignments]);

  const createMemberAssignment = useCallback(async (data: CreateMemberAssignmentRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const newMemberAssignment = await memberAssignmentsService.createMemberAssignment(data);
      setState((prev) => ({
        ...prev,
        memberAssignments: [newMemberAssignment, ...prev.memberAssignments],
        loading: false,
        error: null,
      }));
      return newMemberAssignment;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'メンバー所属の作成に失敗しました',
      }));
      throw error;
    }
  }, []);

  const updateMemberAssignment = useCallback(async (id: string, data: UpdateMemberAssignmentRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const updatedMemberAssignment = await memberAssignmentsService.updateMemberAssignment(id, data);
      setState((prev) => ({
        ...prev,
        memberAssignments: prev.memberAssignments.map((assignment) =>
          assignment.id === id ? updatedMemberAssignment : assignment
        ),
        loading: false,
        error: null,
      }));
      return updatedMemberAssignment;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'メンバー所属の更新に失敗しました',
      }));
      throw error;
    }
  }, []);

  const deleteMemberAssignment = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await memberAssignmentsService.deleteMemberAssignment(id);
      setState((prev) => ({
        ...prev,
        memberAssignments: prev.memberAssignments.filter((assignment) => assignment.id !== id),
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'メンバー所属の削除に失敗しました',
      }));
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchMemberAssignments();
  }, [fetchMemberAssignments]);

  return {
    ...state,
    fetchMemberAssignments,
    getMemberAssignment,
    createMemberAssignment,
    updateMemberAssignment,
    deleteMemberAssignment,
  };
};
