'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/forms/button';
import { Plus } from 'lucide-react';
import { RoomList } from './RoomList';
import { RoomModal } from './RoomModal';
import { Room, CreateRoomRequest } from '../types';
import { useRooms } from '../hooks';
import { UI_TEXT, INITIAL_ROOM_FORM } from '../constants';

export const RoomSettingsPage: React.FC = () => {
  const { rooms, loading, error, createRoom, updateRoom, deleteRoom } = useRooms();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddClick = () => {
    setSelectedRoom(null);
    setIsModalOpen(true);
  };

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  const handleSaveRoom = async (updatedRoom: Room) => {
    try {
      if (selectedRoom) {
        // 編集モード
        await updateRoom(updatedRoom.id, {
          name: updatedRoom.name,
          campus: updatedRoom.campus,
          capacity: updatedRoom.capacity,
          danceAllowed: updatedRoom.danceAllowed,
          description: updatedRoom.description
        });
      } else {
        // 新規登録モード
        await createRoom({
          name: updatedRoom.name,
          campus: updatedRoom.campus,
          capacity: updatedRoom.capacity,
          danceAllowed: updatedRoom.danceAllowed,
          description: updatedRoom.description
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save room:', error);
    }
  };

  const handleDeleteRoom = async () => {
    if (selectedRoom) {
      try {
        await deleteRoom(selectedRoom.id);
        handleCloseModal();
      } catch (error) {
        console.error('Failed to delete room:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">{UI_TEXT.LOADING_TEXT}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-error px-4 py-3 rounded">
        エラー: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 新規登録ボタン */}
      <div className="text-center">
        <Button
          onClick={handleAddClick}
          className="btn-add px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          新規登録
        </Button>
      </div>

      <RoomList rooms={rooms || []} onRoomClick={handleRoomClick} />
      <RoomModal
        room={selectedRoom}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveRoom}
        onDelete={selectedRoom ? handleDeleteRoom : undefined}
      />
    </div>
  );
} 