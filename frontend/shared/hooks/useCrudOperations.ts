'use client';

import { useCallback, useState } from 'react';

export interface CrudService<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  create?: (dto: CreateDTO) => Promise<T>;
  update?: (id: string, dto: UpdateDTO) => Promise<T>;
  delete?: (id: string) => Promise<void>;
}

export interface UseCrudOperationsOptions {
  /** ID取得関数 (default: (item) => item.id) */
  getId?: (item: any) => string;
  /** 作成後にリスト全体を再フェッチするか (default: false) */
  refetchOnCreate?: boolean;
  /** エラーメッセージ */
  errorMessages?: {
    create?: string;
    update?: string;
    delete?: string;
  };
}

export interface UseCrudOperationsReturn<T, CreateDTO, UpdateDTO> {
  create: (dto: CreateDTO) => Promise<T>;
  update: (id: string, dto: UpdateDTO) => Promise<T>;
  remove: (id: string) => Promise<void>;
  operationLoading: boolean;
  operationError: string | null;
  clearOperationError: () => void;
}

/**
 * CRUD操作の共通パターンを抽象化するフック
 *
 * @param items 現在のデータ配列
 * @param setItems データ配列のセッター
 * @param refetch データ再取得関数
 * @param service CRUDサービス
 * @param options オプション
 */
export function useCrudOperations<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>>(
  items: T[],
  setItems: React.Dispatch<React.SetStateAction<T[]>>,
  refetch: () => Promise<void>,
  service: CrudService<T, CreateDTO, UpdateDTO>,
  options: UseCrudOperationsOptions = {},
): UseCrudOperationsReturn<T, CreateDTO, UpdateDTO> {
  const {
    getId = (item: any) => item.id,
    refetchOnCreate = false,
    errorMessages = {},
  } = options;

  const [operationLoading, setOperationLoading] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  const extractErrorMessage = useCallback(
    (e: unknown, fallback: string) => {
      return e instanceof Error ? e.message : fallback;
    },
    [],
  );

  const create = useCallback(
    async (dto: CreateDTO): Promise<T> => {
      if (!service.create) {
        throw new Error('create is not supported');
      }
      setOperationLoading(true);
      setOperationError(null);
      try {
        const created = await service.create(dto);
        if (refetchOnCreate) {
          await refetch();
        } else {
          setItems((prev) => [...prev, created]);
        }
        return created;
      } catch (e) {
        const msg = extractErrorMessage(e, errorMessages.create ?? '作成に失敗しました');
        setOperationError(msg);
        throw e;
      } finally {
        setOperationLoading(false);
      }
    },
    [service, refetchOnCreate, refetch, setItems, extractErrorMessage, errorMessages.create],
  );

  const update = useCallback(
    async (id: string, dto: UpdateDTO): Promise<T> => {
      if (!service.update) {
        throw new Error('update is not supported');
      }
      setOperationLoading(true);
      setOperationError(null);
      try {
        const updated = await service.update(id, dto);
        setItems((prev) => prev.map((item) => (getId(item) === id ? updated : item)));
        return updated;
      } catch (e) {
        const msg = extractErrorMessage(e, errorMessages.update ?? '更新に失敗しました');
        setOperationError(msg);
        throw e;
      } finally {
        setOperationLoading(false);
      }
    },
    [service, setItems, getId, extractErrorMessage, errorMessages.update],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      if (!service.delete) {
        throw new Error('delete is not supported');
      }
      setOperationLoading(true);
      setOperationError(null);
      try {
        await service.delete(id);
        setItems((prev) => prev.filter((item) => getId(item) !== id));
      } catch (e) {
        const msg = extractErrorMessage(e, errorMessages.delete ?? '削除に失敗しました');
        setOperationError(msg);
        throw e;
      } finally {
        setOperationLoading(false);
      }
    },
    [service, setItems, getId, extractErrorMessage, errorMessages.delete],
  );

  const clearOperationError = useCallback(() => {
    setOperationError(null);
  }, []);

  return { create, update, remove, operationLoading, operationError, clearOperationError };
}
