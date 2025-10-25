'use client';

import React from 'react';
import { VenueInfo } from '../types/session-editor';
import { getVenueColor } from '../mappers/venue-mapper';

interface VenueColumnProps {
  venue: VenueInfo;
}

export const VenueColumn: React.FC<VenueColumnProps> = ({ venue }) => {
  const color = getVenueColor(venue);

  return (
    <th className="px-4 py-3 text-center font-medium border-r border-gray-300 text-white">
      <div className="flex items-center justify-center space-x-2">
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: color }}
        ></div>
        <span>{venue.name}</span>
        {venue.is_preferred && <span className="text-xs">⭐</span>}
      </div>
      <div className="text-xs text-white font-normal">
        優先度: {venue.priority}
      </div>
    </th>
  );
};
