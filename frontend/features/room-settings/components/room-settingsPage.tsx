'use client';

import React, { useState, useEffect } from 'react';
import { RoomList } from './RoomList';
import { RoomModal } from './RoomModal';
import { Room } from '../types';
import { useRooms } from '../hooks';

export const RoomSettingsPage: React.FC = () => {
  const { rooms, loading, error, updateRoom, deleteRoom } = useRooms();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      await updateRoom(updatedRoom.id, {
        name: updatedRoom.name,
        campus: updatedRoom.campus,
        capacity: updatedRoom.capacity,
        danceAllowed: updatedRoom.danceAllowed,
        description: updatedRoom.description,
        location: updatedRoom.location
      });
      handleCloseModal();
    } catch (error) {
      console.error('Failed to update room:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        エラー: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RoomList rooms={rooms || []} onRoomClick={handleRoomClick} />
      <RoomModal
        room={selectedRoom}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveRoom}
      />
    </div>
  );
} 