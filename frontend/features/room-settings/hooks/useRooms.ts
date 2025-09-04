import { useState, useCallback, useEffect } from 'react';
import { roomService } from '../services';
import { Room } from '../types/room';
import { CreateRoomRequest, UpdateRoomRequest } from '../services/room-service';

interface UseRoomsState {
  rooms: Room[];
  loading: boolean;
  error: string | null;
}

export const useRooms = () => {
  const [state, setState] = useState<UseRoomsState>({
    rooms: [],
    loading: false,
    error: null,
  });

  const fetchRooms = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const rooms = await roomService.getRooms();
      setState({
        rooms,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '会場の取得に失敗しました',
      }));
    }
  }, []);

  const getRoom = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const room = await roomService.getRoom(id);
      return room;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '会場の取得に失敗しました',
      }));
      throw error;
    }
  }, []);

  const createRoom = useCallback(async (data: CreateRoomRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const newRoom = await roomService.createRoom(data);
      await fetchRooms(); // リストを再取得
      return newRoom;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '会場の作成に失敗しました',
      }));
      throw error;
    }
  }, [fetchRooms]);

  const updateRoom = useCallback(async (id: string, data: UpdateRoomRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const updatedRoom = await roomService.updateRoom(id, data);
      setState((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) => (r.id === id ? updatedRoom : r)),
        loading: false,
        error: null,
      }));
      return updatedRoom;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '会場の更新に失敗しました',
      }));
      throw error;
    }
  }, []);

  const deleteRoom = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await roomService.deleteRoom(id);
      setState((prev) => ({
        ...prev,
        rooms: prev.rooms.filter((r) => r.id !== id),
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '会場の削除に失敗しました',
      }));
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return {
    ...state,
    fetchRooms,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom,
  };
};