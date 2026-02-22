import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';
import { useCrudOperations, CrudService } from '@/shared/hooks/useCrudOperations';

interface TestItem {
  id: string;
  name: string;
}

// items状態を管理するラッパーフック
function useTestCrud(
  service: CrudService<TestItem, Partial<TestItem>, Partial<TestItem>>,
  initialItems: TestItem[] = [],
  options = {},
) {
  const [items, setItems] = useState<TestItem[]>(initialItems);
  const refetch = vi.fn();
  const crud = useCrudOperations(items, setItems, refetch, service, options);
  return { items, setItems, refetch, ...crud };
}

const mockItem1: TestItem = { id: '1', name: 'アイテム1' };
const mockItem2: TestItem = { id: '2', name: 'アイテム2' };

describe('useCrudOperations', () => {
  let mockCreate: ReturnType<typeof vi.fn>;
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockDelete: ReturnType<typeof vi.fn>;
  let service: CrudService<TestItem, Partial<TestItem>, Partial<TestItem>>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate = vi.fn();
    mockUpdate = vi.fn();
    mockDelete = vi.fn();
    service = {
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    };
  });

  // --- create ---

  describe('create', () => {
    it('アイテムを作成してリストに追加する（楽観的更新）', async () => {
      const newItem: TestItem = { id: '3', name: '新規アイテム' };
      mockCreate.mockResolvedValue(newItem);

      const { result } = renderHook(() => useTestCrud(service, [mockItem1]));

      let created: TestItem | undefined;
      await act(async () => {
        created = await result.current.create({ name: '新規アイテム' });
      });

      expect(mockCreate).toHaveBeenCalledWith({ name: '新規アイテム' });
      expect(created).toEqual(newItem);
      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[1]).toEqual(newItem);
      expect(result.current.operationLoading).toBe(false);
      expect(result.current.operationError).toBeNull();
    });

    it('refetchOnCreate=trueの場合、リスト追加の代わりにrefetchを呼ぶ', async () => {
      const newItem: TestItem = { id: '3', name: '新規アイテム' };
      mockCreate.mockResolvedValue(newItem);

      const { result } = renderHook(() =>
        useTestCrud(service, [mockItem1], { refetchOnCreate: true }),
      );

      await act(async () => {
        await result.current.create({ name: '新規アイテム' });
      });

      expect(result.current.refetch).toHaveBeenCalledTimes(1);
      // refetchOnCreate=trueの場合、setItemsではなくrefetchが呼ばれるため
      // リストの直接追加は行われない（refetchが実際にデータを取得する想定）
      expect(result.current.items).toHaveLength(1);
    });

    it('エラー時にoperationErrorを設定し、再スローする', async () => {
      mockCreate.mockRejectedValue(new Error('作成エラー'));

      const { result } = renderHook(() => useTestCrud(service, []));

      await act(async () => {
        await expect(result.current.create({ name: 'test' })).rejects.toThrow('作成エラー');
      });

      expect(result.current.operationError).toBe('作成エラー');
      expect(result.current.operationLoading).toBe(false);
    });

    it('Error以外の例外の場合、カスタムエラーメッセージを使用する', async () => {
      mockCreate.mockRejectedValue({ code: 500 });

      const { result } = renderHook(() => useTestCrud(service, []));

      await act(async () => {
        await expect(result.current.create({ name: 'test' })).rejects.toBeTruthy();
      });

      expect(result.current.operationError).toBe('作成に失敗しました');
    });

    it('service.createが未定義の場合、"not supported"をスローする', async () => {
      const noCreateService: CrudService<TestItem, Partial<TestItem>, Partial<TestItem>> = {
        update: mockUpdate,
        delete: mockDelete,
      };

      const { result } = renderHook(() => useTestCrud(noCreateService, []));

      await act(async () => {
        await expect(result.current.create({ name: 'test' })).rejects.toThrow(
          'create is not supported',
        );
      });
    });
  });

  // --- update ---

  describe('update', () => {
    it('アイテムを更新し、リスト内の該当アイテムを置き換える', async () => {
      const updatedItem: TestItem = { id: '1', name: '更新済みアイテム' };
      mockUpdate.mockResolvedValue(updatedItem);

      const { result } = renderHook(() => useTestCrud(service, [mockItem1, mockItem2]));

      let updated: TestItem | undefined;
      await act(async () => {
        updated = await result.current.update('1', { name: '更新済みアイテム' });
      });

      expect(mockUpdate).toHaveBeenCalledWith('1', { name: '更新済みアイテム' });
      expect(updated).toEqual(updatedItem);
      expect(result.current.items[0]).toEqual(updatedItem);
      expect(result.current.items[1]).toEqual(mockItem2);
      expect(result.current.operationLoading).toBe(false);
      expect(result.current.operationError).toBeNull();
    });

    it('エラー時にoperationErrorを設定し、再スローする', async () => {
      mockUpdate.mockRejectedValue(new Error('更新エラー'));

      const { result } = renderHook(() => useTestCrud(service, [mockItem1]));

      await act(async () => {
        await expect(result.current.update('1', { name: 'test' })).rejects.toThrow('更新エラー');
      });

      expect(result.current.operationError).toBe('更新エラー');
      expect(result.current.operationLoading).toBe(false);
    });

    it('一致しないIDの場合、リストは変更されないが更新結果は返す', async () => {
      const updatedItem: TestItem = { id: '999', name: '存在しないアイテム' };
      mockUpdate.mockResolvedValue(updatedItem);

      const { result } = renderHook(() => useTestCrud(service, [mockItem1, mockItem2]));

      let updated: TestItem | undefined;
      await act(async () => {
        updated = await result.current.update('999', { name: '存在しないアイテム' });
      });

      expect(updated).toEqual(updatedItem);
      // リスト内のアイテムは変更されない
      expect(result.current.items).toEqual([mockItem1, mockItem2]);
    });

    it('service.updateが未定義の場合、"not supported"をスローする', async () => {
      const noUpdateService: CrudService<TestItem, Partial<TestItem>, Partial<TestItem>> = {
        create: mockCreate,
        delete: mockDelete,
      };

      const { result } = renderHook(() => useTestCrud(noUpdateService, []));

      await act(async () => {
        await expect(result.current.update('1', { name: 'test' })).rejects.toThrow(
          'update is not supported',
        );
      });
    });
  });

  // --- remove ---

  describe('remove', () => {
    it('アイテムをリストから削除する', async () => {
      mockDelete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useTestCrud(service, [mockItem1, mockItem2]));

      expect(result.current.items).toHaveLength(2);

      await act(async () => {
        await result.current.remove('1');
      });

      expect(mockDelete).toHaveBeenCalledWith('1');
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toEqual(mockItem2);
      expect(result.current.operationLoading).toBe(false);
      expect(result.current.operationError).toBeNull();
    });

    it('エラー時にoperationErrorを設定し、再スローする', async () => {
      mockDelete.mockRejectedValue(new Error('削除エラー'));

      const { result } = renderHook(() => useTestCrud(service, [mockItem1]));

      await act(async () => {
        await expect(result.current.remove('1')).rejects.toThrow('削除エラー');
      });

      expect(result.current.operationError).toBe('削除エラー');
      expect(result.current.operationLoading).toBe(false);
    });

    it('service.deleteが未定義の場合、"not supported"をスローする', async () => {
      const noDeleteService: CrudService<TestItem, Partial<TestItem>, Partial<TestItem>> = {
        create: mockCreate,
        update: mockUpdate,
      };

      const { result } = renderHook(() => useTestCrud(noDeleteService, []));

      await act(async () => {
        await expect(result.current.remove('1')).rejects.toThrow('delete is not supported');
      });
    });
  });

  // --- state ---

  describe('状態管理', () => {
    it('操作中にoperationLoadingがtrue→falseに遷移する', async () => {
      let resolveCreate: (value: TestItem) => void;
      mockCreate.mockReturnValue(
        new Promise<TestItem>((resolve) => {
          resolveCreate = resolve;
        }),
      );

      const { result } = renderHook(() => useTestCrud(service, []));

      expect(result.current.operationLoading).toBe(false);

      let createPromise: Promise<TestItem>;
      act(() => {
        createPromise = result.current.create({ name: 'test' });
      });

      // 操作中はloadingがtrue
      expect(result.current.operationLoading).toBe(true);

      // 解決
      await act(async () => {
        resolveCreate!({ id: '3', name: 'test' });
        await createPromise!;
      });

      expect(result.current.operationLoading).toBe(false);
    });

    it('clearOperationErrorでエラーをクリアする', async () => {
      mockCreate.mockRejectedValue(new Error('テストエラー'));

      const { result } = renderHook(() => useTestCrud(service, []));

      await act(async () => {
        await expect(result.current.create({ name: 'test' })).rejects.toThrow();
      });

      expect(result.current.operationError).toBe('テストエラー');

      act(() => {
        result.current.clearOperationError();
      });

      expect(result.current.operationError).toBeNull();
    });

    it('各操作の前にエラーがクリアされる', async () => {
      // まずエラーを発生させる
      mockCreate.mockRejectedValueOnce(new Error('最初のエラー'));

      const { result } = renderHook(() => useTestCrud(service, []));

      await act(async () => {
        await expect(result.current.create({ name: 'test' })).rejects.toThrow();
      });

      expect(result.current.operationError).toBe('最初のエラー');

      // 次の操作（成功）でエラーがクリアされることを確認
      const newItem: TestItem = { id: '3', name: '成功' };
      mockCreate.mockResolvedValueOnce(newItem);

      await act(async () => {
        await result.current.create({ name: '成功' });
      });

      expect(result.current.operationError).toBeNull();
    });
  });

  // --- custom options ---

  describe('カスタムオプション', () => {
    it('カスタムgetId関数を使用する', async () => {
      interface CustomIdItem {
        _key: string;
        name: string;
      }

      const customService: CrudService<CustomIdItem, Partial<CustomIdItem>, Partial<CustomIdItem>> =
        {
          update: vi.fn().mockResolvedValue({ _key: 'a', name: '更新済み' }),
          delete: vi.fn().mockResolvedValue(undefined),
        };

      const customItem1: CustomIdItem = { _key: 'a', name: 'Aアイテム' };
      const customItem2: CustomIdItem = { _key: 'b', name: 'Bアイテム' };

      function useCustomCrud() {
        const [items, setItems] = useState<CustomIdItem[]>([customItem1, customItem2]);
        const refetch = vi.fn();
        const crud = useCrudOperations(items, setItems, refetch, customService, {
          getId: (item: CustomIdItem) => item._key,
        });
        return { items, ...crud };
      }

      const { result } = renderHook(() => useCustomCrud());

      // updateでカスタムgetIdが正しく動作する
      await act(async () => {
        await result.current.update('a', { name: '更新済み' });
      });

      expect(result.current.items[0]).toEqual({ _key: 'a', name: '更新済み' });
      expect(result.current.items[1]).toEqual(customItem2);

      // removeでカスタムgetIdが正しく動作する
      await act(async () => {
        await result.current.remove('b');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toEqual({ _key: 'a', name: '更新済み' });
    });

    it('カスタムerrorMessagesを使用する', async () => {
      mockCreate.mockRejectedValue({ code: 500 });
      mockUpdate.mockRejectedValue({ code: 500 });
      mockDelete.mockRejectedValue({ code: 500 });

      const customOptions = {
        errorMessages: {
          create: 'カスタム作成エラー',
          update: 'カスタム更新エラー',
          delete: 'カスタム削除エラー',
        },
      };

      const { result } = renderHook(() => useTestCrud(service, [mockItem1], customOptions));

      // create のカスタムエラーメッセージ
      await act(async () => {
        await expect(result.current.create({ name: 'test' })).rejects.toBeTruthy();
      });
      expect(result.current.operationError).toBe('カスタム作成エラー');

      // update のカスタムエラーメッセージ
      await act(async () => {
        await expect(result.current.update('1', { name: 'test' })).rejects.toBeTruthy();
      });
      expect(result.current.operationError).toBe('カスタム更新エラー');

      // remove のカスタムエラーメッセージ
      await act(async () => {
        await expect(result.current.remove('1')).rejects.toBeTruthy();
      });
      expect(result.current.operationError).toBe('カスタム削除エラー');
    });
  });
});
