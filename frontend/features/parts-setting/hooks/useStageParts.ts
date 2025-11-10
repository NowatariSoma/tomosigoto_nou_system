import { useState, useCallback, useEffect } from 'react';
import { StageData, CreateStageRequest, UpdateStageRequest } from '../types';
import { partsService, CreatePartRequest } from '../services/parts-service';
import { stagesService } from '../services/stages-service';

// 統合された型定義（フロントエンド用）
export interface StageWithParts extends StageData {
  parts: string[];
  partCount: number;
}

interface UseStagePartsState {
  stages: StageWithParts[];
  loading: boolean;
  error: string | null;
}

export const useStageParts = () => {
  const [state, setState] = useState<UseStagePartsState>({
    stages: [],
    loading: true,
    error: null,
  });


  // 舞台とパートを統合して取得
  const fetchStagesWithParts = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      console.log('fetchStagesWithParts: Starting...');
      
      // 舞台を取得
      const stages = await stagesService.getStages();
      console.log('fetchStagesWithParts: Fetched stages:', stages);

      // 各舞台のパートを取得
      const stagesWithParts: StageWithParts[] = [];
      
      for (const stage of stages) {
        try {
          const parts = await partsService.getPartsByStageId(stage.id);
          const partNames = parts.map(part => part.name);
          
          stagesWithParts.push({
            id: stage.id,
            date: stage.performanceDate || '',
            stageName: stage.name,
            description: stage.description,
            status: stage.status,
            parts: partNames,
            partCount: partNames.length,
          });
        } catch (error) {
          // パート取得に失敗した場合は空の配列で続行
          stagesWithParts.push({
            id: stage.id,
            date: stage.performanceDate || '',
            stageName: stage.name,
            description: stage.description,
            status: stage.status,
            parts: [],
            partCount: 0,
          });
        }
      }

      console.log('fetchStagesWithParts: Final stages with parts:', stagesWithParts);
      
      setState({
        stages: stagesWithParts,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '舞台・パートの取得に失敗しました',
      }));
    }
  }, []);

  const getStage = useCallback((id: string) => {
    return state.stages.find((stage) => stage.id === id);
  }, [state.stages]);

  const createStage = useCallback(async (data: CreateStageRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // 1. 舞台を作成
      const newStage = await stagesService.createStage({
        name: data.stageName,
        description: data.description,
        performanceDate: data.date,
        status: data.status,
      });

      // 2. パートを作成
      if (data.parts && data.parts.length > 0) {
        const partsData: CreatePartRequest[] = data.parts.map(partName => ({
          stageId: newStage.id,
          name: partName,
        }));
        await partsService.createParts(partsData);
      }

      // 3. 統合データを再取得
      await fetchStagesWithParts();
      
      return {
        id: newStage.id,
        date: newStage.performanceDate || '',
        stageName: newStage.name,
        description: newStage.description,
        parts: data.parts || [],
        partCount: data.parts?.length || 0,
      };
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '舞台の作成に失敗しました',
      }));
      throw error;
    }
  }, [fetchStagesWithParts]);

  const updateStage = useCallback(async (id: string, data: UpdateStageRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      console.log('updateStage called with:', { id, data });
      
      // 1. 舞台を更新
      const updatedStage = await stagesService.updateStage(id, {
        name: data.stageName,
        description: data.description,
        performanceDate: data.date,
        status: data.status,
      });
      
      console.log('Stage updated, result:', updatedStage);

      // 2. パートのステータスを舞台のステータスに合わせて更新
      await partsService.updatePartsStatusByStageId(id, data.status || 'active');

      // 3. パートを更新（既存を削除して新しく作成）
      if (data.parts && data.parts.length > 0) {
        // 既存のパートを削除
        await partsService.deletePartsByStageId(id);
        
        // 新しいパートを作成
        const partsData: CreatePartRequest[] = data.parts.map(partName => ({
          stageId: id,
          name: partName,
        }));
        await partsService.createParts(partsData);
      }

      // 4. 統合データを再取得
      console.log('Refetching stages after update...');
      await fetchStagesWithParts();
      console.log('Stages refetched');
      
      return {
        id: updatedStage.id,
        date: updatedStage.performanceDate || '',
        stageName: updatedStage.name,
        description: updatedStage.description,
        status: updatedStage.status,
        parts: data.parts || [],
        partCount: data.parts?.length || 0,
      };
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '舞台の更新に失敗しました',
      }));
      throw error;
    }
  }, [fetchStagesWithParts]);

  const deleteStage = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // 舞台を削除（CASCADEでパートも削除される）
      await stagesService.deleteStage(id);
      
      // 統合データを再取得
      await fetchStagesWithParts();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '舞台の削除に失敗しました',
      }));
      throw error;
    }
  }, [fetchStagesWithParts]);

  useEffect(() => {
    fetchStagesWithParts();
  }, [fetchStagesWithParts]);

  return {
    ...state,
    fetchStages: fetchStagesWithParts,
    getStage,
    createStage,
    updateStage,
    deleteStage,
  };
};
