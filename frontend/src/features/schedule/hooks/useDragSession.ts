'use client'

import { useState, useCallback, useRef } from 'react'
import { DragPreview } from '../../../../types/session'
import { calculateNewSessionTime, snapToGrid } from '../utils/sessionHelpers'

interface DragSessionConfig {
  onSessionMove: (sessionId: string, newStart: Date, newEnd: Date) => Promise<boolean>
  gridConfig: {
    cellHeight: number
    minutesPerCell: number
  }
  snapMinutes?: number
}

interface DragState {
  sessionId: string
  initialPosition: { x: number; y: number }
  initialStart: Date
  initialEnd: Date
  currentOffset: { x: number; y: number }
}

export const useDragSession = (config: DragSessionConfig) => {
  const [draggingSessionId, setDraggingSessionId] = useState<string | null>(null)
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const { onSessionMove, gridConfig, snapMinutes = 30 } = config

  const startDrag = useCallback((
    sessionId: string,
    initialPosition: { x: number; y: number },
    sessionStart: Date,
    sessionEnd: Date,
    event: MouseEvent | TouchEvent
  ) => {
    event.preventDefault()
    
    setDraggingSessionId(sessionId)
    dragStateRef.current = {
      sessionId,
      initialPosition,
      initialStart: sessionStart,
      initialEnd: sessionEnd,
      currentOffset: { x: 0, y: 0 }
    }

    setDragPreview({
      sessionId,
      start: sessionStart,
      end: sessionEnd
    })

    // イベントリスナーを追加
    const handleMouseMove = (e: MouseEvent) => handleDrag(e)
    const handleTouchMove = (e: TouchEvent) => handleDrag(e)
    const handleMouseUp = (e: MouseEvent) => endDrag(e)
    const handleTouchEnd = (e: TouchEvent) => endDrag(e)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchend', handleTouchEnd)

    // クリーンアップ関数をセット
    const cleanup = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchend', handleTouchEnd)
    }

    // dragStateRef に cleanup を保存
    if (dragStateRef.current) {
      (dragStateRef.current as any).cleanup = cleanup
    }
  }, [])

  const handleDrag = useCallback((event: MouseEvent | TouchEvent) => {
    if (!dragStateRef.current) return

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

    const currentOffset = {
      x: clientX - dragStateRef.current.initialPosition.x,
      y: clientY - dragStateRef.current.initialPosition.y
    }

    dragStateRef.current.currentOffset = currentOffset

    // 新しい時間を計算
    const { start: newStart, end: newEnd } = calculateNewSessionTime(
      dragStateRef.current.initialStart,
      dragStateRef.current.initialEnd,
      currentOffset,
      gridConfig
    )

    // プレビューを更新
    setDragPreview({
      sessionId: dragStateRef.current.sessionId,
      start: newStart,
      end: newEnd
    })
  }, [gridConfig])

  const endDrag = useCallback(async (event: MouseEvent | TouchEvent) => {
    if (!dragStateRef.current) return

    const dragState = dragStateRef.current
    const { sessionId, initialStart, initialEnd, currentOffset } = dragState

    // クリーンアップ
    if ((dragState as any).cleanup) {
      (dragState as any).cleanup()
    }

    // 移動距離が小さい場合はドラッグとみなさない
    const MIN_DRAG_DISTANCE = 10
    const dragDistance = Math.sqrt(
      currentOffset.x * currentOffset.x + currentOffset.y * currentOffset.y
    )

    if (dragDistance < MIN_DRAG_DISTANCE) {
      // ドラッグとみなさない場合は元の状態に戻す
      setDraggingSessionId(null)
      setDragPreview(null)
      dragStateRef.current = null
      return
    }

    // 新しい時間を計算
    const { start: newStart, end: newEnd } = calculateNewSessionTime(
      initialStart,
      initialEnd,
      currentOffset,
      gridConfig
    )

    try {
      // セッション移動を実行
      const success = await onSessionMove(sessionId, newStart, newEnd)
      
      if (!success) {
        // 移動に失敗した場合は元の位置に戻すビジュアルフィードバックを表示
        console.warn('Session move failed, reverting to original position')
      }
    } catch (error) {
      console.error('Error moving session:', error)
    } finally {
      // 状態をクリア
      setDraggingSessionId(null)
      setDragPreview(null)
      dragStateRef.current = null
    }
  }, [onSessionMove, gridConfig])

  const cancelDrag = useCallback(() => {
    if (dragStateRef.current) {
      // クリーンアップ
      if ((dragStateRef.current as any).cleanup) {
        (dragStateRef.current as any).cleanup()
      }
      
      setDraggingSessionId(null)
      setDragPreview(null)
      dragStateRef.current = null
    }
  }, [])

  return {
    startDrag,
    handleDrag,
    endDrag,
    cancelDrag,
    draggingSessionId,
    dragPreview,
    isDragging: draggingSessionId !== null
  }
}