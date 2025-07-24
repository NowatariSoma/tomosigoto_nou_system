'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Users, Phone, Mail, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/forms/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card'
import { Badge } from '@/components/ui/feedback/badge'
import { useVenues } from '../hooks/useVenues'
import { VenueCalendar } from '../components/VenueCalendar'
import type { Venue } from '@/types/venue'

interface VenueDetailViewProps {
  venueId: number
}

export function VenueDetailView({ venueId }: VenueDetailViewProps) {
  const router = useRouter()
  const { fetchVenueById } = useVenues()
  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'calendar' | 'equipment'>('info')

  useEffect(() => {
    const loadVenue = async () => {
      try {
        setLoading(true)
        const venueData = await fetchVenueById(venueId)
        setVenue(venueData)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    loadVenue()
  }, [venueId, fetchVenueById])

  const handleBackClick = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (error || !venue) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <Card className="p-6">
            <div className="text-red-600">
              エラーが発生しました: {error?.message || '会場が見つかりません'}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* ヘッダー */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleBackClick}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{venue.name}</h1>
            {venue.description && (
              <p className="text-gray-600 text-lg">{venue.description}</p>
            )}
          </div>
          {!venue.isActive && (
            <Badge variant="secondary" className="text-lg px-3 py-1">
              利用停止中
            </Badge>
          )}
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <Button
            variant={activeTab === 'info' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('info')}
            className="flex-1"
          >
            基本情報
          </Button>
          <Button
            variant={activeTab === 'calendar' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('calendar')}
            className="flex-1"
          >
            <Calendar className="h-4 w-4 mr-2" />
            利用可能時間
          </Button>
          <Button
            variant={activeTab === 'equipment' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('equipment')}
            className="flex-1"
          >
            設備情報
          </Button>
        </div>
      </div>

      {/* タブコンテンツ */}
      <div className="space-y-6">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 基本情報 */}
            <Card>
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 mt-0.5 text-gray-400" />
                  <div>
                    <div className="font-medium">{venue.location.address}</div>
                    {venue.location.nearestStation && (
                      <div className="text-sm text-gray-600">
                        最寄り駅: {venue.location.nearestStation}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span>収容人数: {venue.capacity}名</span>
                </div>

                {venue.pricePerHour && (
                  <div className="text-lg font-semibold text-blue-600">
                    ¥{venue.pricePerHour.toLocaleString()}/時間
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 連絡先情報 */}
            <Card>
              <CardHeader>
                <CardTitle>連絡先</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {venue.contactPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span>{venue.contactPhone}</span>
                  </div>
                )}

                {venue.contactEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span>{venue.contactEmail}</span>
                  </div>
                )}

                {!venue.contactPhone && !venue.contactEmail && (
                  <div className="text-gray-500">連絡先情報は登録されていません。</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'calendar' && (
          <Card>
            <CardHeader>
              <CardTitle>利用可能時間</CardTitle>
            </CardHeader>
            <CardContent>
              <VenueCalendar venueId={venue.id} />
            </CardContent>
          </Card>
        )}

        {activeTab === 'equipment' && (
          <Card>
            <CardHeader>
              <CardTitle>設備情報</CardTitle>
            </CardHeader>
            <CardContent>
              {venue.equipment.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {venue.equipment.map((equipment) => (
                    <div
                      key={equipment.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="font-medium">{equipment.name}</div>
                      <div className="text-sm text-gray-600">{equipment.category}</div>
                      <div className="text-sm">
                        数量: {equipment.count}
                        {equipment.available ? (
                          <Badge variant="default" className="ml-2">利用可能</Badge>
                        ) : (
                          <Badge variant="secondary" className="ml-2">利用不可</Badge>
                        )}
                      </div>
                      {equipment.description && (
                        <div className="text-sm text-gray-600 mt-2">
                          {equipment.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">設備情報は登録されていません。</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}