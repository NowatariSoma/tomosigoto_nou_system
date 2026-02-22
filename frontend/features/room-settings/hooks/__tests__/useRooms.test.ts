import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRooms } from '@/features/room-settings/hooks/useRooms';
import type { Room, CreateRoomRequest, UpdateRoomRequest } from '@/features/room-settings/types';

// roomServiceをモック
const mockGetRooms = vi.fn();
const mockGetRoom = vi.fn();
const mockCreateRoom = vi.fn();
const mockUpdateRoom = vi.fn();
const mockDeleteRoom = vi.fn();

vi.mock('@/features/room-settings/services', () => ({
  roomService: {
    getRooms: (...args: unknown[]) => mockGetRooms(...args),
    getRoom: (...args: unknown[]) => mockGetRoom(...args),
    createRoom: (...args: unknown[]) => mockCreateRoom(...args),
    updateRoom: (...args: unknown[]) => mockUpdateRoom(...args),
    deleteRoom: (...args: unknown[]) => mockDeleteRoom(...args),
  },
}));

const mockRoom: Room = {
  id: 'room-1',
  name: 'テスト会場A',
  campus: '今出川',
  capacity: 50,
  danceAllowed: true,
  description: 'テスト用の会場です',
};

const mockRoom2: Room = {
  id: 'room-2',
  name: 'テスト会場B',
  campus: '京田辺',
  capacity: 30,
  danceAllowed: false,
};

