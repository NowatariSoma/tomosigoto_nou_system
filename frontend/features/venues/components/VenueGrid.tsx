'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { MapPin, Users, Settings, Phone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/layout/card'
import { Badge } from '@/components/ui/feedback/badge'
import { Skeleton } from '@/components/ui/feedback/skeleton'
import { cn } from '@/lib/utils'
import type { Venue } from '@/types/venue'

interface VenueGridProps {
  venues: Venue[]
  onVenueClick: (venueId: number) => void
  loading?: boolean
  gridSize?: 'small' | 'medium' | 'large'
}

const gridSizeClasses = {
  small: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  medium: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  large: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
}

function VenueCardSkeleton() {
  return (
    <Card className="overflow-hidden" data-testid="venue-card-skeleton">
      <div className="aspect-video relative">
        <Skeleton className="w-full h-full" />
      </div>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

function VenueCard({ venue, onVenueClick }: { venue: Venue; onVenueClick: (id: number) => void }) {
  const [hoveredVenueId, setHoveredVenueId] = useState<number | null>(null)
  const primaryPhoto = venue.photos.find(photo => photo.isPrimary) || venue.photos[0]

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onVenueClick(venue.id)
    }
  }

  return (
    <Card
      className={cn(
        'overflow-hidden cursor-pointer transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500',
        hoveredVenueId === venue.id && 'shadow-lg'
      )}
      data-testid={`venue-card-${venue.id}`}
      onClick={() => onVenueClick(venue.id)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHoveredVenueId(venue.id)}
      onMouseLeave={() => setHoveredVenueId(null)}
      role="button"
      tabIndex={0}
      aria-label={`${venue.name} の詳細を見る`}
    >
      {/* 会場画像 */}
      <div className="aspect-video relative bg-gray-100">
        {primaryPhoto ? (
          <Image
            src={primaryPhoto.url}
            alt={primaryPhoto.alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400"
            data-testid="default-venue-image"
            aria-label="会場の画像がありません"
          >
            <Settings className="h-12 w-12" />
          </div>
        )}
        
        {/* ステータスバッジ */}
        {!venue.isActive && (
          <Badge variant="secondary" className="absolute top-2 right-2">
            利用停止中
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* 会場名 */}
        <h3 className="font-semibold text-lg line-clamp-1" title={venue.name}>
          {venue.name}
        </h3>

        {/* 場所 */}
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2" title={venue.location.address}>
            {venue.location.address}
          </span>
        </div>

        {/* 最寄り駅 */}
        {venue.location.nearestStation && (
          <div className="text-sm text-gray-500">
            最寄り: {venue.location.nearestStation}
          </div>
        )}

        {/* 収容人数と料金 */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Users className="h-4 w-4" />
            <span>{venue.capacity}名</span>
          </div>
          {venue.pricePerHour && (
            <div className="font-semibold text-blue-600">
              ¥{venue.pricePerHour.toLocaleString()}/時間
            </div>
          )}
        </div>

        {/* 設備・連絡先情報 */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            設備: {venue.equipment.length}件
          </div>
          {venue.contactPhone && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Phone className="h-3 w-3" />
              <span>連絡先あり</span>
            </div>
          )}
        </div>

        {/* 説明文（短縮版） */}
        {venue.description && (
          <p className="text-sm text-gray-600 line-clamp-2" title={venue.description}>
            {venue.description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function VenueGrid({
  venues,
  onVenueClick,
  loading = false,
  gridSize = 'medium',
}: VenueGridProps) {
  if (loading) {
    return (
      <div
        className={cn('grid gap-6', gridSizeClasses[gridSize])}
        data-testid="venue-grid"
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <VenueCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (venues.length === 0) {
    return null
  }

  return (
    <div
      className={cn('grid gap-6', gridSizeClasses[gridSize])}
      data-testid="venue-grid"
    >
      {venues.map((venue) => (
        <VenueCard
          key={venue.id}
          venue={venue}
          onVenueClick={onVenueClick}
        />
      ))}
    </div>
  )
}