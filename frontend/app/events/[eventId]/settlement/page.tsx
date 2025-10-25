'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { eventsService } from '@/features/events/services/events-service'
import type { Event, EventSettlement, EventSettlementSummary } from '@/features/events/types'

export default function EventSettlementPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [settlements, setSettlements] = useState<EventSettlement[]>([])
  const [summary, setSummary] = useState<EventSettlementSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // イベント情報、決済情報、サマリーを並行取得
        const [eventData, settlementsData, summaryData] = await Promise.all([
          eventsService.getEvent(eventId),
          eventsService.getEventSettlements(eventId),
          eventsService.getEventSettlementSummary(eventId),
        ])

        setEvent(eventData)
        setSettlements(settlementsData)
        setSummary(summaryData)
      } catch (err) {
        console.error('Failed to fetch event settlement data:', err)
        setError('イベント決済情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

  const getStatusBadge = (status?: string) => {
    const statusMap = {
      pending: { label: '未払い', className: 'bg-yellow-100 text-yellow-800' },
      paid: { label: '支払い済み', className: 'bg-green-100 text-green-800' },
      partial: { label: '一部支払い', className: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'キャンセル', className: 'bg-gray-100 text-gray-800' },
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* イベント情報 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
        <p className="text-gray-600 mb-4">
          {formatDate(event.event_date)}
          {event.start_time && event.end_time && (
            <span className="ml-2">
              {event.start_time} - {event.end_time}
            </span>
          )}
        </p>
        {event.description && <p className="text-gray-700 mb-4">{event.description}</p>}
      </div>

      {/* 決済サマリー */}
      {summary && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">決済サマリー</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">総額</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.total_amount)}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">支払い済み</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.total_paid)}
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">未払い</div>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(summary.total_pending)}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">決済件数</div>
              <div className="text-xl font-bold">{summary.settlement_count}件</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">支払い済み件数</div>
              <div className="text-xl font-bold text-green-600">{summary.paid_count}件</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">未払い件数</div>
              <div className="text-xl font-bold text-yellow-600">{summary.pending_count}件</div>
            </div>
          </div>
        </div>
      )}

      {/* 決済リスト */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">決済一覧</h2>
        {settlements.length === 0 ? (
          <p className="text-gray-500 text-center py-8">決済情報がありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    支払済額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    支払方法
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    支払日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    備考
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settlements.map((settlement) => (
                  <tr key={settlement.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(settlement.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatCurrency(settlement.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatCurrency(settlement.paid_amount || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {settlement.payment_method || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {settlement.payment_date
                        ? new Date(settlement.payment_date).toLocaleDateString('ja-JP')
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate">{settlement.notes || '-'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
