import { z } from 'zod'

// 基本的な日付範囲の型
export const DateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
})

export type DateRange = z.infer<typeof DateRangeSchema>

// パート情報の型
export const PartSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
})

export type Part = z.infer<typeof PartSchema>

// 会場情報の型
export const VenueSchema = z.object({
  id: z.number(),
  name: z.string(),
  capacity: z.number(),
  location: z.string(),
  equipmentIds: z.array(z.number()),
})

export type Venue = z.infer<typeof VenueSchema>

// 設備種別の型
export const EquipmentTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
})

export type EquipmentType = z.infer<typeof EquipmentTypeSchema>

// パート要件の型
export const PartRequirementsSchema = z.object({
  partId: z.number(),
  frequencyPerWeek: z.number().min(1).max(7),
  durationMinutes: z.number().min(30).max(480),
  preferredVenueIds: z.array(z.number()),
  priority: z.number().min(1).max(5),
  dependencies: z.array(z.object({
    dependsOnPartId: z.number(),
    type: z.enum(['before', 'after', 'same_day', 'different_day']),
  })),
})

export type PartRequirements = z.infer<typeof PartRequirementsSchema>

// 時間制約の型
export const TimeConstraintsSchema = z.object({
  monday: z.array(z.object({
    startHour: z.number().min(0).max(23),
    endHour: z.number().min(0).max(23),
  })),
  tuesday: z.array(z.object({
    startHour: z.number().min(0).max(23),
    endHour: z.number().min(0).max(23),
  })),
  wednesday: z.array(z.object({
    startHour: z.number().min(0).max(23),
    endHour: z.number().min(0).max(23),
  })),
  thursday: z.array(z.object({
    startHour: z.number().min(0).max(23),
    endHour: z.number().min(0).max(23),
  })),
  friday: z.array(z.object({
    startHour: z.number().min(0).max(23),
    endHour: z.number().min(0).max(23),
  })),
  saturday: z.array(z.object({
    startHour: z.number().min(0).max(23),
    endHour: z.number().min(0).max(23),
  })),
  sunday: z.array(z.object({
    startHour: z.number().min(0).max(23),
    endHour: z.number().min(0).max(23),
  })),
})

export type TimeConstraints = z.infer<typeof TimeConstraintsSchema>

// 会場選択情報の型
export const VenueSelectionSchema = z.object({
  selectedVenueIds: z.array(z.number()),
  venueOrder: z.array(z.number()),
  requiredEquipmentIds: z.array(z.number()),
  minCapacity: z.number().min(1).optional(),
})

export type VenueSelection = z.infer<typeof VenueSelectionSchema>

// 条件テンプレートの型
export const ConditionTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  parameters: z.object({}).passthrough(), // GenerationParametersを参照
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type ConditionTemplate = z.infer<typeof ConditionTemplateSchema>

// メインの生成パラメータの型
export const GenerationParametersSchema = z.object({
  // 日程条件
  dateRange: DateRangeSchema,
  excludedDates: z.array(z.date()),
  
  // パート条件
  partRequirements: z.array(PartRequirementsSchema),
  
  // 会場条件
  venueSelection: VenueSelectionSchema,
  
  // 時間制約
  timeConstraints: TimeConstraintsSchema,
  
  // 生成オプション
  options: z.object({
    allowConflicts: z.boolean().default(false),
    prioritizeBalance: z.boolean().default(true),
    maxIterations: z.number().min(1).max(1000).default(100),
  }),
})

export type GenerationParameters = z.infer<typeof GenerationParametersSchema>

// 検証状態の型
export const ValidationStateSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    type: z.enum(['error', 'warning', 'info']),
  })),
  warnings: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })),
  score: z.number().min(0).max(100).optional(),
})

export type ValidationState = z.infer<typeof ValidationStateSchema>

// デフォルト値
export const DEFAULT_GENERATION_PARAMETERS: Partial<GenerationParameters> = {
  dateRange: {
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
  },
  excludedDates: [],
  partRequirements: [],
  venueSelection: {
    selectedVenueIds: [],
    venueOrder: [],
    requiredEquipmentIds: [],
  },
  timeConstraints: {
    monday: [{ startHour: 9, endHour: 17 }],
    tuesday: [{ startHour: 9, endHour: 17 }],
    wednesday: [{ startHour: 9, endHour: 17 }],
    thursday: [{ startHour: 9, endHour: 17 }],
    friday: [{ startHour: 9, endHour: 17 }],
    saturday: [{ startHour: 10, endHour: 16 }],
    sunday: [],
  },
  options: {
    allowConflicts: false,
    prioritizeBalance: true,
    maxIterations: 100,
  },
}