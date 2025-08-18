'use client';

import React, { useState } from 'react';
import { Header } from './Header';
import { RoomList } from './RoomList';
import { RoomModal } from './RoomModal';
import { Room } from '../types/room';
import { rooms } from '../data/rooms';

export const RoomSettingsPage: React.FC = () => {
  const [roomsData, setRoomsData] = useState<Room[]>(rooms);
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

  const handleSaveRoom = (updatedRoom: Room) => {
    setRoomsData(prev => 
      prev.map(room => 
        room.id === updatedRoom.id ? updatedRoom : room
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header />
      <RoomList rooms={roomsData} onRoomClick={handleRoomClick} />
      <RoomModal
        room={selectedRoom}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveRoom}
      />
    </div>
  );
} 