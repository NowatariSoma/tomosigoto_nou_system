'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { eventsService } from '@/features/events/services/events-service'
import type { Event } from '@/features/events/types'

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)
        const eventsData = await eventsService.getEvents()
        setEvents(eventsData)
      } catch (err) {
        console.error('Failed to fetch events:', err)
        setError('イベント一覧の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number, currency: string = 'JPY') => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const getEventTypeLabel = (type?: string) => {
    const typeMap = {
      practice: '練習',
      performance: '公演',
      meeting: 'ミーティング',
      other: 'その他',
    }
    return typeMap[type as keyof typeof typeMap] || type || '不明'
  }

  const getStatusBadge = (status?: string) => {
    const statusMap = {
      active: { label: 'アクティブ', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'キャンセル', className: 'bg-red-100 text-red-800' },
      completed: { label: '完了', className: 'bg-blue-100 text-blue-800' },
    }

    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status || '不明',
      className: 'bg-gray-100 text-gray-800',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">イベント一覧</h1>
        <p className="text-gray-600">すべてのイベントを表示しています</p>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">イベントがありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/events/${event.id}`)}
            >
              <div className="p-6">
                {/* ヘッダー */}
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-bold flex-1 mr-2">{event.title}</h2>
                  {getStatusBadge(event.status)}
                </div>

                {/* 日時 */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600">{formatDate(event.event_date)}</p>
                  {event.start_time && event.end_time && (
                    <p className="text-sm text-gray-500">
                      {event.start_time} - {event.end_time}
                    </p>
                  )}
                </div>

                {/* 種類 */}
                <div className="mb-3">
                  <span className="text-sm text-gray-600">
                    {getEventTypeLabel(event.event_type)}
                  </span>
                </div>

                {/* 説明 */}
                {event.description && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">{event.description}</p>
                )}

                {/* 金額 */}
                {event.total_amount !== undefined && event.total_amount > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(event.total_amount, event.currency)}
                    </p>
                  </div>
                )}

                {/* アクションボタン */}
                <div className="mt-4 pt-4 border-t flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/events/${event.id}/settlement`)
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    決済情報
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/events/${event.id}`)
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                  >
                    詳細
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
