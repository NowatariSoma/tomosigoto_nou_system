import { useState, useCallback } from 'react';
import { memberAssignmentService } from '../services/member-assignment-service';
import { 
  MemberAssignmentWithDetails, 
  CreateMemberAssignmentRequest, 
  UpdateMemberAssignmentRequest 
} from '../types';

interface UseMemberAssignmentState {
  memberAssignment: MemberAssignmentWithDetails | null;
  loading: boolean;
  error: string | null;
}

export const useMemberAssignment = () => {
  const [state, setState] = useState<UseMemberAssignmentState>({
    memberAssignment: null,
    loading: false,
    error: null,
  });

  const fetchMemberAssignment = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const memberAssignment = await memberAssignmentService.getMemberAssignment(id);
      setState({
        memberAssignment,
        loading: false,
        error: null,
      });
      return memberAssignment;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'メンバー所属の取得に失敗しました',
      }));
      throw error;
    }
  }, []);

  const createMemberAssignment = useCallback(async (data: CreateMemberAssignmentRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const newMemberAssignment = await memberAssignmentService.createMemberAssignment(data);
      setState({
        memberAssignment: newMemberAssignment,
        loading: false,
        error: null,
      });
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
      const updatedMemberAssignment = await memberAssignmentService.updateMemberAssignment(id, data);
      setState({
        memberAssignment: updatedMemberAssignment,
        loading: false,
        error: null,
      });
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
      await memberAssignmentService.deleteMemberAssignment(id);
      setState({
        memberAssignment: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'メンバー所属の削除に失敗しました',
      }));
      throw error;
    }
  }, []);

  const clearMemberAssignment = useCallback(() => {
    setState({
      memberAssignment: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    fetchMemberAssignment,
    createMemberAssignment,
    updateMemberAssignment,
    deleteMemberAssignment,
    clearMemberAssignment,
  };
};
