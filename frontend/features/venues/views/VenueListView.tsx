'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useVenues } from '../hooks/useVenues'
import { useDebounce } from '../hooks/useDebounce'
import { VenueSearch } from '../components/VenueSearch'
import { VenueFilter } from '../components/VenueFilter'
import { VenueGrid } from '../components/VenueGrid'
import { VenueList } from '../components/VenueList'
import { Button } from '@/components/ui/forms/button'
import { Card } from '@/components/ui/layout/card'
import { Grid, List, ChevronLeft, ChevronRight } from 'lucide-react'
import type { VenueFilters } from '@/types/venue'

type ViewMode = 'grid' | 'list'

export function VenueListView() {
  const router = useRouter()
  const {
    venues,
    loading,
    error,
    totalCount,
    currentPage,
    hasNextPage,
    hasPrevPage,
    fetchVenues,
    setPage,
  } = useVenues()

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<VenueFilters>({})

  // デバウンス機能: 検索語句を300ms遅延させる
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // 初期データ読み込み
  useEffect(() => {
    fetchVenues({})
  }, [fetchVenues])

  // デバウンスされた検索語句でAPI呼び出し
  useEffect(() => {
    if (debouncedSearchTerm !== '') {
      const newFilters = { ...filters, searchTerm: debouncedSearchTerm }
      setFilters(newFilters)
      fetchVenues({ filters: newFilters })
    } else if (searchTerm === '') {
      // 検索語句が空の場合も検索をクリア
      const newFilters = { ...filters }
      delete newFilters.searchTerm
      setFilters(newFilters)
      fetchVenues({ filters: newFilters })
    }
  }, [debouncedSearchTerm, filters, fetchVenues, searchTerm])

  // 検索・フィルタ変更時の処理
  const handleSearchChange = useCallback(
    (term: string) => {
      setSearchTerm(term)
      // API呼び出しはuseEffectで実行される
    },
    []
  )

  const handleFilterChange = useCallback(
    (newFilters: VenueFilters) => {
      const combinedFilters = { ...filters, ...newFilters, searchTerm: debouncedSearchTerm }
      setFilters(combinedFilters)
      fetchVenues({ filters: combinedFilters })
    },
    [filters, debouncedSearchTerm, fetchVenues]
  )

  // 表示モード切り替え
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode)
  }, [])

  // 会場選択処理
  const handleVenueClick = useCallback(
    (venueId: number) => {
      router.push(`/venues/${venueId}`)
    },
    [router]
  )

  // ページ変更処理
  const handlePageChange = useCallback(
    (page: number) => {
      setPage(page)
      fetchVenues({ filters })
    },
    [setPage, fetchVenues, filters]
  )

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <Card className="p-6">
            <div className="text-red-600">
              エラーが発生しました: {error.message}
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">会場一覧</h1>
        <p className="text-gray-600">
          利用可能な練習会場を検索・閲覧できます（{totalCount}件）
        </p>
      </div>

      {/* 検索・フィルタセクション */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <VenueSearch onSearchChange={handleSearchChange} />
          </div>
          <div className="lg:w-80">
            <VenueFilter onFilterChange={handleFilterChange} />
          </div>
        </div>

        {/* 表示モード切り替え */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              className="flex items-center gap-2"
            >
              <Grid className="h-4 w-4" />
              グリッド表示
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              リスト表示
            </Button>
          </div>

          {/* ページネーション（上部） */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPrevPage}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              前のページ
            </Button>
            <span className="text-sm text-gray-600">
              ページ {currentPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNextPage}
              className="flex items-center gap-1"
            >
              次のページ
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 会場一覧表示 */}
      <div className="mb-6">
        {venues.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              条件に該当する会場が見つかりませんでした。
            </div>
          </Card>
        ) : viewMode === 'grid' ? (
          <VenueGrid venues={venues} onVenueClick={handleVenueClick} />
        ) : (
          <VenueList venues={venues} onVenueClick={handleVenueClick} />
        )}
      </div>

      {/* ページネーション（下部） */}
      {venues.length > 0 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPrevPage}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              前のページ
            </Button>
            <span className="px-4 py-2 text-sm text-gray-600">
              ページ {currentPage}
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNextPage}
              className="flex items-center gap-1"
            >
              次のページ
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}