'use client';

import React, { useState } from 'react';
import { VenueInfo } from '../types/session-editor';
import { SelectionModal } from '@/components/ui/interactive/selection-modal';
import { Plus, X, MapPin, Edit2 } from 'lucide-react';
interface VenueEditorProps {
  venues: VenueInfo[];
  availableRooms: VenueInfo[];
  onAddVenues: (venues: VenueInfo[]) => void;
  onRemoveVenue: (venueId: string) => void;
  onUpdateVenue: (venueId: string, venue: VenueInfo) => void;
  isEditMode: boolean;
}

export const VenueEditor: React.FC<VenueEditorProps> = ({
  venues,
  availableRooms,
  onAddVenues,
  onRemoveVenue,
  onUpdateVenue,
  isEditMode,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<VenueInfo[]>([]);

  const handleOpenModal = () => {
    console.log('VenueEditor - handleOpenModal called');
    console.log('VenueEditor - availableRooms:', availableRooms);
    console.log('VenueEditor - venues:', venues);

    // 既に選択されている会場をRoomに変換して初期選択とする
    const currentlySelectedRooms = availableRooms.filter(room =>
      venues.some(venue => venue.id === room.id)
    );
    console.log('VenueEditor - currentlySelectedRooms:', currentlySelectedRooms);

    setSelectedRooms(currentlySelectedRooms);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirmSelection = (newSelectedRooms: VenueInfo[]) => {
    // 新しく選択された部屋
    const newVenues: VenueInfo[] = newSelectedRooms
      .filter(room => !venues.some(v => v.id === room.id));

    if (newVenues.length > 0) {
      onAddVenues(newVenues);
    }

    // 選択解除された部屋を削除
    const removedVenueIds = venues
      .filter(venue => !newSelectedRooms.some(room => room.id === venue.id))
      .map(venue => venue.id);

    removedVenueIds.forEach(id => onRemoveVenue(id));

    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-gray-600" />
          会場設定
        </h3>
        {isEditMode && (
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            編集
          </button>
        )}
      </div>

      {/* 部屋選択モーダル */}
      <SelectionModal<VenueInfo>
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmSelection}
        items={availableRooms}
        selectedItems={selectedRooms}
        title="会場を選択"
        columns={2}
        getItemLabel={(room) => room.name}
        getItemSubLabel={(room) => room.campus ? `${room.campus}キャンパス` : ''}
        selectedCountText={(count) => `${count}個の会場を選択中`}
        confirmButtonText="確定"
        cancelButtonText="キャンセル"
      />
    </div>
  );
};