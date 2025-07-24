'use client'

import React, { useState, useCallback } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/forms/button'
import { Input } from '@/components/ui/inputs/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card'
import { Separator } from '@/components/ui/layout/separator'
import type { VenueFilters } from '@/types/venue'

interface VenueFilterProps {
  onFilterChange: (filters: VenueFilters) => void
  initialFilters?: VenueFilters
}

const areaOptions = [
  { value: '', label: '全てのエリア' },
  { value: '渋谷区', label: '渋谷区' },
  { value: '新宿区', label: '新宿区' },
  { value: '港区', label: '港区' },
  { value: '中央区', label: '中央区' },
  { value: '千代田区', label: '千代田区' },
]

export function VenueFilter({ onFilterChange, initialFilters = {} }: VenueFilterProps) {
  const [filters, setFilters] = useState<VenueFilters>(initialFilters)

  const handleFilterUpdate = useCallback((newFilters: Partial<VenueFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFilterChange(updatedFilters)
  }, [filters, onFilterChange])

  const handleCapacityChange = useCallback((field: 'minCapacity' | 'maxCapacity', value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10)
    if (value !== '' && (isNaN(numValue!) || numValue! < 0)) return
    
    handleFilterUpdate({ [field]: numValue })
  }, [handleFilterUpdate])

  const handleAreaChange = useCallback((value: string) => {
    handleFilterUpdate({ area: value === '' ? undefined : value })
  }, [handleFilterUpdate])

  const handlePriceRangeChange = useCallback((field: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10)
    if (value !== '' && (isNaN(numValue!) || numValue! < 0)) return

    const currentPriceRange = filters.priceRange || {}
    const newPriceRange = { ...currentPriceRange, [field]: numValue }
    
    // 両方が undefined の場合は priceRange 自体を undefined にする
    if (newPriceRange.min === undefined && newPriceRange.max === undefined) {
      handleFilterUpdate({ priceRange: undefined })
    } else {
      handleFilterUpdate({ priceRange: newPriceRange })
    }
  }, [filters.priceRange, handleFilterUpdate])

  const handleClear = useCallback(() => {
    const emptyFilters: VenueFilters = {}
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }, [onFilterChange])

  const hasActiveFilters = Object.values(filters).some(value => {
    if (value === undefined || value === '') return false
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== undefined && v !== '')
    }
    return true
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          フィルタ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 収容人数 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">収容人数</label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="最小収容人数"
              value={filters.minCapacity || ''}
              onChange={(e) => handleCapacityChange('minCapacity', e.target.value)}
              min="0"
              className="text-sm"
            />
            <Input
              type="number"
              placeholder="最大収容人数"
              value={filters.maxCapacity || ''}
              onChange={(e) => handleCapacityChange('maxCapacity', e.target.value)}
              min="0"
              className="text-sm"
            />
          </div>
        </div>

        <Separator />

        {/* エリア */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">エリア</label>
          <Select
            value={filters.area || ''}
            onValueChange={handleAreaChange}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="エリアを選択" />
            </SelectTrigger>
            <SelectContent>
              {areaOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* 料金範囲 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">料金（時間あたり）</label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="最低料金"
              value={filters.priceRange?.min || ''}
              onChange={(e) => handlePriceRangeChange('min', e.target.value)}
              min="0"
              className="text-sm"
            />
            <Input
              type="number"
              placeholder="最高料金"
              value={filters.priceRange?.max || ''}
              onChange={(e) => handlePriceRangeChange('max', e.target.value)}
              min="0"
              className="text-sm"
            />
          </div>
        </div>

        {/* クリアボタン */}
        {hasActiveFilters && (
          <>
            <Separator />
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="w-full flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              クリア
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}