describe('useRooms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRooms.mockResolvedValue([mockRoom, mockRoom2]);
  });

  // --- 自動取得（useEffect）---

  it('マウント時に自動的に会場一覧を取得する', async () => {
    const { result } = renderHook(() => useRooms());

    // 初期状態ではloadingがtrue
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetRooms).toHaveBeenCalledTimes(1);
    expect(result.current.rooms).toHaveLength(2);
    expect(result.current.rooms).toEqual([mockRoom, mockRoom2]);
    expect(result.current.error).toBeNull();
  });

  // --- fetchRooms ---

  it('fetchRoomsで会場一覧を再取得できる', async () => {
    const { result } = renderHook(() => useRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 初回取得後にモックデータを変更
    mockGetRooms.mockResolvedValue([mockRoom]);

    await act(async () => {
      await result.current.fetchRooms();
    });

    expect(mockGetRooms).toHaveBeenCalledTimes(2);
    expect(result.current.rooms).toHaveLength(1);
  });

  // --- getRoom ---

  it('getRoomで個別の会場を取得できる', async () => {
    mockGetRoom.mockResolvedValue(mockRoom);

    const { result } = renderHook(() => useRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let room: Room | undefined;
    await act(async () => {
      room = await result.current.getRoom('room-1');
    });

    expect(mockGetRoom).toHaveBeenCalledWith('room-1');
    expect(room).toEqual(mockRoom);
  });

  it('getRoom失敗時にエラーを設定してthrowする', async () => {
    mockGetRoom.mockRejectedValue(new Error('会場が見つかりません'));

    const { result } = renderHook(() => useRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await expect(result.current.getRoom('nonexistent')).rejects.toThrow('会場が見つかりません');
    });

    expect(result.current.error).toBe('会場が見つかりません');
    expect(result.current.loading).toBe(false);
  });

  // --- createRoom ---

  it('createRoomで会場を作成し、リストを再取得する', async () => {
    const newRoom: Room = {
      id: 'room-3',
      name: '新規会場',
      campus: '今出川',
      capacity: 100,
      danceAllowed: true,
    };
    mockCreateRoom.mockResolvedValue(newRoom);
    // createRoom後のfetchRoomsで返すデータ
    mockGetRooms
      .mockResolvedValueOnce([mockRoom, mockRoom2]) // 初回マウント時
      .mockResolvedValueOnce([mockRoom, mockRoom2, newRoom]); // createRoom後の再取得

    const { result } = renderHook(() => useRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const createData: CreateRoomRequest = {
      name: '新規会場',
      campus: '今出川',
      capacity: 100,
      danceAllowed: true,
    };

    let created: Room | undefined;
    await act(async () => {
      created = await result.current.createRoom(createData);
    });

    expect(mockCreateRoom).toHaveBeenCalledWith(createData);
    expect(created).toEqual(newRoom);
    // createRoom内でfetchRoomsが呼ばれるので、getRoomsが合計2回呼ばれる
    expect(mockGetRooms).toHaveBeenCalledTimes(2);
    expect(result.current.rooms).toHaveLength(3);
  });

  it('createRoom失敗時にエラーを設定してthrowする', async () => {
    mockCreateRoom.mockRejectedValue(new Error('作成に失敗'));

    const { result } = renderHook(() => useRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const createData: CreateRoomRequest = {
      name: '新規会場',
      campus: '今出川',
      capacity: 100,
      danceAllowed: true,
    };

    await act(async () => {
      await expect(result.current.createRoom(createData)).rejects.toThrow('作成に失敗');
    });

    expect(result.current.error).toBe('作成に失敗');
    expect(result.current.loading).toBe(false);
  });

  // --- updateRoom ---

  it('updateRoomで会場を更新し、ローカルのリストを更新する', async () => {
    const updatedRoom: Room = {
      ...mockRoom,
      name: '更新済み会場A',
      capacity: 80,
    };
    mockUpdateRoom.mockResolvedValue(updatedRoom);

    const { result } = renderHook(() => useRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updateData: UpdateRoomRequest = {
      name: '更新済み会場A',
      capacity: 80,
    };

    let updated: Room | undefined;
    await act(async () => {
      updated = await result.current.updateRoom('room-1', updateData);
    });

    expect(mockUpdateRoom).toHaveBeenCalledWith('room-1', updateData);
    expect(updated).toEqual(updatedRoom);
    // ローカルのリストが更新されている
    expect(result.current.rooms[0].name).toBe('更新済み会場A');
    expect(result.current.rooms[0].capacity).toBe(80);
    // 他のroomは影響なし
    expect(result.current.rooms[1]).toEqual(mockRoom2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('updateRoom失敗時にエラーを設定してthrowする', async () => {
    mockUpdateRoom.mockRejectedValue(new Error('更新に失敗'));

    const { result } = renderHook(() => useRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await expect(
        result.current.updateRoom('room-1', { name: '失敗する更新' })
      ).rejects.toThrow('更新に失敗');
    });

    expect(result.current.error).toBe('更新に失敗');
    expect(result.current.loading).toBe(false);
    // 元のデータは変更されていない
    expect(result.current.rooms[0].name).toBe('テスト会場A');
  });

  // --- deleteRoom ---

  it('deleteRoomで会場を削除し、ローカルのリストから除去する', async () => {
    mockDeleteRoom.mockResolvedValue(undefined);

    const { result } = renderHook(() => useRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.rooms).toHaveLength(2);

    await act(async () => {
      await result.current.deleteRoom('room-1');
    });

    expect(mockDeleteRoom).toHaveBeenCalledWith('room-1');
    expect(result.current.rooms).toHaveLength(1);
    expect(result.current.rooms[0]).toEqual(mockRoom2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deleteRoom失敗時にエラーを設定してthrowする', async () => {
    mockDeleteRoom.mockRejectedValue(new Error('削除に失敗'));

    const { result } = renderHook(() => useRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await expect(result.current.deleteRoom('room-1')).rejects.toThrow('削除に失敗');
    });

    expect(result.current.error).toBe('削除に失敗');
    expect(result.current.loading).toBe(false);
    // 元のデータは変更されていない
    expect(result.current.rooms).toHaveLength(2);
  });

  // --- エラーハンドリング ---

  it('getRooms失敗時にエラーを設定する', async () => {
    mockGetRooms.mockRejectedValue(new Error('取得失敗'));

    const { result } = renderHook(() => useRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('取得失敗');
    expect(result.current.rooms).toEqual([]);
  });

  it('Error以外の例外の場合はデフォルトのエラーメッセージを設定する', async () => {
    mockGetRooms.mockRejectedValue('文字列エラー');

    const { result } = renderHook(() => useRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('会場の取得に失敗しました');
  });

  it('createRoomでError以外の例外の場合はデフォルトメッセージを設定する', async () => {
    mockCreateRoom.mockRejectedValue({ code: 500 });

    const { result } = renderHook(() => useRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await expect(result.current.createRoom({
        name: 'test',
        campus: '今出川',
        capacity: 10,
        danceAllowed: false,
      })).rejects.toBeTruthy();
    });

    expect(result.current.error).toBe('会場の作成に失敗しました');
  });

  it('updateRoomでError以外の例外の場合はデフォルトメッセージを設定する', async () => {
    mockUpdateRoom.mockRejectedValue(42);

    const { result } = renderHook(() => useRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await expect(
        result.current.updateRoom('room-1', { name: 'test' })
      ).rejects.toBeTruthy();
    });

    expect(result.current.error).toBe('会場の更新に失敗しました');
  });

  it('deleteRoomでError以外の例外の場合はデフォルトメッセージを設定する', async () => {
    mockDeleteRoom.mockRejectedValue('文字列エラー');

    const { result } = renderHook(() => useRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await expect(result.current.deleteRoom('room-1')).rejects.toBeTruthy();
    });

    expect(result.current.error).toBe('会場の削除に失敗しました');
  });

  // --- loading状態 ---

  it('操作中にloadingがtrueになり、完了後にfalseになる', async () => {
    // getRoomsを遅延させて、loading状態を観察する
    let resolveGetRooms: (value: Room[]) => void;
    mockGetRooms.mockReturnValue(
      new Promise<Room[]>((resolve) => {
        resolveGetRooms = resolve;
      })
    );

    const { result } = renderHook(() => useRooms());

    // 取得中はloadingがtrue
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    // 解決
    await act(async () => {
      resolveGetRooms!([mockRoom]);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.rooms).toEqual([mockRoom]);
  });

  it('エラー発生後に再取得するとエラーがクリアされる', async () => {
    mockGetRooms.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useRooms());

    await waitFor(() => {
      expect(result.current.error).toBe('取得失敗');
    });

    // 再取得で成功する
    mockGetRooms.mockResolvedValue([mockRoom]);

    await act(async () => {
      await result.current.fetchRooms();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.rooms).toEqual([mockRoom]);
  });
});
