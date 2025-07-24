'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/forms/button'
import { Card } from '@/components/ui/layout/card'
import { Badge } from '@/components/ui/feedback/badge'
import { useVenues } from '../hooks/useVenues'
import type { VenueAvailability, VenueAvailabilitySlot } from '@/types/venue'

interface VenueCalendarProps {
  venueId: number
  date?: Date
  onDateChange?: (date: Date) => void
  viewMode?: 'month' | 'week'
}

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', 
  '17:00', '18:00', '19:00', '20:00'
]

const weekdays = ['日', '月', '火', '水', '木', '金', '土']

export function VenueCalendar({
  venueId,
  date = new Date(),
  onDateChange,
  viewMode = 'month',
}: VenueCalendarProps) {
  const { fetchVenueAvailability } = useVenues()
  const [currentDate, setCurrentDate] = useState(date)
  const [availability, setAvailability] = useState<VenueAvailability | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadAvailability = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchVenueAvailability(venueId, currentDate)
        setAvailability(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    loadAvailability()
  }, [venueId, currentDate, fetchVenueAvailability])

  const handleNavigatePrev = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
    onDateChange?.(newDate)
  }

  const handleNavigateNext = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
    onDateChange?.(newDate)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startWeekday = firstDay.getDay()

    const days = []
    
    // 前月の日付を追加
    for (let i = startWeekday - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // 当月の日付を追加
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      days.push({ date, isCurrentMonth: true })
    }

    // 次月の日付を追加（42日になるまで）
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day)
      days.push({ date: nextDate, isCurrentMonth: false })
    }

    return days
  }

  const getSlotStatus = (date: Date, time: string): VenueAvailabilitySlot | null => {
    if (!availability) return null
    
    return availability.slots.find(slot => 
      slot.date.toDateString() === date.toDateString() && 
      slot.startTime === time
    ) || null
  }

  const getSlotBadgeVariant = (slot: VenueAvailabilitySlot | null) => {
    if (!slot) return 'outline'
    switch (slot.type) {
      case 'regular':
        return slot.available ? 'default' : 'secondary'
      case 'special':
        return 'destructive'
      case 'unavailable':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getSlotLabel = (slot: VenueAvailabilitySlot | null) => {
    if (!slot) return '未設定'
    if (!slot.available) return slot.reservedBy || '予約済み'
    return '利用可能'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600 text-center p-4">
        エラーが発生しました: {error.message}
      </div>
    )
  }

  const days = getDaysInMonth(currentDate)

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          </h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleNavigatePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNavigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* カレンダーグリッド */}
      <div className="border rounded-lg overflow-hidden">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 bg-gray-50">
          {weekdays.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-gray-700 border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* カレンダー本体 */}
        <div className="grid grid-cols-7">
          {days.map(({ date, isCurrentMonth }, index) => (
            <div
              key={index}
              className={`border-r border-b last:border-r-0 min-h-[120px] p-2 ${
                !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
              }`}
            >
              <div className="text-sm font-medium mb-2">
                {date.getDate()}
              </div>
              
              {/* 時間スロット表示（簡略版） */}
              <div className="space-y-1">
                {timeSlots.slice(0, 3).map((time) => {
                  const slot = getSlotStatus(date, time)
                  return (
                    <div key={time} className="text-xs">
                      <Badge
                        variant={getSlotBadgeVariant(slot)}
                        className="text-xs px-1 py-0"
                      >
                        {time}
                      </Badge>
                    </div>
                  )
                })}
                {timeSlots.length > 3 && (
                  <div className="text-xs text-gray-500">...</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 凡例 */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs">利用可能</Badge>
            <span>通常利用可能</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">予約済み</Badge>
            <span>予約済み・利用不可</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">特別枠</Badge>
            <span>特別利用枠</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">未設定</Badge>
            <span>利用可能時間未設定</span>
          </div>
        </div>
      </Card>
    </div>
  )
}