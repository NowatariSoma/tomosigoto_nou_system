'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/overlays/dialog';
import { Button } from '@/components/ui/forms/button';
import { X } from 'lucide-react';
import { Room } from '../types';

interface RoomSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedRooms: Room[]) => void;
  availableRooms: Room[];
  currentlySelectedRooms: Room[];
}

const RoomSelectionModal: React.FC<RoomSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  availableRooms,
  currentlySelectedRooms,
}) => {
  const [tempSelectedRooms, setTempSelectedRooms] = useState<Room[]>(currentlySelectedRooms);

  const handleRoomToggle = (room: Room) => {
    const isCurrentlySelected = tempSelectedRooms.some(r => r.id === room.id);
    
    if (isCurrentlySelected) {
      setTempSelectedRooms(tempSelectedRooms.filter(r => r.id !== room.id));
    } else {
      setTempSelectedRooms([...tempSelectedRooms, room]);
    }
  };

  const handleConfirm = () => {
    onConfirm(tempSelectedRooms);
    onClose();
  };

  const handleCancel = () => {
    setTempSelectedRooms(currentlySelectedRooms); // 元の状態に戻す
    onClose();
  };

  const isRoomSelected = (roomId: string) => {
    return tempSelectedRooms.some(r => r.id === roomId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-800">
            部屋を選択
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="p-1 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-3 p-1">
            {availableRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleRoomToggle(room)}
                className={`
                  relative px-4 py-6 rounded-xl border-2 transition-all duration-200
                  text-center font-medium text-sm
                  ${isRoomSelected(room.id)
                    ? 'bg-blue-100 border-blue-400 text-blue-700 shadow-md'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                  }
                `}
              >
                <div className="truncate">
                  {room.name}
                </div>
                {isRoomSelected(room.id) && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-blue-600 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {tempSelectedRooms.length}個の部屋を選択中
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="px-6"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleConfirm}
              className="px-6 bg-blue-600 hover:bg-blue-700"
            >
              確定
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomSelectionModal;
