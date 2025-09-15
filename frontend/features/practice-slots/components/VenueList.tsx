'use client';

import React from 'react';
import { VenueDisplayInfo } from '../types/practice-display';
import { UI_TEXT } from '../constants/practice-display';

interface VenueListProps {
  venues: VenueDisplayInfo[];
}

export const VenueList: React.FC<VenueListProps> = ({ venues }) => {
  if (venues.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-gray-500">{UI_TEXT.NO_VENUES}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-100 border-b border-gray-300">
        <h3 className="font-medium text-gray-700">利用可能会場</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues
            .sort((a, b) => a.priority - b.priority)
            .map((venue) => (
              <div
                key={venue.id}
                className={`border rounded p-4 transition-colors ${
                  venue.is_preferred
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{venue.name}</h4>
                  {venue.is_preferred && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {UI_TEXT.PREFERRED_VENUE}
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  <div>優先度: {venue.priority}</div>
                  {venue.notes && (
                    <div className="mt-2">
                      <div className="font-medium text-gray-700">備考:</div>
                      <div className="text-gray-600">{venue.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};