'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { eventsService } from '@/features/events/services/events-service'
import type { Event } from '@/features/events/types'

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return

    const fetchEvent = async () => {
      try {
        setLoading(true)
        setError(null)
        const eventData = await eventsService.getEvent(eventId)
        setEvent(eventData)
      } catch (err) {
        console.error('Failed to fetch event:', err)
        setError('イベント情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

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

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">イベントが見つかりません</div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: event.currency || 'JPY',
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
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          {getStatusBadge(event.status)}
        </div>

        {/* イベント情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-2">日時</h2>
            <p className="text-lg">
              {formatDate(event.event_date)}
              {event.start_time && event.end_time && (
                <span className="ml-2 text-gray-600">
                  {event.start_time} - {event.end_time}
                </span>
              )}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-2">種類</h2>
            <p className="text-lg">{getEventTypeLabel(event.event_type)}</p>
          </div>

          {event.total_amount !== undefined && event.total_amount > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 mb-2">金額</h2>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(event.total_amount)}
              </p>
            </div>
          )}
        </div>

        {/* 説明 */}
        {event.description && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">説明</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            onClick={() => router.push(`/events/${eventId}/settlement`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            決済情報を見る
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  )
}
