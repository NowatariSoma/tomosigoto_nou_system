'use client';

import React from 'react';
import { SelectionModal } from '@/components/ui/interactive/selection-modal';
import { Room } from '../../room-settings/types';

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
  return (
    <SelectionModal<Room>
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      items={availableRooms}
      selectedItems={currentlySelectedRooms}
      title="部屋を選択"
      columns={3}
      getItemLabel={(room) => room.name}
      getItemSubLabel={(room) => `${room.campus}キャンパス`}
      selectedCountText={(count) => `${count}個の部屋を選択中`}
    />
  );
};

export default RoomSelectionModal;
