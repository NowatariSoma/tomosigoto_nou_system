import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { Badge } from '@/components/ui/feedback/badge';
import { Users, X, Plus } from 'lucide-react';
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
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          部屋
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {selectedRooms.map((room) => (
            <Badge
              key={room.id}
              variant="outline"
              className="px-4 py-2 text-base border-2 border-blue-200 bg-white transition-colors"
            >
              <button
                onClick={() => onRemoveRoom(room.id)}
                className="mr-2 hover:text-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              {room.name} ({room.campus}キャンパス)
            </Badge>
          ))}
          <Button
            onClick={handleOpenModal}
            variant="outline"
            size="sm"
            className="border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-100 transition-all"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      <RoomSelectionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmSelection}
        availableRooms={availableRooms}
        currentlySelectedRooms={selectedRooms}
      />
    </Card>
  );
};

export default RoomSelection;
