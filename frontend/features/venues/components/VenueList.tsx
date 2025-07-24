'use client'

import React from 'react'
import Image from 'next/image'
import { MapPin, Users, Phone, Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/layout/card'
import { Badge } from '@/components/ui/feedback/badge'
import type { Venue } from '@/types/venue'

interface VenueListProps {
  venues: Venue[]
  onVenueClick: (venueId: number) => void
}

function VenueListItem({ venue, onVenueClick }: { venue: Venue; onVenueClick: (id: number) => void }) {
  const primaryPhoto = venue.photos.find(photo => photo.isPrimary) || venue.photos[0]

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow duration-200"
      data-testid={`venue-item-${venue.id}`}
      onClick={() => onVenueClick(venue.id)}
    >
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* 会場画像 */}
          <div className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden bg-gray-100">
            {primaryPhoto ? (
              <Image
                src={primaryPhoto.url}
                alt={primaryPhoto.alt}
                width={128}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                <Settings className="h-8 w-8" />
              </div>
            )}
          </div>

          {/* 会場情報 */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold text-gray-900 truncate" title={venue.name}>
                {venue.name}
              </h3>
              {!venue.isActive && (
                <Badge variant="secondary">利用停止中</Badge>
              )}
            </div>

            {/* 説明文 */}
            {venue.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {venue.description}
              </p>
            )}

            {/* 場所 */}
            <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <div>{venue.location.address}</div>
                {venue.location.nearestStation && (
                  <div className="text-gray-500">最寄り: {venue.location.nearestStation}</div>
                )}
              </div>
            </div>

            {/* 基本情報 */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <Users className="h-4 w-4" />
                <span>{venue.capacity}名</span>
              </div>
              
              {venue.pricePerHour && (
                <div className="font-semibold text-blue-600">
                  ¥{venue.pricePerHour.toLocaleString()}/時間
                </div>
              )}

              {venue.contactPhone && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{venue.contactPhone}</span>
                </div>
              )}

              <div className="text-gray-500">
                設備: {venue.equipment.length}件
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function VenueList({ venues, onVenueClick }: VenueListProps) {
  if (venues.length === 0) {
    return null
  }

  return (
    <div className="space-y-4" data-testid="venue-list">
      {venues.map((venue) => (
        <VenueListItem
          key={venue.id}
          venue={venue}
          onVenueClick={onVenueClick}
        />
      ))}
    </div>
  )
}