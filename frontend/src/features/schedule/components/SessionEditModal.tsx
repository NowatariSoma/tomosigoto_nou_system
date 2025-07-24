'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Session, SessionFormData } from '../../../../types/session'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Textarea } from '../../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../ui/alert-dialog'
import { useSessionMutation } from '../hooks/useSessionMutation'
import { useSessionValidation } from '../hooks/useSessionValidation'
import { formatDateForInput, formatTimeForInput } from '../utils/dateHelpers'
import { Loader2, Trash2 } from 'lucide-react'

interface SessionEditModalProps {
  isOpen: boolean
  session?: Session
  onClose: () => void
  onSave: (sessionData: SessionFormData) => Promise<void>
  onDelete?: (sessionId: string) => Promise<void>
  venues: Array<{ id: string; name: string }>
  instructors: Array<{ id: string; name: string }>
  parts: Array<{ id: number; name: string }>
}

interface FormErrors {
  [key: string]: string
}

export const SessionEditModal: React.FC<SessionEditModalProps> = ({
  isOpen,
  session,
  onClose,
  onSave,
  onDelete,
  venues,
  instructors,
  parts
}) => {
  const [formData, setFormData] = useState<SessionFormData>({
    title: '',
    start: new Date(),
    end: new Date(),
    partId: 0,
    instructorId: '',
    venueId: '',
    description: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // セッションデータからフォームデータを初期化
  useEffect(() => {
    if (session) {
      setFormData({
        title: session.title,
        start: session.start,
        end: session.end,
        partId: session.partId,
        instructorId: session.instructorId || '',
        venueId: session.venueId,
        description: session.description || ''
      })
    } else {
      // 新規作成時のデフォルト値
      const now = new Date()
      const start = new Date(now.getTime() + 60 * 60 * 1000) // 1時間後
      const end = new Date(start.getTime() + 60 * 60 * 1000) // さらに1時間後

      setFormData({
        title: '',
        start,
        end,
        partId: 0,
        instructorId: '',
        venueId: venues[0]?.id || '',
        description: ''
      })
    }
    setErrors({})
  }, [session, venues, isOpen])

  const handleInputChange = useCallback((field: keyof SessionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // 該当フィールドのエラーをクリア
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  const handleDateTimeChange = useCallback((field: 'start' | 'end', date: string, time: string) => {
    if (!date || !time) return

    const newDateTime = new Date(`${date}T${time}`)
    handleInputChange(field, newDateTime)

    // 開始時刻が変更された場合、終了時刻も自動調整
    if (field === 'start') {
      const duration = formData.end.getTime() - formData.start.getTime()
      const newEnd = new Date(newDateTime.getTime() + duration)
      handleInputChange('end', newEnd)
    }
  }, [formData.start, formData.end, handleInputChange])

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    // 必須フィールドの検証
    if (!formData.title.trim()) {
      newErrors.title = 'タイトルを入力してください'
    } else if (formData.title.length > 100) {
      newErrors.title = 'タイトルは100文字以内で入力してください'
    }

    if (!formData.partId || formData.partId <= 0) {
      newErrors.partId = 'パートを選択してください'
    }

    if (!formData.venueId) {
      newErrors.venueId = '会場を選択してください'
    }

    // 時間の検証
    if (formData.start >= formData.end) {
      newErrors.time = '開始時刻は終了時刻より前である必要があります'
    }

    const duration = (formData.end.getTime() - formData.start.getTime()) / (1000 * 60)
    if (duration < 30) {
      newErrors.time = 'セッションは最低30分必要です'
    }

    if (duration > 8 * 60) {
      newErrors.time = 'セッションは最大8時間までです'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('セッション保存エラー:', error)
      setErrors({ submit: 'セッションの保存に失敗しました' })
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm, onSave, onClose])

  const handleDelete = useCallback(async () => {
    if (!session || !onDelete) return

    setIsSubmitting(true)
    try {
      await onDelete(session.id)
      setShowDeleteDialog(false)
      onClose()
    } catch (error) {
      console.error('セッション削除エラー:', error)
      setErrors({ submit: 'セッションの削除に失敗しました' })
    } finally {
      setIsSubmitting(false)
    }
  }, [session, onDelete, onClose])

  const isEditMode = !!session

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'セッション編集' : '新規セッション作成'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* タイトル */}
            <div className="space-y-2">
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="セッションのタイトルを入力"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* 日時 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">開始日時 *</Label>
                <div className="space-y-2">
                  <Input
                    id="startDate"
                    type="date"
                    value={formatDateForInput(formData.start)}
                    onChange={(e) => handleDateTimeChange('start', e.target.value, formatTimeForInput(formData.start))}
                    className={errors.time ? 'border-red-500' : ''}
                  />
                  <Input
                    id="startTime"
                    type="time"
                    value={formatTimeForInput(formData.start)}
                    onChange={(e) => handleDateTimeChange('start', formatDateForInput(formData.start), e.target.value)}
                    className={errors.time ? 'border-red-500' : ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">終了日時 *</Label>
                <div className="space-y-2">
                  <Input
                    id="endDate"
                    type="date"
                    value={formatDateForInput(formData.end)}
                    onChange={(e) => handleDateTimeChange('end', e.target.value, formatTimeForInput(formData.end))}
                    className={errors.time ? 'border-red-500' : ''}
                  />
                  <Input
                    id="endTime"
                    type="time"
                    value={formatTimeForInput(formData.end)}
                    onChange={(e) => handleDateTimeChange('end', formatDateForInput(formData.end), e.target.value)}
                    className={errors.time ? 'border-red-500' : ''}
                  />
                </div>
              </div>
            </div>
            {errors.time && (
              <p className="text-sm text-red-500">{errors.time}</p>
            )}

            {/* パート */}
            <div className="space-y-2">
              <Label htmlFor="partId">パート *</Label>
              <Select
                value={formData.partId.toString()}
                onValueChange={(value) => handleInputChange('partId', parseInt(value))}
              >
                <SelectTrigger className={errors.partId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="パートを選択" />
                </SelectTrigger>
                <SelectContent>
                  {parts.map((part) => (
                    <SelectItem key={part.id} value={part.id.toString()}>
                      {part.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.partId && (
                <p className="text-sm text-red-500">{errors.partId}</p>
              )}
            </div>

            {/* 会場 */}
            <div className="space-y-2">
              <Label htmlFor="venueId">会場 *</Label>
              <Select
                value={formData.venueId}
                onValueChange={(value) => handleInputChange('venueId', value)}
              >
                <SelectTrigger className={errors.venueId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="会場を選択" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.venueId && (
                <p className="text-sm text-red-500">{errors.venueId}</p>
              )}
            </div>

            {/* 指導者 */}
            <div className="space-y-2">
              <Label htmlFor="instructorId">指導者</Label>
              <Select
                value={formData.instructorId}
                onValueChange={(value) => handleInputChange('instructorId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="指導者を選択（任意）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">指導者なし</SelectItem>
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 説明 */}
            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="セッションの詳細説明（任意）"
                rows={3}
              />
            </div>

            {errors.submit && (
              <p className="text-sm text-red-500">{errors.submit}</p>
            )}
          </form>

          <DialogFooter>
            <div className="flex justify-between w-full">
              {/* 削除ボタン（編集モードのみ） */}
              {isEditMode && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isSubmitting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  削除
                </Button>
              )}

              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isEditMode ? '更新' : '作成'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>セッション削除の確認</AlertDialogTitle>
            <AlertDialogDescription>
              セッション「{session?.title}」を削除してもよろしいですか？
              この操作は取り消すことができません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}