import React from 'react';
import { Room } from '../types/room';
import { RoomCard } from './RoomCard';

interface RoomListProps {
  rooms: Room[];
  onRoomClick: (room: Room) => void;
}

export const RoomList: React.FC<RoomListProps> = ({ rooms, onRoomClick }) => {
  // roomsが未定義の場合のフォールバック処理
  const safeRooms = rooms || [];
  
  if (safeRooms.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-gray-500">
          会場データがありません
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
        {safeRooms.map((room) => (
          <RoomCard key={room.id} room={room} onClick={() => onRoomClick(room)} />
        ))}
      </div>
    </div>
  );
}; 