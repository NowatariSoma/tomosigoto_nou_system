'use client'

import React, { useState, useCallback } from 'react'
import { Settings, Users, AlertTriangle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Part, Venue, PartRequirements } from '../types/generationParams'

interface PartRequirementsFormProps {
  parts: Part[]
  value: PartRequirements[]
  onChange: (requirements: PartRequirements[]) => void
  venues: Venue[]
  className?: string
}

export function PartRequirementsForm({
  parts,
  value,
  onChange,
  venues,
  className,
}: PartRequirementsFormProps) {
  const [editingPartId, setEditingPartId] = useState<number | null>(null)
  const [isMatrixViewOpen, setIsMatrixViewOpen] = useState(false)

  // パート要件を取得、存在しない場合はデフォルト値を返す
  const getPartRequirements = useCallback((partId: number): PartRequirements => {
    const existing = value.find(req => req.partId === partId)
    if (existing) return existing

    return {
      partId,
      frequencyPerWeek: 2,
      durationMinutes: 90,
      preferredVenueIds: [],
      priority: 3,
      dependencies: [],
    }
  }, [value])

  // パート要件を更新
  const updatePartRequirement = useCallback((partId: number, updates: Partial<PartRequirements>) => {
    const newRequirements = value.map(req => 
      req.partId === partId ? { ...req, ...updates } : req
    )
    
    // 存在しないパートの場合は新規追加
    if (!value.find(req => req.partId === partId)) {
      newRequirements.push({
        ...getPartRequirements(partId),
        ...updates,
      })
    }
    
    onChange(newRequirements)
  }, [value, onChange, getPartRequirements])

  // 練習頻度変更ハンドラー
  const handleFrequencyChange = useCallback((partId: number, valueStr: string) => {
    let frequency = parseInt(valueStr, 10)
    if (isNaN(frequency) || frequency < 1) frequency = 1
    if (frequency > 7) frequency = 7
    
    updatePartRequirement(partId, { frequencyPerWeek: frequency })
  }, [updatePartRequirement])

  // 練習時間変更ハンドラー
  const handleDurationChange = useCallback((partId: number, valueStr: string) => {
    let duration = parseInt(valueStr, 10)
    if (isNaN(duration) || duration < 30) duration = 30
    if (duration > 480) duration = 480
    
    updatePartRequirement(partId, { durationMinutes: duration })
  }, [updatePartRequirement])

  // 優先度変更ハンドラー
  const handlePriorityChange = useCallback((partId: number, priority: number[]) => {
    updatePartRequirement(partId, { priority: priority[0] })
  }, [updatePartRequirement])

  // 推奨会場変更ハンドラー
  const handleVenuePreferenceChange = useCallback((partId: number, venueId: number, checked: boolean) => {
    const currentRequirements = getPartRequirements(partId)
    let newVenueIds: number[]
    
    if (checked) {
      newVenueIds = [...currentRequirements.preferredVenueIds, venueId]
    } else {
      newVenueIds = currentRequirements.preferredVenueIds.filter(id => id !== venueId)
    }
    
    updatePartRequirement(partId, { preferredVenueIds: newVenueIds })
  }, [getPartRequirements, updatePartRequirement])

  // 依存関係変更ハンドラー
  const handleDependencyChange = useCallback((sourceId: number, targetId: number, type: string) => {
    const currentRequirements = getPartRequirements(sourceId)
    let newDependencies = currentRequirements.dependencies.filter(dep => dep.dependsOnPartId !== targetId)
    
    if (type !== 'none') {
      newDependencies.push({
        dependsOnPartId: targetId,
        type: type as 'before' | 'after' | 'same_day' | 'different_day',
      })
    }
    
    updatePartRequirement(sourceId, { dependencies: newDependencies })
  }, [getPartRequirements, updatePartRequirement])

  // バリデーション関数
  const validateRequirements = useCallback((requirements: PartRequirements) => {
    const errors: string[] = []
    const warnings: string[] = []

    if (requirements.frequencyPerWeek < 1 || requirements.frequencyPerWeek > 7) {
      errors.push('週あたり練習回数は1〜7回で設定してください')
    }

    if (requirements.durationMinutes < 30 || requirements.durationMinutes > 480) {
      errors.push('練習時間は30〜480分で設定してください')
    }

    if (requirements.priority < 1 || requirements.priority > 5) {
      errors.push('優先度は1〜5で設定してください')
    }

    if (requirements.preferredVenueIds.length === 0) {
      warnings.push('推奨会場を最低1つ選択することをお勧めします')
    }

    return { errors, warnings }
  }, [])

  return (
    <div className={cn('space-y-6', className)}>
      {parts.map(part => {
        const requirements = getPartRequirements(part.id)
        const validation = validateRequirements(requirements)
        
        return (
          <Card key={part.id} className='w-full'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <div 
                  className='w-4 h-4 rounded-full'
                  style={{ backgroundColor: part.color }}
                />
                {part.name}
                {validation.errors.length > 0 && (
                  <AlertTriangle className='h-4 w-4 text-destructive' />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* 練習頻度 */}
                <div className='space-y-2'>
                  <Label htmlFor={`frequency-${part.id}`}>
                    週あたり練習回数
                  </Label>
                  <Input
                    id={`frequency-${part.id}`}
                    type='number'
                    min={1}
                    max={7}
                    value={requirements.frequencyPerWeek}
                    onChange={(e) => handleFrequencyChange(part.id, e.target.value)}
                    onBlur={(e) => handleFrequencyChange(part.id, e.target.value)}
                    aria-label={`${part.name}の週あたり練習回数`}
                  />
                  <p className='text-xs text-muted-foreground'>1〜7回</p>
                </div>

                {/* 練習時間 */}
                <div className='space-y-2'>
                  <Label htmlFor={`duration-${part.id}`}>
                    1回あたり練習時間（分）
                  </Label>
                  <Input
                    id={`duration-${part.id}`}
                    type='number'
                    min={30}
                    max={480}
                    step={15}
                    value={requirements.durationMinutes}
                    onChange={(e) => handleDurationChange(part.id, e.target.value)}
                    onBlur={(e) => handleDurationChange(part.id, e.target.value)}
                    aria-label={`${part.name}の1回あたり練習時間`}
                  />
                  <p className='text-xs text-muted-foreground'>30〜480分</p>
                </div>

                {/* 優先度 */}
                <div className='space-y-2'>
                  <Label htmlFor={`priority-${part.id}`}>
                    優先度: {requirements.priority}
                  </Label>
                  <Slider
                    id={`priority-${part.id}`}
                    min={1}
                    max={5}
                    step={1}
                    value={[requirements.priority]}
                    onValueChange={(value) => handlePriorityChange(part.id, value)}
                    aria-label={`${part.name}の優先度`}
                  />
                  <div className='flex justify-between text-xs text-muted-foreground'>
                    <span>低</span>
                    <span>高</span>
                  </div>
                </div>
              </div>

              {/* 推奨会場設定 */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant='outline' className='w-full justify-between'>
                    推奨会場設定
                    <Settings className='h-4 w-4' />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className='mt-4 space-y-2'>
                  <Label>推奨会場</Label>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                    {venues.map(venue => (
                      <div key={venue.id} className='flex items-center space-x-2'>
                        <Checkbox
                          id={`venue-${part.id}-${venue.id}`}
                          checked={requirements.preferredVenueIds.includes(venue.id)}
                          onCheckedChange={(checked) => 
                            handleVenuePreferenceChange(part.id, venue.id, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`venue-${part.id}-${venue.id}`}
                          className='text-sm'
                        >
                          {venue.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* エラー・警告表示 */}
              {validation.errors.map((error, index) => (
                <Alert key={`error-${index}`} variant='destructive'>
                  <AlertTriangle className='h-4 w-4' />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ))}
              
              {validation.warnings.map((warning, index) => (
                <Alert key={`warning-${index}`}>
                  <AlertTriangle className='h-4 w-4' />
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>
        )
      })}

      {/* パート間依存関係設定 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            パート間依存関係設定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={isMatrixViewOpen} onOpenChange={setIsMatrixViewOpen}>
            <DialogTrigger asChild>
              <Button variant='outline' className='w-full'>
                パート間依存関係設定
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-4xl max-h-[80vh] overflow-auto'>
              <DialogHeader>
                <DialogTitle>パート間依存関係マトリクス</DialogTitle>
              </DialogHeader>
              <div className='space-y-4'>
                <p className='text-sm text-muted-foreground'>
                  各パートの練習順序や制約を設定できます。
                </p>
                
                {/* 依存関係マトリクス */}
                <div className='overflow-x-auto'>
                  <table className='w-full border-collapse'>
                    <thead>
                      <tr>
                        <th className='p-2 border text-left'>から/へ</th>
                        {parts.map(part => (
                          <th key={part.id} className='p-2 border text-center min-w-20'>
                            <div className='flex flex-col items-center gap-1'>
                              <div 
                                className='w-3 h-3 rounded-full'
                                style={{ backgroundColor: part.color }}
                              />
                              <span className='text-xs'>{part.name}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parts.map(sourcePart => (
                        <tr key={sourcePart.id}>
                          <td className='p-2 border'>
                            <div className='flex items-center gap-2'>
                              <div 
                                className='w-3 h-3 rounded-full'
                                style={{ backgroundColor: sourcePart.color }}
                              />
                              {sourcePart.name}
                            </div>
                          </td>
                          {parts.map(targetPart => {
                            if (sourcePart.id === targetPart.id) {
                              return (
                                <td key={targetPart.id} className='p-2 border bg-muted'>
                                  <div className='text-center text-muted-foreground'>-</div>
                                </td>
                              )
                            }

                            const currentDep = getPartRequirements(sourcePart.id).dependencies
                              .find(dep => dep.dependsOnPartId === targetPart.id)
                            const currentType = currentDep?.type || 'none'

                            return (
                              <td key={targetPart.id} className='p-2 border'>
                                <div className='flex flex-col gap-1'>
                                  <Button
                                    size='sm'
                                    variant={currentType === 'before' ? 'default' : 'outline'}
                                    className='text-xs h-6'
                                    onClick={() => handleDependencyChange(
                                      sourcePart.id, 
                                      targetPart.id, 
                                      currentType === 'before' ? 'none' : 'before'
                                    )}
                                    data-testid={`dependency-${sourcePart.id}-${targetPart.id}-before`}
                                  >
                                    前
                                  </Button>
                                  <Button
                                    size='sm'
                                    variant={currentType === 'after' ? 'default' : 'outline'}
                                    className='text-xs h-6'
                                    onClick={() => handleDependencyChange(
                                      sourcePart.id, 
                                      targetPart.id, 
                                      currentType === 'after' ? 'none' : 'after'
                                    )}
                                    data-testid={`dependency-${sourcePart.id}-${targetPart.id}-after`}
                                  >
                                    後
                                  </Button>
                                  <Button
                                    size='sm'
                                    variant={currentType === 'same_day' ? 'default' : 'outline'}
                                    className='text-xs h-6'
                                    onClick={() => handleDependencyChange(
                                      sourcePart.id, 
                                      targetPart.id, 
                                      currentType === 'same_day' ? 'none' : 'same_day'
                                    )}
                                    data-testid={`dependency-${sourcePart.id}-${targetPart.id}-same_day`}
                                  >
                                    同日
                                  </Button>
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className='text-sm text-muted-foreground space-y-1'>
                  <p><strong>前:</strong> このパートは対象パートより前に練習する</p>
                  <p><strong>後:</strong> このパートは対象パートより後に練習する</p>
                  <p><strong>同日:</strong> このパートは対象パートと同じ日に練習する</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}