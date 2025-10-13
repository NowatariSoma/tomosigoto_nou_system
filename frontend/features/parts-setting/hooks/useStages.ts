import { useState, useCallback, useEffect } from 'react';
import { stagesService, StageData, CreateStageRequest, UpdateStageRequest } from '../services/stages-service';

interface UseStagesState {
  stages: StageData[];
  loading: boolean;
  error: string | null;
}

export const useStages = () => {
  const [state, setState] = useState<UseStagesState>({
    stages: [],
    loading: false,
    error: null,
  });

  const fetchStages = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const stages = await stagesService.getStages();
      setState({
        stages,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '舞台の取得に失敗しました',
      }));
    }
  }, []);

  const getStage = useCallback((id: string) => {
    return state.stages.find((stage) => stage.id === id);
  }, [state.stages]);

  const createStage = useCallback(async (data: CreateStageRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const newStage = await stagesService.createStage(data);
      setState((prev) => ({
        ...prev,
        stages: [newStage, ...prev.stages],
        loading: false,
        error: null,
      }));
      return newStage;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '舞台の作成に失敗しました',
      }));
      throw error;
    }
  }, []);

  const updateStage = useCallback(async (id: string, data: UpdateStageRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const updatedStage = await stagesService.updateStage(id, data);
      setState((prev) => ({
        ...prev,
        stages: prev.stages.map((stage) =>
          stage.id === id ? updatedStage : stage
        ),
        loading: false,
        error: null,
      }));
      return updatedStage;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '舞台の更新に失敗しました',
      }));
      throw error;
    }
  }, []);

  const deleteStage = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await stagesService.deleteStage(id);
      setState((prev) => ({
        ...prev,
        stages: prev.stages.filter((stage) => stage.id !== id),
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '舞台の削除に失敗しました',
      }));
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  return {
    ...state,
    fetchStages,
    getStage,
    createStage,
    updateStage,
    deleteStage,
  };
};
