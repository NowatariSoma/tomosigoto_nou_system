import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { RecurringSlotData, SpecialSlotData, TimeRange } from '../types/venueForm';

// 曜日の名前
export const WEEKDAY_NAMES = [
  '日曜日',
  '月曜日', 
  '火曜日',
  '水曜日',
  '木曜日',
  '金曜日',
  '土曜日'
];

export const WEEKDAY_NAMES_SHORT = [
  '日',
  '月',
  '火', 
  '水',
  '木',
  '金',
  '土'
];

// 時間文字列を分に変換
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// 分を時間文字列に変換
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// 時間範囲の重複チェック
export const isTimeRangeOverlapping = (range1: TimeRange, range2: TimeRange): boolean => {
  const start1 = timeToMinutes(range1.start);
  const end1 = timeToMinutes(range1.end);
  const start2 = timeToMinutes(range2.start);
  const end2 = timeToMinutes(range2.end);

  return start1 < end2 && end1 > start2;
};

// 時間範囲の結合
export const mergeTimeRanges = (ranges: TimeRange[]): TimeRange[] => {
  if (ranges.length === 0) return [];

  // 開始時間でソート
  const sorted = [...ranges].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const merged: TimeRange[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (isTimeRangeOverlapping(last, current) || timeToMinutes(last.end) === timeToMinutes(current.start)) {
      // 重複または隣接している場合は結合
      last.end = timeToMinutes(last.end) > timeToMinutes(current.end) ? last.end : current.end;
    } else {
      merged.push(current);
    }
  }

  return merged;
};

// 定期利用枠の次回発生日を取得
export const getNextOccurrence = (slot: RecurringSlotData, fromDate: Date): Date | null => {
  const { pattern, dayOfWeek, startDate, endDate } = slot;
  
  if (endDate && fromDate > endDate) {
    return null;
  }

  let currentDate = new Date(Math.max(fromDate.getTime(), startDate.getTime()));
  const maxIterations = pattern === 'monthly' ? 365 : 52; // 無限ループ防止

  for (let i = 0; i < maxIterations; i++) {
    const dayOfWeekNumber = currentDate.getDay();
    
    if (dayOfWeek.includes(dayOfWeekNumber)) {
      if (currentDate >= fromDate && (!endDate || currentDate <= endDate)) {
        return currentDate;
      }
    }

    // 次の候補日を取得
    switch (pattern) {
      case 'weekly':
        currentDate = addDays(currentDate, 1);
        break;
      case 'biweekly':
        // 隔週の場合、週の開始日から計算
        const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });
        const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weeksDiff = Math.floor((currentWeekStart.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
        
        if (weeksDiff % 2 === 0) {
          currentDate = addDays(currentDate, 1);
        } else {
          // 次の偶数週まで飛ばす
          currentDate = addWeeks(currentDate, 1);
        }
        break;
      case 'monthly':
        currentDate = addDays(currentDate, 1);
        break;
    }
  }

  return null;
};

// 指定期間内の定期利用枠のすべての発生日を取得
export const getRecurringSlotOccurrences = (
  slot: RecurringSlotData, 
  startDate: Date, 
  endDate: Date
): Date[] => {
  const occurrences: Date[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const nextOccurrence = getNextOccurrence(slot, currentDate);
    if (!nextOccurrence || nextOccurrence > endDate) {
      break;
    }
    
    occurrences.push(new Date(nextOccurrence));
    currentDate = addDays(nextOccurrence, 1);
  }

  return occurrences;
};

// 特定日の利用可能時間を取得
export const getAvailableTimeSlots = (
  date: Date,
  recurringSlots: RecurringSlotData[],
  specialSlots: SpecialSlotData[]
): TimeRange[] => {
  const dayOfWeek = date.getDay();
  const allRanges: TimeRange[] = [];

  // 定期利用枠をチェック
  recurringSlots.forEach(slot => {
    if (slot.dayOfWeek.includes(dayOfWeek)) {
      const occurrences = getRecurringSlotOccurrences(slot, date, date);
      if (occurrences.length > 0) {
        allRanges.push(...slot.timeRanges);
      }
    }
  });

  // 特別利用枠をチェック
  specialSlots.forEach(slot => {
    if (isSameDay(slot.date, date)) {
      if (slot.type === 'available') {
        allRanges.push(...slot.timeRanges);
      } else {
        // 利用不可の場合は、該当時間を除外する処理が必要
        // この実装では簡単のため、available のみを追加
      }
    }
  });

  return mergeTimeRanges(allRanges);
};

