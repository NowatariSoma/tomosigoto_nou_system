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

    if (!isMountedRef.current) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // 舞台を取得
      const stages = await stagesService.getStages();

      if (!isMountedRef.current) return;

      // すべての舞台のパートを並列で取得
      const partsPromises = stages.map(stage =>
        partsService.getPartsByStageId(stage.id)
          .catch(error => {
            return []; // エラーの場合は空配列を返す
          })
      );

      // すべてのパート取得を並列で待つ
      const allParts = await Promise.all(partsPromises);

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

      if (isMountedRef.current) {
        setState({
          stages: stagesWithParts,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
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
      // 1. 舞台を更新
      const updatedStage = await stagesService.updateStage(id, {
        name: data.stageName,
        description: data.description,
        performanceDate: data.date,
        status: data.status,
      });

      // 2. パートのステータスを舞台のステータスに合わせて更新
      await partsService.updatePartsStatusByStageId(id, data.status || 'active');

      // 3. パートを差分更新（既存パートを保持しつつ、追加・削除のみ行う）
      if (data.parts) {
        // 既存のパートを取得
        const existingParts = await partsService.getPartsByStageId(id);
        const existingPartNames = existingParts.map(part => part.name);
        const newPartNames = data.parts.filter(name => name.trim() !== '');

        // 削除対象: 既存にあるが新しいリストにないパート
        const partsToDelete = existingParts.filter(
          part => !newPartNames.includes(part.name)
        );

        // 追加対象: 新しいリストにあるが既存にないパート
        const partsToAdd = newPartNames.filter(
          name => !existingPartNames.includes(name)
        );

        // 削除対象のパートを削除
        if (partsToDelete.length > 0) {
          await partsService.deleteParts(partsToDelete.map(part => part.id));
        }

        // 追加対象のパートを作成
        if (partsToAdd.length > 0) {
          const partsData: CreatePartRequest[] = partsToAdd.map(name => ({
            stageId: id,
            name: name,
          }));
          await partsService.createParts(partsData);
        }
      }

      // 4. 統合データを再取得
      await fetchStagesWithParts();

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
    isMountedRef.current = true;

    // fetchStagesWithPartsを直接呼び出し（重複を排除）
    fetchStagesWithParts();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchStagesWithParts]); // fetchStagesWithPartsを依存配列に追加

  return {
    ...state,
    fetchStages: fetchStagesWithParts,
    getStage,
    createStage,
    updateStage,
    deleteStage,
  };
};