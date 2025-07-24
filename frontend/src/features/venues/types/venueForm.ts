// 会場フォーム関連の型定義

export interface VenueBasicInfo {
  name: string;
  description: string;
  address: string;
  capacity: number;
  hourlyRate: number;
  contactPhone: string;
  contactEmail: string;
  accessInfo: string;
  notes: string;
}

export interface EquipmentItemData {
  id: string;
  name: string;
  category: string;
  quantity: number;
  status: 'available' | 'maintenance' | 'unavailable';
  notes?: string;
}

export interface EquipmentData {
  id: string;
  categoryId: string;
  items: EquipmentItemData[];
}

export interface EquipmentType {
  id: string;
  name: string;
  category: string;
  icon?: string;
}

export interface TimeRange {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface RecurringSlotData {
  id: string;
  dayOfWeek: number[]; // 0-6 (Sunday-Saturday)
  timeRanges: TimeRange[];
  startDate: Date;
  endDate?: Date;
  pattern: 'weekly' | 'biweekly' | 'monthly';
  title?: string;
}

export interface SpecialSlotData {
  id: string;
  date: Date;
  timeRanges: TimeRange[];
  type: 'available' | 'unavailable';
  title?: string;
  notes?: string;
}

export interface VenueAvailability {
  recurringSlots: RecurringSlotData[];
  specialSlots: SpecialSlotData[];
}

export interface VenueImage {
  id: string;
  url: string;
  fileName: string;
  order: number;
  alt?: string;
}

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VenueFormData {
  basicInfo: VenueBasicInfo;
  equipment: EquipmentData[];
  availability: VenueAvailability;
  images: VenueImage[];
}

export interface VenueFormErrors {
  basicInfo?: Partial<Record<keyof VenueBasicInfo, string>>;
  equipment?: Record<string, string>;
  availability?: Record<string, string>;
  images?: Record<string, string>;
  general?: string;
}

export interface VenueFormState {
  data: VenueFormData;
  currentStep: number;
  isLoading: boolean;
  isSaving: boolean;
  errors: VenueFormErrors;
  isDirty: boolean;
}

// フォームステップの定義
export const FORM_STEPS = {
  BASIC_INFO: 0,
  EQUIPMENT: 1,
  AVAILABILITY: 2,
  IMAGES: 3,
} as const;

export type FormStep = typeof FORM_STEPS[keyof typeof FORM_STEPS];

// 設備カテゴリの定義
export const EQUIPMENT_CATEGORIES = [
  { id: 'audio', name: '音響設備', color: '#3b82f6' },
  { id: 'lighting', name: '照明設備', color: '#f59e0b' },
  { id: 'furniture', name: '家具', color: '#10b981' },
  { id: 'sports', name: 'スポーツ用品', color: '#ef4444' },
  { id: 'tech', name: 'IT機器', color: '#8b5cf6' },
  { id: 'other', name: 'その他', color: '#6b7280' }
] as const;

export type EquipmentCategory = typeof EQUIPMENT_CATEGORIES[number]['id'];