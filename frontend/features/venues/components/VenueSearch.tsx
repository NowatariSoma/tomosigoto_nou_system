'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/inputs/input'
import { Button } from '@/components/ui/forms/button'

interface VenueSearchProps {
  onSearchChange: (searchTerm: string) => void
  initialValue?: string
  placeholder?: string
  debounceMs?: number
}

export function VenueSearch({
  onSearchChange,
  initialValue = '',
  placeholder = '会場名や地域で検索...',
  debounceMs = 500,
}: VenueSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue)

  // 入力値変更処理
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    onSearchChange(value)
  }, [onSearchChange])

  // クリア処理
  const handleClear = useCallback(() => {
    setSearchTerm('')
    onSearchChange('')
  }, [onSearchChange])

  return (
    <div className="relative">
      <div className="relative">
        {/* 検索アイコン */}
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
          data-testid="search-icon"
        />
        
        {/* 検索入力フィールド */}
        <Input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        
        {/* クリアボタン */}
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
            data-testid="clear-button"
          >
            <X className="h-4 w-4 text-gray-400" />
          </Button>
        )}
      </div>
    </div>
  )
}