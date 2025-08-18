import React from 'react';
import { Room } from '../types/room';
import { RoomCard } from './RoomCard';

interface RoomListProps {
  rooms: Room[];
  onRoomClick: (room: Room) => void;
}

export const RoomList: React.FC<RoomListProps> = ({ rooms, onRoomClick }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} onClick={() => onRoomClick(room)} />
        ))}
      </div>
    </div>
  );
}; 