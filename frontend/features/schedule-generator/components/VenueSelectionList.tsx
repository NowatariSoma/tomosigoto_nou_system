'use client'

import React, { useState, useMemo } from 'react'
import { Venue, EquipmentType } from '../types/generationParams'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Search, Filter, X } from 'lucide-react'

interface VenueSelectionListProps {
  venues: Venue[]
  selectedVenues: number[]
  venueOrder: number[]
  onChange: (data: { ids: number[], order: number[] }) => void
  equipmentTypes: EquipmentType[]
}

export const VenueSelectionList: React.FC<VenueSelectionListProps> = ({
  venues,
  selectedVenues,
  venueOrder,
  onChange,
  equipmentTypes,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<number[]>([])
  const [isPriorityOpen, setIsPriorityOpen] = useState(false)
  const [isEquipmentFilterOpen, setIsEquipmentFilterOpen] = useState(false)
  const [draggedVenueId, setDraggedVenueId] = useState<number | null>(null)

  // フィルタされた会場一覧
  const filteredVenues = useMemo(() => {
    return venues.filter(venue => {
      // 会場名フィルタ
      const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      // 設備フィルタ（選択された設備がすべて含まれている会場のみ）
      const matchesEquipment = selectedEquipmentIds.length === 0 || 
        selectedEquipmentIds.every(equipId => venue.equipmentIds.includes(equipId))
      
      return matchesSearch && matchesEquipment
    })
  }, [venues, searchTerm, selectedEquipmentIds])

  // 会場選択の切り替え
  const handleVenueToggle = (venueId: number) => {
    const isSelected = selectedVenues.includes(venueId)
    
    if (isSelected) {
      // 選択解除
      const newSelectedVenues = selectedVenues.filter(id => id !== venueId)
      const newVenueOrder = venueOrder.filter(id => id !== venueId)
      onChange({ ids: newSelectedVenues, order: newVenueOrder })
    } else {
      // 選択追加
      const newSelectedVenues = [...selectedVenues, venueId]
      const newVenueOrder = [...venueOrder, venueId]
      onChange({ ids: newSelectedVenues, order: newVenueOrder })
    }
  }

  // 優先順位の移動
  const moveVenueInOrder = (venueId: number, direction: 'up' | 'down') => {
    const currentIndex = venueOrder.indexOf(venueId)
    if (currentIndex === -1) return

    const newOrder = [...venueOrder]
    
    if (direction === 'up' && currentIndex > 0) {
      // 上に移動
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]]
    } else if (direction === 'down' && currentIndex < newOrder.length - 1) {
      // 下に移動
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]]
    }

    onChange({ ids: selectedVenues, order: newOrder })
  }

  // ドラッグ&ドロップ処理
  const handleDragStart = (e: React.DragEvent, venueId: number) => {
    setDraggedVenueId(venueId)
    e.dataTransfer.setData('text/plain', venueId.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetVenueId: number) => {
    e.preventDefault()
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'))
    
    if (draggedId === targetVenueId) return

    const newOrder = [...venueOrder]
    const draggedIndex = newOrder.indexOf(draggedId)
    const targetIndex = newOrder.indexOf(targetVenueId)

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // 配列から要素を削除して新しい位置に挿入
      const [draggedItem] = newOrder.splice(draggedIndex, 1)
      newOrder.splice(targetIndex, 0, draggedItem)

      onChange({ ids: selectedVenues, order: newOrder })
    }
    
    setDraggedVenueId(null)
  }

  // 設備フィルタの切り替え
  const handleEquipmentFilter = (equipmentId: number) => {
    const isSelected = selectedEquipmentIds.includes(equipmentId)
    
    if (isSelected) {
      setSelectedEquipmentIds(prev => prev.filter(id => id !== equipmentId))
    } else {
      setSelectedEquipmentIds(prev => [...prev, equipmentId])
    }
  }

  // フィルタクリア
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedEquipmentIds([])
  }

  // 設備名の取得
  const getEquipmentName = (equipmentId: number) => {
    return equipmentTypes.find(eq => eq.id === equipmentId)?.name || `設備${equipmentId}`
  }

  // 選択された会場の順序付きリスト
  const orderedSelectedVenues = useMemo(() => {
    return venueOrder.map(id => venues.find(venue => venue.id === id)).filter(Boolean) as Venue[]
  }, [venueOrder, venues])

  return (
    <div className="space-y-6">
      {/* ヘッダー・統計情報 */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">会場選択</h3>
          <p className="text-sm text-gray-600">
            {selectedVenues.length > 0 ? `${selectedVenues.length}件選択中` : '会場が選択されていません'}
          </p>
        </div>
        {(searchTerm || selectedEquipmentIds.length > 0) && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-2" />
            フィルタクリア
          </Button>
        )}
      </div>

      {/* 検索・フィルタ */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="会場名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Collapsible open={isEquipmentFilterOpen} onOpenChange={setIsEquipmentFilterOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                設備でフィルタ
                {selectedEquipmentIds.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedEquipmentIds.length}
                  </Badge>
                )}
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-2">
                  {equipmentTypes.map(equipment => (
                    <div key={equipment.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`equipment-${equipment.id}`}
                        checked={selectedEquipmentIds.includes(equipment.id)}
                        onCheckedChange={() => handleEquipmentFilter(equipment.id)}
                      />
                      <label
                        htmlFor={`equipment-${equipment.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {equipment.name}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* 会場一覧 */}
      <div className="space-y-4">
        {filteredVenues.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              検索条件に一致する会場がありません
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredVenues.map(venue => (
              <Card key={venue.id} className="transition-colors hover:bg-gray-50">
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={`venue-${venue.id}`}
                      checked={selectedVenues.includes(venue.id)}
                      onCheckedChange={() => handleVenueToggle(venue.id)}
                      aria-label={venue.name}
                    />
                    <div className="flex-1 space-y-2">
                      <div>
                        <label
                          htmlFor={`venue-${venue.id}`}
                          className="text-lg font-medium cursor-pointer"
                        >
                          {venue.name}
                        </label>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>収容人数: {venue.capacity}人</p>
                        <p>場所: {venue.location}</p>
                      </div>
                      {venue.equipmentIds.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {venue.equipmentIds.map(equipId => (
                            <Badge key={equipId} variant="outline" className="text-xs">
                              {getEquipmentName(equipId)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 優先順位設定 */}
      {selectedVenues.length > 0 && (
        <Collapsible open={isPriorityOpen} onOpenChange={setIsPriorityOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              優先順位設定
              <ChevronDown className="w-4 h-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">選択済み会場の優先順位</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {orderedSelectedVenues.map((venue, index) => (
                    <div
                      key={venue.id}
                      data-testid={`draggable-venue-${venue.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, venue.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, venue.id)}
                      className={`flex items-center justify-between p-3 border rounded-md cursor-move transition-colors ${
                        draggedVenueId === venue.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <span className="font-medium">{venue.name}</span>
                        <span className="text-sm text-gray-500">({venue.location})</span>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveVenueInOrder(venue.id, 'up')}
                          disabled={index === 0}
                          data-testid={`move-up-${venue.id}`}
                          aria-label={`${venue.name}を上に移動`}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveVenueInOrder(venue.id, 'down')}
                          disabled={index === orderedSelectedVenues.length - 1}
                          data-testid={`move-down-${venue.id}`}
                          aria-label={`${venue.name}を下に移動`}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}