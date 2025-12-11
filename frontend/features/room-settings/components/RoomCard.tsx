import React from 'react';
import { Room } from '../types';
import { UI_TEXT } from '../constants';

interface RoomCardProps {
  room: Room;
  onClick: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  return (
    <div
      className="card-blue-hover rounded-2xl p-6 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
      onClick={onClick}
    >
      <h3 className="text-xl font-semibold text-black mb-4">{room.name}</h3>

      <div className="space-y-3">
        <div className="flex items-center">
          <span className="text-black font-medium min-w-[120px]">キャンパス</span>
          <span className="text-black">：</span>
          <span className="text-black ml-2">{room.campus}</span>
        </div>

        <div className="flex items-center">
          <span className="text-black font-medium min-w-[120px]">収容可能人数</span>
          <span className="text-black">：</span>
          <span className="text-black ml-2">{room.capacity}人</span>
        </div>

        <div className="flex items-center">
          <span className="text-black font-medium min-w-[120px]">舞の可否</span>
          <span className="text-black">：</span>
          <span className={`ml-2 font-medium ${
            room.danceAllowed ? 'text-black' : 'text-gray-600'
          }`}>
            {room.danceAllowed ? UI_TEXT.DANCE_ALLOWED : UI_TEXT.DANCE_NOT_ALLOWED}
          </span>
        </div>

        <div className="flex items-start">
          <span className="text-black font-medium min-w-[120px] pt-1">説明</span>
          <span className="text-black pt-1">：</span>
          <span className="text-black ml-2 leading-relaxed">{room.description}</span>
        </div>
      </div>
    </div>
  );
}; 