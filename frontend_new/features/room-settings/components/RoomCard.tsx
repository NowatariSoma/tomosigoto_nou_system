import React from 'react';
import { Room } from '../types/room';

interface RoomCardProps {
  room: Room;
  onClick: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  return (
    <div 
      className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
      onClick={onClick}
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{room.name}</h3>
      
      <div className="space-y-3">
        <div className="flex items-center">
          <span className="text-gray-600 font-medium min-w-[120px]">キャンパス</span>
          <span className="text-gray-500">：</span>
          <span className="text-gray-800 ml-2">{room.campus}</span>
        </div>
        
        <div className="flex items-center">
          <span className="text-gray-600 font-medium min-w-[120px]">収容可能人数</span>
          <span className="text-gray-500">：</span>
          <span className="text-gray-800 ml-2">{room.capacity}人</span>
        </div>
        
        <div className="flex items-center">
          <span className="text-gray-600 font-medium min-w-[120px]">舞の可否</span>
          <span className="text-gray-500">：</span>
          <span className={`ml-2 font-medium ${
            room.danceAllowed ? 'text-green-600' : 'text-red-600'
          }`}>
            {room.danceAllowed ? '可能' : '不可'}
          </span>
        </div>
        
        <div className="flex items-start">
          <span className="text-gray-600 font-medium min-w-[120px] pt-1">説明</span>
          <span className="text-gray-500 pt-1">：</span>
          <span className="text-gray-800 ml-2 leading-relaxed">{room.description}</span>
        </div>
      </div>
    </div>
  );
}; 