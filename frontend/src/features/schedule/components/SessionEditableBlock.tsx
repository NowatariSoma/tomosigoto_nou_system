'use client'

import React, { useRef, useCallback, useState } from 'react'
import { Session } from '../../../../types/session'
import { formatSessionTime, getSessionDuration } from '../utils/sessionHelpers'
import { useSessionEdit } from '../context/SessionEditContext'
import { cn } from '../../../lib/utils'

interface SessionEditableBlockProps {
  session: Session
  isSelected: boolean
  onSelect: (sessionId: string) => void
  onStartDrag: (sessionId: string, event: MouseEvent | TouchEvent) => void
  onResize: (sessionId: string, type: 'start' | 'end', time: Date) => void
  style?: React.CSSProperties
  className?: string
}

export const SessionEditableBlock: React.FC<SessionEditableBlockProps> = ({
  session,
  isSelected,
  onSelect,
  onStartDrag,
  onResize,
  style,
  className
}) => {
  const blockRef = useRef<HTMLDivElement>(null)
  const [resizeType, setResizeType] = useState<'none' | 'start' | 'end'>('none')
  const [isDragging, setIsDragging] = useState(false)
  const { openSessionEdit, draggingSessionId } = useSessionEdit()

  const duration = getSessionDuration(session.start, session.end)
  const isBeingDragged = draggingSessionId === session.id

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return // 左クリックのみ

    const rect = blockRef.current?.getBoundingClientRect()
    if (!rect) return

    const relativeY = e.clientY - rect.top
    const resizeThreshold = 8 // ピクセル

    // リサイズ領域の判定
    if (relativeY <= resizeThreshold) {
      setResizeType('start')
      handleResizeStart('start', e.nativeEvent)
    } else if (relativeY >= rect.height - resizeThreshold) {
      setResizeType('end')
      handleResizeStart('end', e.nativeEvent)
    } else {
      // ドラッグ開始
      setIsDragging(true)
      onSelect(session.id)
      onStartDrag(session.id, e.nativeEvent)
    }
  }, [session.id, onSelect, onStartDrag])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    const rect = blockRef.current?.getBoundingClientRect()
    if (!rect) return

    const relativeY = touch.clientY - rect.top
    const resizeThreshold = 12 // タッチの場合は少し大きめ

    if (relativeY <= resizeThreshold) {
      setResizeType('start')
      handleResizeStart('start', e.nativeEvent)
    } else if (relativeY >= rect.height - resizeThreshold) {
      setResizeType('end')
      handleResizeStart('end', e.nativeEvent)
    } else {
      setIsDragging(true)
      onSelect(session.id)
      onStartDrag(session.id, e.nativeEvent)
    }
  }, [session.id, onSelect, onStartDrag])

  const handleResizeStart = useCallback((type: 'start' | 'end', event: MouseEvent | TouchEvent) => {
    event.preventDefault()
    setResizeType(type)

    let startY: number
    if ('touches' in event) {
      startY = event.touches[0].clientY
    } else {
      startY = event.clientY
    }

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const deltaY = currentY - startY
      
      // リサイズの計算（30分単位でスナップ）
      const minutesPerPixel = 2 // 1ピクセル = 2分として計算
      const deltaMinutes = Math.round(deltaY / minutesPerPixel / 30) * 30

      if (type === 'start') {
        const newStart = new Date(session.start.getTime() + deltaMinutes * 60 * 1000)
        if (newStart < session.end) {
          onResize(session.id, 'start', newStart)
        }
      } else {
        const newEnd = new Date(session.end.getTime() + deltaMinutes * 60 * 1000)
        if (newEnd > session.start) {
          onResize(session.id, 'end', newEnd)
        }
      }
    }

    const handleMouseUp = () => {
      setResizeType('none')
      document.removeEventListener('mousemove', handleMouseMove as any)
      document.removeEventListener('touchmove', handleMouseMove as any)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchend', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove as any)
    document.addEventListener('touchmove', handleMouseMove as any)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchend', handleMouseUp)
  }, [session.id, session.start, session.end, onResize])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDragging || resizeType !== 'none') {
      setIsDragging(false)
      return
    }

    // クリックのみの場合は選択
    onSelect(session.id)
  }, [isDragging, resizeType, session.id, onSelect])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    openSessionEdit(session.id)
  }, [session.id, openSessionEdit])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onSelect(session.id)
    // コンテキストメニューの実装は別途
  }, [session.id, onSelect])

  // カーソルスタイルの決定
  const getCursorStyle = (): string => {
    if (isBeingDragged) return 'grabbing'
    if (resizeType === 'start' || resizeType === 'end') return 'ns-resize'
    return 'grab'
  }

  return (
    <div
      ref={blockRef}
      style={{
        backgroundColor: session.color,
        cursor: getCursorStyle(),
        ...style
      }}
      className={cn(
        'relative rounded-md border-2 border-transparent p-2 text-white shadow-sm transition-all duration-200',
        'hover:shadow-md',
        'select-none',
        {
          'border-blue-400 shadow-lg': isSelected,
          'opacity-70 transform scale-95': isBeingDragged,
          'hover:border-blue-300': !isSelected && !isBeingDragged,
        },
        className
      )}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      role="button"
      tabIndex={0}
      aria-label={`セッション: ${session.title}, ${formatSessionTime(session.start, session.end)}`}
    >
      {/* リサイズハンドル（上） */}
      <div
        className={cn(
          'absolute left-0 right-0 top-0 h-2 cursor-ns-resize opacity-0 transition-opacity hover:opacity-100',
          { 'opacity-100': resizeType === 'start' }
        )}
        style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
      />

      {/* メインコンテンツ */}
      <div className="pointer-events-none">
        <div className="text-sm font-semibold truncate">
          {session.title}
        </div>
        <div className="text-xs opacity-90 mt-1">
          {formatSessionTime(session.start, session.end)}
        </div>
        <div className="text-xs opacity-80">
          {session.partName}
        </div>
        {session.instructorName && (
          <div className="text-xs opacity-80">
            {session.instructorName}
          </div>
        )}
        <div className="text-xs opacity-70 mt-1">
          {session.venueName} • {duration}分
        </div>
      </div>

      {/* リサイズハンドル（下） */}
      <div
        className={cn(
          'absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize opacity-0 transition-opacity hover:opacity-100',
          { 'opacity-100': resizeType === 'end' }
        )}
        style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
      />

      {/* 選択状態のインジケータ */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
      )}

      {/* ドラッグ中のオーバーレイ */}
      {isBeingDragged && (
        <div className="absolute inset-0 bg-black bg-opacity-20 rounded-md" />
      )}
    </div>
  )
}