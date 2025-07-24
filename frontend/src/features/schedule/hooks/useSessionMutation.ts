'use client'

import { useState, useCallback } from 'react'
import { Session, SessionCreateData, SessionUpdateData } from '../../../../types/session'
import { supabase } from '../../../lib/supabase'

interface UseSessionMutationResult {
  createSession: (data: SessionCreateData) => Promise<Session>
  updateSession: (id: string, data: Partial<SessionUpdateData>) => Promise<Session>
  deleteSession: (id: string) => Promise<boolean>
  isLoading: boolean
  error: Error | null
}

export const useSessionMutation = (): UseSessionMutationResult => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createSession = useCallback(async (data: SessionCreateData): Promise<Session> => {
    setIsLoading(true)
    setError(null)

    try {
      const sessionData = {
        title: data.title,
        start: data.start.toISOString(),
        end: data.end.toISOString(),
        part_id: data.partId,
        instructor_id: data.instructorId || null,
        venue_id: data.venueId,
        description: data.description || null,
        status: 'scheduled' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: result, error: supabaseError } = await supabase
        .from('practice_sessions')
        .insert([sessionData])
        .select(`
          *,
          parts:part_id (id, name),
          venues:venue_id (id, name),
          instructors:instructor_id (id, name)
        `)
        .single()

      if (supabaseError) {
        throw new Error(`セッション作成に失敗しました: ${supabaseError.message}`)
      }

      if (!result) {
        throw new Error('セッション作成に失敗しました: データが返されませんでした')
      }

      // Supabaseのレスポンスをフロントエンドの型に変換
      const session: Session = {
        id: result.id,
        title: result.title,
        start: new Date(result.start),
        end: new Date(result.end),
        partId: result.part_id,
        partName: result.parts?.name || 'Unknown',
        instructorId: result.instructor_id,
        instructorName: result.instructors?.name,
        venueId: result.venue_id,
        venueName: result.venues?.name || 'Unknown',
        description: result.description,
        status: result.status,
        color: getSessionColorByPart(result.part_id),
        createdAt: new Date(result.created_at),
        updatedAt: new Date(result.updated_at)
      }

      return session
    } catch (err) {
      const error = err instanceof Error ? err : new Error('不明なエラーが発生しました')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateSession = useCallback(async (id: string, data: Partial<SessionUpdateData>): Promise<Session> => {
    setIsLoading(true)
    setError(null)

    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      // 更新するフィールドのみを含める
      if (data.title !== undefined) updateData.title = data.title
      if (data.start !== undefined) updateData.start = data.start.toISOString()
      if (data.end !== undefined) updateData.end = data.end.toISOString()
      if (data.partId !== undefined) updateData.part_id = data.partId
      if (data.instructorId !== undefined) updateData.instructor_id = data.instructorId
      if (data.venueId !== undefined) updateData.venue_id = data.venueId
      if (data.description !== undefined) updateData.description = data.description
      if (data.status !== undefined) updateData.status = data.status

      const { data: result, error: supabaseError } = await supabase
        .from('practice_sessions')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          parts:part_id (id, name),
          venues:venue_id (id, name),
          instructors:instructor_id (id, name)
        `)
        .single()

      if (supabaseError) {
        throw new Error(`セッション更新に失敗しました: ${supabaseError.message}`)
      }

      if (!result) {
        throw new Error('セッション更新に失敗しました: データが返されませんでした')
      }

      // Supabaseのレスポンスをフロントエンドの型に変換
      const session: Session = {
        id: result.id,
        title: result.title,
        start: new Date(result.start),
        end: new Date(result.end),
        partId: result.part_id,
        partName: result.parts?.name || 'Unknown',
        instructorId: result.instructor_id,
        instructorName: result.instructors?.name,
        venueId: result.venue_id,
        venueName: result.venues?.name || 'Unknown',
        description: result.description,
        status: result.status,
        color: getSessionColorByPart(result.part_id),
        createdAt: new Date(result.created_at),
        updatedAt: new Date(result.updated_at)
      }

      return session
    } catch (err) {
      const error = err instanceof Error ? err : new Error('不明なエラーが発生しました')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteSession = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const { error: supabaseError } = await supabase
        .from('practice_sessions')
        .delete()
        .eq('id', id)

      if (supabaseError) {
        throw new Error(`セッション削除に失敗しました: ${supabaseError.message}`)
      }

      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error('不明なエラーが発生しました')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    createSession,
    updateSession,
    deleteSession,
    isLoading,
    error
  }
}

// パートIDに基づいて色を取得するヘルパー関数
const getSessionColorByPart = (partId: number): string => {
  const colors = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // green
    '#F59E0B', // amber
    '#8B5CF6', // violet
    '#F97316', // orange
    '#06B6D4', // cyan
    '#84CC16'  // lime
  ]
  
  return colors[partId % colors.length] || colors[0]
}