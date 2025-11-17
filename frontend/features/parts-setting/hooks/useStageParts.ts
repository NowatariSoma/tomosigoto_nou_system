import { useState, useCallback, useEffect, useRef } from 'react';
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

  // デバッグ用：実行回数をカウント
  const fetchCountRef = useRef(0);
  const isMountedRef = useRef(true);

  // 舞台とパートを並列で取得する最適化版
  const fetchStagesWithParts = useCallback(async () => {
    fetchCountRef.current += 1;
    console.log(`[DEBUG] fetchStagesWithParts called: ${fetchCountRef.current} times`);

    if (!isMountedRef.current) {
      console.log('[DEBUG] Component is unmounted, skipping fetch');
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      console.log('[DEBUG] Starting to fetch stages...');

      // 舞台を取得
      const stages = await stagesService.getStages();
      console.log(`[DEBUG] Fetched ${stages.length} stages`);

      if (!isMountedRef.current) return;

      // すべての舞台のパートを並列で取得
      console.log('[DEBUG] Starting to fetch parts for all stages...');
      const partsPromises = stages.map(stage =>
        partsService.getPartsByStageId(stage.id)
          .catch(error => {
            console.error(`[DEBUG] Failed to fetch parts for stage ${stage.id}:`, error);
            return []; // エラーの場合は空配列を返す
          })
      );

      // すべてのパート取得を並列で待つ
      const allParts = await Promise.all(partsPromises);
      console.log(`[DEBUG] Fetched parts for ${allParts.length} stages`);

      if (!isMountedRef.current) return;

      // 舞台とパートを統合
      const stagesWithParts: StageWithParts[] = stages.map((stage, index) => {
        const parts = allParts[index];
        const partNames = parts.map(part => part.name);

        return {
          id: stage.id,
          date: stage.performanceDate || '',
          stageName: stage.name,
          description: stage.description,
          status: stage.status,
          parts: partNames,
          partCount: partNames.length,
        };
      });

      console.log(`[DEBUG] Processed ${stagesWithParts.length} stages with parts`);

      if (isMountedRef.current) {
        setState({
          stages: stagesWithParts,
          loading: false,
          error: null,
        });
        console.log('[DEBUG] State updated successfully');
      }
    } catch (error) {
      console.error('[DEBUG] Error in fetchStagesWithParts:', error);
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : '舞台・パートの取得に失敗しました',
        }));
      }
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
        const partsData: CreatePartRequest[] = data.parts
          .filter(partName => partName.trim() !== '') // 空のパート名をフィルタ
          .map(partName => ({
            stageId: newStage.id,
            name: partName,
          }));
        if (partsData.length > 0) {
          await partsService.createParts(partsData);
        }
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

        // 新しいパートを作成（空のパート名をフィルタ）
        const partsData: CreatePartRequest[] = data.parts
          .filter(partName => partName.trim() !== '')
          .map(partName => ({
            stageId: id,
            name: partName,
          }));
        if (partsData.length > 0) {
          await partsService.createParts(partsData);
        }
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
    console.log('[DEBUG] useEffect triggered for initial fetch');
    let isSubscribed = true;

    const fetchData = async () => {
      if (!isSubscribed) return;

      fetchCountRef.current += 1;
      console.log(`[DEBUG] fetchData called: ${fetchCountRef.current} times`);

      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        console.log('[DEBUG] Starting to fetch stages...');

        // 舞台を取得
        const stages = await stagesService.getStages();
        console.log(`[DEBUG] Fetched ${stages.length} stages`);

        if (!isSubscribed) return;

        // すべての舞台のパートを並列で取得
        console.log('[DEBUG] Starting to fetch parts for all stages...');
        const partsPromises = stages.map(stage =>
          partsService.getPartsByStageId(stage.id)
            .catch(error => {
              console.error(`[DEBUG] Failed to fetch parts for stage ${stage.id}:`, error);
              return []; // エラーの場合は空配列を返す
            })
        );

        // すべてのパート取得を並列で待つ
        const allParts = await Promise.all(partsPromises);
        console.log(`[DEBUG] Fetched parts for ${allParts.length} stages`);

        if (!isSubscribed) return;

        // 舞台とパートを統合
        const stagesWithParts: StageWithParts[] = stages.map((stage, index) => {
          const parts = allParts[index];
          const partNames = parts.map(part => part.name);

          return {
            id: stage.id,
            date: stage.performanceDate || '',
            stageName: stage.name,
            description: stage.description,
            status: stage.status,
            parts: partNames,
            partCount: partNames.length,
          };
        });

        console.log(`[DEBUG] Processed ${stagesWithParts.length} stages with parts`);

        if (isSubscribed) {
          setState({
            stages: stagesWithParts,
            loading: false,
            error: null,
          });
          console.log('[DEBUG] State updated successfully');
        }
      } catch (error) {
        console.error('[DEBUG] Error in fetchData:', error);
        if (isSubscribed) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : '舞台・パートの取得に失敗しました',
          }));
        }
      }
    };

    fetchData();

    return () => {
      console.log('[DEBUG] Component unmounting');
      isSubscribed = false;
      isMountedRef.current = false;
    };
  }, []); // 空の依存配列に変更して初回のみ実行

  return {
    ...state,
    fetchStages: fetchStagesWithParts,
    getStage,
    createStage,
    updateStage,
    deleteStage,
  };
};