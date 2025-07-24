'use client';

import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  VenueAvailability, 
  RecurringSlotData, 
  SpecialSlotData, 
  TimeRange 
} from '../types/venueForm';
import { 
  WEEKDAY_NAMES_SHORT,
  formatTimeRange,
  formatDaysOfWeek,
  getRecurringSlotDescription,
  detectAvailabilityConflicts
} from '../utils/availabilityHelpers';

interface VenueAvailabilityEditorProps {
  value: VenueAvailability;
  onChange: (data: VenueAvailability) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

// 時間範囲編集コンポーネント
const TimeRangeEditor: React.FC<{
  ranges: TimeRange[];
  onChange: (ranges: TimeRange[]) => void;
  disabled?: boolean;
}> = ({ ranges, onChange, disabled = false }) => {
  const addTimeRange = () => {
    onChange([...ranges, { start: '09:00', end: '17:00' }]);
  };

  const updateTimeRange = (index: number, field: 'start' | 'end', value: string) => {
    const newRanges = [...ranges];
    newRanges[index] = { ...newRanges[index], [field]: value };
    onChange(newRanges);
  };

  const removeTimeRange = (index: number) => {
    onChange(ranges.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {ranges.map((range, index) => (
        <div key={index} className="flex items-center space-x-2">
          <Input
            type="time"
            value={range.start}
            onChange={(e) => updateTimeRange(index, 'start', e.target.value)}
            disabled={disabled}
            className="w-24"
          />
          <span>〜</span>
          <Input
            type="time"
            value={range.end}
            onChange={(e) => updateTimeRange(index, 'end', e.target.value)}
            disabled={disabled}
            className="w-24"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeTimeRange(index)}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={addTimeRange}
        disabled={disabled}
      >
        <Plus className="h-4 w-4 mr-1" />
        時間帯を追加
      </Button>
    </div>
  );
};

// 定期利用枠編集ダイアログ
const RecurringSlotDialog: React.FC<{
  slot?: RecurringSlotData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (slot: RecurringSlotData) => void;
}> = ({ slot, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<RecurringSlotData>>(() => ({
    id: slot?.id || '',
    title: slot?.title || '',
    dayOfWeek: slot?.dayOfWeek || [],
    timeRanges: slot?.timeRanges || [{ start: '09:00', end: '17:00' }],
    startDate: slot?.startDate || new Date(),
    endDate: slot?.endDate,
    pattern: slot?.pattern || 'weekly'
  }));

  const handleSave = () => {
    if (formData.dayOfWeek?.length && formData.timeRanges?.length && formData.startDate) {
      onSave({
        id: formData.id || Date.now().toString(),
        title: formData.title || '',
        dayOfWeek: formData.dayOfWeek,
        timeRanges: formData.timeRanges,
        startDate: formData.startDate,
        endDate: formData.endDate,
        pattern: formData.pattern || 'weekly'
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {slot ? '定期利用枠を編集' : '定期利用枠を追加'}
          </DialogTitle>
          <DialogDescription>
            定期的な利用可能時間を設定します
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              タイトル
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="col-span-3"
              placeholder="練習時間など"
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              曜日 <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3 grid grid-cols-7 gap-2">
              {WEEKDAY_NAMES_SHORT.map((day, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${index}`}
                    checked={formData.dayOfWeek?.includes(index)}
                    onCheckedChange={(checked) => {
                      const currentDays = formData.dayOfWeek || [];
                      if (checked) {
                        setFormData(prev => ({ 
                          ...prev, 
                          dayOfWeek: [...currentDays, index] 
                        }));
                      } else {
                        setFormData(prev => ({ 
                          ...prev, 
                          dayOfWeek: currentDays.filter(d => d !== index) 
                        }));
                      }
                    }}
                  />
                  <Label htmlFor={`day-${index}`} className="text-sm">
                    {day}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pattern" className="text-right">
              繰り返し
            </Label>
            <Select
              value={formData.pattern}
              onValueChange={(value) => setFormData(prev => ({ ...prev, pattern: value as any }))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">毎週</SelectItem>
                <SelectItem value="biweekly">隔週</SelectItem>
                <SelectItem value="monthly">毎月</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">
              開始日 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                startDate: new Date(e.target.value) 
              }))}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">
              終了日
            </Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate ? format(formData.endDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                endDate: e.target.value ? new Date(e.target.value) : undefined 
              }))}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              時間帯 <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3">
              <TimeRangeEditor
                ranges={formData.timeRanges || []}
                onChange={(ranges) => setFormData(prev => ({ ...prev, timeRanges: ranges }))}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={!formData.dayOfWeek?.length || !formData.timeRanges?.length}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// 特別利用枠編集ダイアログ
const SpecialSlotDialog: React.FC<{
  slot?: SpecialSlotData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (slot: SpecialSlotData) => void;
}> = ({ slot, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<SpecialSlotData>>(() => ({
    id: slot?.id || '',
    title: slot?.title || '',
    date: slot?.date || new Date(),
    timeRanges: slot?.timeRanges || [{ start: '09:00', end: '17:00' }],
    type: slot?.type || 'available',
    notes: slot?.notes || ''
  }));

  const handleSave = () => {
    if (formData.date && formData.timeRanges?.length) {
      onSave({
        id: formData.id || Date.now().toString(),
        title: formData.title || '',
        date: formData.date,
        timeRanges: formData.timeRanges,
        type: formData.type || 'available',
        notes: formData.notes
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {slot ? '特別利用枠を編集' : '特別利用枠を追加'}
          </DialogTitle>
          <DialogDescription>
            特定日の利用可能時間を設定します
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              日付 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date ? format(formData.date, 'yyyy-MM-dd') : ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                date: new Date(e.target.value) 
              }))}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              種別
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">利用可能</SelectItem>
                <SelectItem value="unavailable">利用不可</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              タイトル
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="col-span-3"
              placeholder="イベント名など"
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              時間帯 <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3">
              <TimeRangeEditor
                ranges={formData.timeRanges || []}
                onChange={(ranges) => setFormData(prev => ({ ...prev, timeRanges: ranges }))}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              備考
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="col-span-3"
              placeholder="詳細情報があれば入力"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={!formData.date || !formData.timeRanges?.length}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const VenueAvailabilityEditor: React.FC<VenueAvailabilityEditorProps> = ({
  value,
  onChange,
  errors = {},
  disabled = false
}) => {
  const [activeTab, setActiveTab] = useState<'recurring' | 'special'>('recurring');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingRecurringSlot, setEditingRecurringSlot] = useState<RecurringSlotData | null>(null);
  const [editingSpecialSlot, setEditingSpecialSlot] = useState<SpecialSlotData | null>(null);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [showSpecialDialog, setShowSpecialDialog] = useState(false);

  // 競合チェック
  const conflicts = useMemo(() => {
    return detectAvailabilityConflicts(value.recurringSlots, value.specialSlots);
  }, [value]);

  // 定期利用枠の保存
  const handleSaveRecurringSlot = (slot: RecurringSlotData) => {
    const existingIndex = value.recurringSlots.findIndex(s => s.id === slot.id);
    let newRecurringSlots;

    if (existingIndex >= 0) {
      newRecurringSlots = [...value.recurringSlots];
      newRecurringSlots[existingIndex] = slot;
    } else {
      newRecurringSlots = [...value.recurringSlots, slot];
    }

    onChange({
      ...value,
      recurringSlots: newRecurringSlots
    });

    setEditingRecurringSlot(null);
    setShowRecurringDialog(false);
  };

  // 特別利用枠の保存
  const handleSaveSpecialSlot = (slot: SpecialSlotData) => {
    const existingIndex = value.specialSlots.findIndex(s => s.id === slot.id);
    let newSpecialSlots;

    if (existingIndex >= 0) {
      newSpecialSlots = [...value.specialSlots];
      newSpecialSlots[existingIndex] = slot;
    } else {
      newSpecialSlots = [...value.specialSlots, slot];
    }

    onChange({
      ...value,
      specialSlots: newSpecialSlots
    });

    setEditingSpecialSlot(null);
    setShowSpecialDialog(false);
  };

  // 定期利用枠の削除
  const handleDeleteRecurringSlot = (slotId: string) => {
    onChange({
      ...value,
      recurringSlots: value.recurringSlots.filter(slot => slot.id !== slotId)
    });
  };

  // 特別利用枠の削除
  const handleDeleteSpecialSlot = (slotId: string) => {
    onChange({
      ...value,
      specialSlots: value.specialSlots.filter(slot => slot.id !== slotId)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Calendar className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">利用可能時間設定</h2>
      </div>

      {/* 競合警告 */}
      {conflicts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            時間の競合が{conflicts.length}件検出されました。設定を確認してください。
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recurring" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>定期利用枠</span>
          </TabsTrigger>
          <TabsTrigger value="special" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>特別利用枠</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recurring" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>定期利用枠</CardTitle>
                  <CardDescription>
                    毎週・隔週・毎月など、定期的な利用可能時間を設定します
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowRecurringDialog(true)}
                  disabled={disabled}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  追加
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {value.recurringSlots.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  定期利用枠が設定されていません
                </p>
              ) : (
                <div className="space-y-4">
                  {value.recurringSlots.map(slot => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {slot.title && (
                            <h4 className="font-medium">{slot.title}</h4>
                          )}
                          <Badge variant="secondary">定期</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getRecurringSlotDescription(slot)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(slot.startDate, 'yyyy/MM/dd', { locale: ja })}〜
                          {slot.endDate ? format(slot.endDate, 'yyyy/MM/dd', { locale: ja }) : '継続中'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingRecurringSlot(slot);
                            setShowRecurringDialog(true);
                          }}
                          disabled={disabled}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRecurringSlot(slot.id)}
                          disabled={disabled}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="special" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>特別利用枠</CardTitle>
                  <CardDescription>
                    特定日の利用可能時間や利用不可日を設定します
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowSpecialDialog(true)}
                  disabled={disabled}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  追加
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {value.specialSlots.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  特別利用枠が設定されていません
                </p>
              ) : (
                <div className="space-y-4">
                  {value.specialSlots
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map(slot => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {slot.title && (
                            <h4 className="font-medium">{slot.title}</h4>
                          )}
                          <Badge variant={slot.type === 'available' ? 'default' : 'destructive'}>
                            {slot.type === 'available' ? '利用可能' : '利用不可'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(slot.date, 'yyyy/MM/dd (E)', { locale: ja })} - {formatTimeRange(slot.timeRanges[0])}
                          {slot.timeRanges.length > 1 && ` など${slot.timeRanges.length}件`}
                        </p>
                        {slot.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {slot.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSpecialSlot(slot);
                            setShowSpecialDialog(true);
                          }}
                          disabled={disabled}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSpecialSlot(slot.id)}
                          disabled={disabled}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 定期利用枠編集ダイアログ */}
      <RecurringSlotDialog
        slot={editingRecurringSlot || undefined}
        isOpen={showRecurringDialog}
        onClose={() => {
          setShowRecurringDialog(false);
          setEditingRecurringSlot(null);
        }}
        onSave={handleSaveRecurringSlot}
      />

      {/* 特別利用枠編集ダイアログ */}
      <SpecialSlotDialog
        slot={editingSpecialSlot || undefined}
        isOpen={showSpecialDialog}
        onClose={() => {
          setShowSpecialDialog(false);
          setEditingSpecialSlot(null);
        }}
        onSave={handleSaveSpecialSlot}
      />
    </div>
  );
};