// 利用可能性の競合を検出
export const detectAvailabilityConflicts = (
  recurringSlots: RecurringSlotData[],
  specialSlots: SpecialSlotData[]
): Array<{ type: 'recurring' | 'special'; id1: string; id2?: string; message: string }> => {
  const conflicts: Array<{ type: 'recurring' | 'special'; id1: string; id2?: string; message: string }> = [];

  // 定期利用枠間の競合チェック
  for (let i = 0; i < recurringSlots.length; i++) {
    for (let j = i + 1; j < recurringSlots.length; j++) {
      const slot1 = recurringSlots[i];
      const slot2 = recurringSlots[j];

      // 曜日の重複チェック
      const commonDays = slot1.dayOfWeek.filter(day => slot2.dayOfWeek.includes(day));
      if (commonDays.length > 0) {
        // 時間範囲の重複チェック
        for (const range1 of slot1.timeRanges) {
          for (const range2 of slot2.timeRanges) {
            if (isTimeRangeOverlapping(range1, range2)) {
              conflicts.push({
                type: 'recurring',
                id1: slot1.id,
                id2: slot2.id,
                message: `定期利用枠「${slot1.title || slot1.id}」と「${slot2.title || slot2.id}」の時間が重複しています`
              });
            }
          }
        }
      }
    }
  }

  // 特別利用枠間の競合チェック（同じ日付）
  const specialSlotsByDate = new Map<string, SpecialSlotData[]>();
  specialSlots.forEach(slot => {
    const dateKey = format(slot.date, 'yyyy-MM-dd');
    if (!specialSlotsByDate.has(dateKey)) {
      specialSlotsByDate.set(dateKey, []);
    }
    specialSlotsByDate.get(dateKey)!.push(slot);
  });

  specialSlotsByDate.forEach((slotsOnDate, dateKey) => {
    for (let i = 0; i < slotsOnDate.length; i++) {
      for (let j = i + 1; j < slotsOnDate.length; j++) {
        const slot1 = slotsOnDate[i];
        const slot2 = slotsOnDate[j];

        for (const range1 of slot1.timeRanges) {
          for (const range2 of slot2.timeRanges) {
            if (isTimeRangeOverlapping(range1, range2)) {
              conflicts.push({
                type: 'special',
                id1: slot1.id,
                id2: slot2.id,
                message: `${dateKey}の特別利用枠「${slot1.title || slot1.id}」と「${slot2.title || slot2.id}」の時間が重複しています`
              });
            }
          }
        }
      }
    }
  });

  return conflicts;
};

// 時間範囲の文字列表現を取得
export const formatTimeRange = (range: TimeRange): string => {
  return `${range.start}〜${range.end}`;
};

// 時間範囲リストの文字列表現を取得
export const formatTimeRanges = (ranges: TimeRange[]): string => {
  return ranges.map(formatTimeRange).join(', ');
};

// 曜日配列の文字列表現を取得
export const formatDaysOfWeek = (dayOfWeek: number[]): string => {
  return dayOfWeek
    .sort()
    .map(day => WEEKDAY_NAMES_SHORT[day])
    .join('・');
};

// 定期利用枠の説明文を生成
export const getRecurringSlotDescription = (slot: RecurringSlotData): string => {
  const days = formatDaysOfWeek(slot.dayOfWeek);
  const times = formatTimeRanges(slot.timeRanges);
  const pattern = slot.pattern === 'weekly' ? '毎週' : 
                  slot.pattern === 'biweekly' ? '隔週' : '毎月';
  
  return `${pattern} ${days} ${times}`;
};

// 利用可能時間の統計情報を取得
export const getAvailabilityStats = (
  recurringSlots: RecurringSlotData[],
  specialSlots: SpecialSlotData[]
) => {
  const totalRecurringSlots = recurringSlots.length;
  const totalSpecialSlots = specialSlots.length;
  const availableSpecialSlots = specialSlots.filter(slot => slot.type === 'available').length;
  const unavailableSpecialSlots = specialSlots.filter(slot => slot.type === 'unavailable').length;

  // 週あたりの平均利用可能時間を計算（概算）
  const weeklyMinutes = recurringSlots.reduce((total, slot) => {
    const slotMinutes = slot.timeRanges.reduce((rangeTotal, range) => {
      return rangeTotal + (timeToMinutes(range.end) - timeToMinutes(range.start));
    }, 0);
    return total + (slotMinutes * slot.dayOfWeek.length);
  }, 0);

  return {
    totalRecurringSlots,
    totalSpecialSlots,
    availableSpecialSlots,
    unavailableSpecialSlots,
    weeklyMinutes,
    weeklyHours: Math.round(weeklyMinutes / 60 * 10) / 10
  };
};