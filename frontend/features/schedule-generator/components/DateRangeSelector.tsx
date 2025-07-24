'use client'

import React, { useState, useCallback } from 'react'
import { CalendarIcon } from 'lucide-react'
import { format, isAfter, isBefore, addDays, addWeeks, addMonths, startOfDay, endOfMonth, startOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { ja } from 'date-fns/locale'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateRange } from '../types/generationParams'

interface DateRangeSelectorProps {
  value: DateRange
  onChange: (range: DateRange) => void
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  className?: string
}

export function DateRangeSelector({
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  className,
}: DateRangeSelectorProps) {
  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false)
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false)

  // 日付の妥当性チェック
  const isValidRange = !isAfter(value.startDate, value.endDate)
  const isStartDateValid = !minDate || !isBefore(value.startDate, minDate)
  const isEndDateValid = !maxDate || !isAfter(value.endDate, maxDate)

  const handleStartDateChange = useCallback((date: Date | undefined) => {
    if (!date) return

    let newEndDate = value.endDate
    // 開始日が終了日より後の場合、終了日を開始日に合わせる
    if (isAfter(date, value.endDate)) {
      newEndDate = date
    }

    onChange({
      startDate: date,
      endDate: newEndDate,
    })
    setIsStartPickerOpen(false)
  }, [value.endDate, onChange])

  const handleEndDateChange = useCallback((date: Date | undefined) => {
    if (!date) return

    let newStartDate = value.startDate
    // 終了日が開始日より前の場合、開始日を終了日に合わせる
    if (isBefore(date, value.startDate)) {
      newStartDate = date
    }

    onChange({
      startDate: newStartDate,
      endDate: date,
    })
    setIsEndPickerOpen(false)
  }, [value.startDate, onChange])

  const handleQuickRangeSelect = useCallback((preset: string) => {
    const now = new Date()
    let startDate: Date
    let endDate: Date

    switch (preset) {
      case 'thisWeek':
        startDate = startOfWeek(now, { weekStartsOn: 1 }) // 月曜日開始
        endDate = endOfWeek(now, { weekStartsOn: 1 })
        break
      case 'nextWeek':
        const nextWeekStart = addWeeks(now, 1)
        startDate = startOfWeek(nextWeekStart, { weekStartsOn: 1 })
        endDate = endOfWeek(nextWeekStart, { weekStartsOn: 1 })
        break
      case 'thisMonth':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case 'nextMonth':
        const nextMonth = addMonths(now, 1)
        startDate = startOfMonth(nextMonth)
        endDate = endOfMonth(nextMonth)
        break
      default:
        return
    }

    onChange({ startDate, endDate })
  }, [onChange])

  return (
    <div className={cn('space-y-4', className)}>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* 開始日選択 */}
        <div className='space-y-2'>
          <Label htmlFor='start-date'>開始日</Label>
          <Popover open={isStartPickerOpen} onOpenChange={setIsStartPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                id='start-date'
                variant='outline'
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !value.startDate && 'text-muted-foreground',
                  !isStartDateValid && 'border-destructive'
                )}
                disabled={disabled}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {value.startDate ? (
                  format(value.startDate, 'yyyy/MM/dd', { locale: ja })
                ) : (
                  '開始日を選択'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={value.startDate}
                onSelect={handleStartDateChange}
                disabled={(date) =>
                  (minDate && isBefore(date, minDate)) ||
                  (maxDate && isAfter(date, maxDate))
                }
                locale={ja}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {!isStartDateValid && (
            <p className='text-sm text-destructive'>
              選択可能期間外の日付が含まれています
            </p>
          )}
        </div>

        {/* 終了日選択 */}
        <div className='space-y-2'>
          <Label htmlFor='end-date'>終了日</Label>
          <Popover open={isEndPickerOpen} onOpenChange={setIsEndPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                id='end-date'
                variant='outline'
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !value.endDate && 'text-muted-foreground',
                  !isEndDateValid && 'border-destructive'
                )}
                disabled={disabled}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {value.endDate ? (
                  format(value.endDate, 'yyyy/MM/dd', { locale: ja })
                ) : (
                  '終了日を選択'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={value.endDate}
                onSelect={handleEndDateChange}
                disabled={(date) =>
                  (minDate && isBefore(date, minDate)) ||
                  (maxDate && isAfter(date, maxDate))
                }
                locale={ja}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {!isEndDateValid && (
            <p className='text-sm text-destructive'>
              選択可能期間外の日付が含まれています
            </p>
          )}
        </div>
      </div>

      {/* 日付範囲妥当性チェック */}
      {!isValidRange && (
        <p className='text-sm text-destructive'>
          終了日は開始日以降の日付を選択してください
        </p>
      )}

      {/* クイック選択ボタン */}
      <div className='space-y-2'>
        <Label className='text-sm font-medium'>クイック選択</Label>
        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => handleQuickRangeSelect('thisWeek')}
            disabled={disabled}
          >
            今週
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => handleQuickRangeSelect('nextWeek')}
            disabled={disabled}
          >
            来週
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => handleQuickRangeSelect('thisMonth')}
            disabled={disabled}
          >
            今月
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => handleQuickRangeSelect('nextMonth')}
            disabled={disabled}
          >
            来月
          </Button>
        </div>
      </div>
    </div>
  )
}