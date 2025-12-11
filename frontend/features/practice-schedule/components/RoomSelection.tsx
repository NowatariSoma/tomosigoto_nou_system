import React, { useState } from 'react';
import { Button } from '@/components/ui/forms/button';
import { Badge } from '@/components/ui/feedback/badge';
import { MapPin, X, Plus } from 'lucide-react';
import { Room } from '../../room-settings/types';
import RoomSelectionModal from './RoomSelectionModal';

interface RoomSelectionProps {
  selectedRooms: Room[];
  onAddRoom: (rooms: Room[]) => void;
  onRemoveRoom: (roomId: string) => void;
  availableRooms: Room[];
}

const RoomSelection: React.FC<RoomSelectionProps> = ({
  selectedRooms,
  onAddRoom,
  onRemoveRoom,
  availableRooms,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirmSelection = (newSelectedRooms: Room[]) => {
    onAddRoom(newSelectedRooms);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {selectedRooms.map((room) => (
          <span
            key={room.id}
            className="badge-info inline-flex items-center gap-1"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemoveRoom(room.id)}
              className="hover:text-black transition-colors h-auto w-auto p-0"
            >
              <X className="h-3 w-3" />
            </Button>
            {room.name}
          </span>
        ))}
        <Button
          variant="outline"
          onClick={handleOpenModal}
          className="inline-flex items-center gap-1 px-3 py-1 text-sm"
        >
          <Plus className="h-4 w-4" />
          部屋を追加
        </Button>
      </div>

      <RoomSelectionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmSelection}
        availableRooms={availableRooms}
        currentlySelectedRooms={selectedRooms}
      />
    </div>
  );
};

export default RoomSelection;
