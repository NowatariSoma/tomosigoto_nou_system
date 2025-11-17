import { useState, useCallback, useEffect } from 'react';
import { partAssignmentsService } from '../services/part-assignments-service';
import { 
  StageWithPartsAndAssignments, 
  MemberAssignmentWithDetails 
} from '../types';

interface UseStageAssignmentsState {
  stages: StageWithPartsAndAssignments[];
  loading: boolean;
  error: string | null;
}

export const useStageAssignments = () => {
  const [state, setState] = useState<UseStageAssignmentsState>({
    stages: [],
    loading: true,
    error: null,
  });

  const fetchStagesWithAssignments = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const stages = await partAssignmentsService.getStagesWithPartsAndAssignments();
      setState({
        stages,
        loading: false,
        error: null,
      });
      return stages;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '舞台所属の取得に失敗しました',
      }));
      throw error;
    }
  }, []);

  const refreshStages = useCallback(async () => {
    return await fetchStagesWithAssignments();
  }, [fetchStagesWithAssignments]);

  const fetchAssignmentsByStage = useCallback(async (stageId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const assignments = await partAssignmentsService.getAssignmentsByStage(stageId);
      return assignments;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '舞台所属の取得に失敗しました',
      }));
      throw error;
    }
  }, []);

  const getStage = useCallback((id: string) => {
    return state.stages.find((stage) => stage.id === id);
  }, [state.stages]);

  const getPart = useCallback((stageId: string, partId: string) => {
    const stage = getStage(stageId);
    return stage?.parts.find((part) => part.id === partId);
  }, [getStage]);

  useEffect(() => {
    console.log('[DEBUG] useStageAssignments: useEffect triggered');
    fetchStagesWithAssignments();
  }, []); // 空の依存配列に変更して初回のみ実行

  return {
    ...state,
    fetchStagesWithAssignments,
    refreshStages,
    fetchAssignmentsByStage,
    getStage,
    getPart,
  };
};
