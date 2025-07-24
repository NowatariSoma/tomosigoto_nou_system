import { z } from 'zod';
import { VenueBasicInfo, EquipmentData, VenueAvailability, VenueFormData } from '../types/venueForm';

// 基本情報のバリデーションスキーマ
export const venueBasicInfoSchema = z.object({
  name: z.string()
    .min(1, '会場名を入力してください')
    .max(100, '会場名は100文字以内で入力してください'),
  description: z.string()
    .max(1000, '説明は1000文字以内で入力してください')
    .optional()
    .default(''),
  address: z.string()
    .min(1, '住所を入力してください')
    .max(200, '住所は200文字以内で入力してください'),
  capacity: z.number()
    .int('収容人数は整数で入力してください')
    .min(1, '収容人数は1以上で入力してください')
    .max(10000, '収容人数は10000以下で入力してください'),
  hourlyRate: z.number()
    .min(0, '時間料金は0以上で入力してください')
    .max(1000000, '時間料金は1,000,000以下で入力してください'),
  contactPhone: z.string()
    .min(1, '連絡先電話番号を入力してください')
    .regex(/^[\d\-\(\)\+\s]+$/, '有効な電話番号を入力してください'),
  contactEmail: z.string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  accessInfo: z.string()
    .max(500, 'アクセス情報は500文字以内で入力してください')
    .optional()
    .default(''),
  notes: z.string()
    .max(1000, '備考は1000文字以内で入力してください')
    .optional()
    .default('')
});

// 設備情報のバリデーションスキーマ
export const equipmentItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, '設備名を入力してください'),
  category: z.string().min(1, 'カテゴリを選択してください'),
  quantity: z.number().int().min(1, '数量は1以上で入力してください'),
  status: z.enum(['available', 'maintenance', 'unavailable']),
  notes: z.string().optional()
});

export const equipmentDataSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  items: z.array(equipmentItemSchema)
});

// 時間範囲のバリデーションスキーマ
export const timeRangeSchema = z.object({
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '有効な時間形式(HH:MM)で入力してください'),
  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '有効な時間形式(HH:MM)で入力してください')
}).refine((data) => {
  const startTime = new Date(`2000-01-01T${data.start}:00`);
  const endTime = new Date(`2000-01-01T${data.end}:00`);
  return endTime > startTime;
}, {
  message: '終了時間は開始時間より後に設定してください',
  path: ['end']
});

// 定期利用枠のバリデーションスキーマ
export const recurringSlotSchema = z.object({
  id: z.string(),
  dayOfWeek: z.array(z.number().min(0).max(6)).min(1, '曜日を最低1つ選択してください'),
  timeRanges: z.array(timeRangeSchema).min(1, '時間範囲を最低1つ設定してください'),
  startDate: z.date(),
  endDate: z.date().optional(),
  pattern: z.enum(['weekly', 'biweekly', 'monthly']),
  title: z.string().optional()
}).refine((data) => {
  if (data.endDate) {
    return data.endDate > data.startDate;
  }
  return true;
}, {
  message: '終了日は開始日より後に設定してください',
  path: ['endDate']
});

// 特別利用枠のバリデーションスキーマ
export const specialSlotSchema = z.object({
  id: z.string(),
  date: z.date(),
  timeRanges: z.array(timeRangeSchema).min(1, '時間範囲を最低1つ設定してください'),
  type: z.enum(['available', 'unavailable']),
  title: z.string().optional(),
  notes: z.string().optional()
});

// 利用可能時間のバリデーションスキーマ
export const venueAvailabilitySchema = z.object({
  recurringSlots: z.array(recurringSlotSchema),
  specialSlots: z.array(specialSlotSchema)
});

// 会場画像のバリデーションスキーマ
export const venueImageSchema = z.object({
  id: z.string(),
  url: z.string().url('有効なURLを入力してください'),
  fileName: z.string().min(1, 'ファイル名が必要です'),
  order: z.number().int().min(0),
  alt: z.string().optional()
});

// 全体のフォームデータのバリデーションスキーマ
export const venueFormDataSchema = z.object({
  basicInfo: venueBasicInfoSchema,
  equipment: z.array(equipmentDataSchema),
  availability: venueAvailabilitySchema,
  images: z.array(venueImageSchema)
});

// バリデーション関数
export const validateVenueBasicInfo = (data: Partial<VenueBasicInfo>) => {
  try {
    venueBasicInfoSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'バリデーションエラーが発生しました' } };
  }
};

export const validateEquipmentData = (data: EquipmentData[]) => {
  try {
    z.array(equipmentDataSchema).parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'バリデーションエラーが発生しました' } };
  }
};

export const validateVenueAvailability = (data: VenueAvailability) => {
  try {
    venueAvailabilitySchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'バリデーションエラーが発生しました' } };
  }
};

export const validateVenueFormData = (data: VenueFormData) => {
  try {
    venueFormDataSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'バリデーションエラーが発生しました' } };
  }
};

// 時間の競合チェック
export const checkTimeConflicts = (timeRanges: { start: string; end: string }[]) => {
  const conflicts: Array<{ index1: number; index2: number }> = [];
  
  for (let i = 0; i < timeRanges.length; i++) {
    for (let j = i + 1; j < timeRanges.length; j++) {
      const range1 = timeRanges[i];
      const range2 = timeRanges[j];
      
      const start1 = new Date(`2000-01-01T${range1.start}:00`);
      const end1 = new Date(`2000-01-01T${range1.end}:00`);
      const start2 = new Date(`2000-01-01T${range2.start}:00`);
      const end2 = new Date(`2000-01-01T${range2.end}:00`);
      
      // 時間範囲が重複しているかチェック
      if ((start1 < end2 && end1 > start2)) {
        conflicts.push({ index1: i, index2: j });
      }
    }
  }
  
  return conflicts;
};

// デフォルト値の生成
export const createDefaultVenueBasicInfo = (): VenueBasicInfo => ({
  name: '',
  description: '',
  address: '',
  capacity: 0,
  hourlyRate: 0,
  contactPhone: '',
  contactEmail: '',
  accessInfo: '',
  notes: ''
});

export const createDefaultVenueFormData = (): VenueFormData => ({
  basicInfo: createDefaultVenueBasicInfo(),
  equipment: [],
  availability: {
    recurringSlots: [],
    specialSlots: []
  },
  images: []
});