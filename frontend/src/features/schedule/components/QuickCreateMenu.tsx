'use client'

import React, { useState, useCallback } from 'react'
import { QuickSessionData, SessionFormData, Position } from '../../../../types/session'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Label } from '../../ui/label'
import { Clock, Plus, Settings } from 'lucide-react'
import { formatJapaneseTime, addMinutes } from '../utils/dateHelpers'

interface QuickCreateMenuProps {
  position: Position
  onQuickCreate: (data: QuickSessionData) => void
  onDetailedCreate: (initialData: SessionFormData) => void
  onClose: () => void
  parts: Array<{ id: number; name: string }>
  venues: Array<{ id: string; name: string }>
  className?: string
}

const DURATION_OPTIONS = [
  { value: 30, label: '30分' },
  { value: 60, label: '1時間' },
  { value: 90, label: '1時間30分' },
  { value: 120, label: '2時間' },
  { value: 180, label: '3時間' }
]

export const QuickCreateMenu: React.FC<QuickCreateMenuProps> = ({
  position,
  onQuickCreate,
  onDetailedCreate,
  onClose,
  parts,
  venues,
  className
}) => {
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null)
  const [duration, setDuration] = useState<number>(60) // デフォルト1時間

  const handlePartSelect = useCallback((partId: number) => {
    setSelectedPartId(partId)
  }, [])

  const handleDurationChange = useCallback((minutes: number) => {
    setDuration(minutes)
  }, [])

  const handleQuickCreate = useCallback(() => {
    if (!selectedPartId) return

    const quickData: QuickSessionData = {
      partId: selectedPartId,
      duration,
      date: position.date,
      time: position.time
    }

    onQuickCreate(quickData)
  }, [selectedPartId, duration, position, onQuickCreate])

  const handleDetailedCreate = useCallback(() => {
    const initialData: SessionFormData = {
      title: selectedPartId ? parts.find(p => p.id === selectedPartId)?.name || '' : '',
      start: position.time,
      end: addMinutes(position.time, duration),
      partId: selectedPartId || 0,
      instructorId: '',
      venueId: venues[0]?.id || '',
      description: ''
    }

    onDetailedCreate(initialData)
  }, [selectedPartId, duration, position, parts, venues, onDetailedCreate])

  const endTime = addMinutes(position.time, duration)
  const canQuickCreate = selectedPartId !== null

  return (
    <Card 
      className={`absolute z-50 w-80 shadow-lg border ${className}`}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -8px)'
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          セッション作成
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 時間表示 */}
        <div className="bg-gray-50 rounded-md p-3">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <Clock className="w-4 h-4 mr-1" />
            {position.date.toLocaleDateString('ja-JP', { 
              month: 'long', 
              day: 'numeric',
              weekday: 'short'
            })}
          </div>
          <div className="font-semibold">
            {formatJapaneseTime(position.time)} - {formatJapaneseTime(endTime)}
          </div>
          <div className="text-xs text-gray-500">
            ({duration}分間)
          </div>
        </div>

        {/* パート選択 */}
        <div className="space-y-2">
          <Label htmlFor="part-select">パート *</Label>
          <Select 
            value={selectedPartId?.toString() || ''}
            onValueChange={(value) => handlePartSelect(parseInt(value))}
          >
            <SelectTrigger id="part-select">
              <SelectValue placeholder="パートを選択" />
            </SelectTrigger>
            <SelectContent>
              {parts.map((part) => (
                <SelectItem key={part.id} value={part.id.toString()}>
                  {part.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 時間選択 */}
        <div className="space-y-2">
          <Label htmlFor="duration-select">時間</Label>
          <Select 
            value={duration.toString()}
            onValueChange={(value) => handleDurationChange(parseInt(value))}
          >
            <SelectTrigger id="duration-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex-1"
          >
            キャンセル
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDetailedCreate}
            className="flex-1"
          >
            <Settings className="w-4 h-4 mr-1" />
            詳細設定
          </Button>
          
          <Button
            size="sm"
            onClick={handleQuickCreate}
            disabled={!canQuickCreate}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-1" />
            作成
          </Button>
        </div>

        {/* ヘルプテキスト */}
        {!canQuickCreate && (
          <p className="text-xs text-gray-500 text-center">
            パートを選択してください
          </p>
        )}
      </CardContent>
    </Card>
  )
}