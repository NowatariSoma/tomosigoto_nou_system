import { useState, useCallback } from 'react';
import { partsService, PartData, CreatePartRequest, UpdatePartRequest } from '../services/parts-service';

interface UsePartsState {
  parts: PartData[];
  loading: boolean;
  error: string | null;
}

export const useParts = (stageId?: string) => {
  const [state, setState] = useState<UsePartsState>({
    parts: [],
    loading: false,
    error: null,
  });

  const fetchParts = useCallback(async (targetStageId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const parts = await partsService.getPartsByStageId(targetStageId);
      setState({
        parts,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'パートの取得に失敗しました',
      }));
    }
  }, []);

  const getPart = useCallback((id: string) => {
    return state.parts.find((part) => part.id === id);
  }, [state.parts]);

  const createPart = useCallback(async (data: CreatePartRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const newPart = await partsService.createPart(data);
      setState((prev) => ({
        ...prev,
        parts: [...prev.parts, newPart],
        loading: false,
        error: null,
      }));
      return newPart;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'パートの作成に失敗しました',
      }));
      throw error;
    }
  }, []);

  const createParts = useCallback(async (parts: CreatePartRequest[]) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const newParts = await partsService.createParts(parts);
      setState((prev) => ({
        ...prev,
        parts: [...prev.parts, ...newParts],
        loading: false,
        error: null,
      }));
      return newParts;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'パートの作成に失敗しました',
      }));
      throw error;
    }
  }, []);

  const updatePart = useCallback(async (id: string, data: UpdatePartRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const updatedPart = await partsService.updatePart(id, data);
      setState((prev) => ({
        ...prev,
        parts: prev.parts.map((part) =>
          part.id === id ? updatedPart : part
        ),
        loading: false,
        error: null,
      }));
      return updatedPart;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'パートの更新に失敗しました',
      }));
      throw error;
    }
  }, []);

  const deletePart = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await partsService.deletePart(id);
      setState((prev) => ({
        ...prev,
        parts: prev.parts.filter((part) => part.id !== id),
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'パートの削除に失敗しました',
      }));
      throw error;
    }
  }, []);

  const deletePartsByStageId = useCallback(async (targetStageId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await partsService.deletePartsByStageId(targetStageId);
      setState((prev) => ({
        ...prev,
        parts: prev.parts.filter((part) => part.stageId !== targetStageId),
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'パートの削除に失敗しました',
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    fetchParts,
    getPart,
    createPart,
    createParts,
    updatePart,
    deletePart,
    deletePartsByStageId,
  };
};