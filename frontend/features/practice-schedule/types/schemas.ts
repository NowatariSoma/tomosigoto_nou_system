import { z } from 'zod';

// 会場情報のZodスキーマ
export const VenueSchema = z.object({
  id: z.string(),
  name: z.string(),
  campus: z.string().optional().default(''),
});

export type Venue = z.infer<typeof VenueSchema>;

// APIレスポンスの会場スキーマ（nullやundefinedを許容し、デフォルト値で補完）
export const ApiVenueSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  campus: z.string().nullable().optional(),
}).transform((data) => ({
  id: data.id || '',
  name: data.name || '会場未設定',
  campus: data.campus || '',
}));

// 練習スケジュールAPIレスポンスのZodスキーマ
export const PracticeScheduleApiResponseSchema = z.object({
  id: z.string(),
  schedule_date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  division_count: z.number().optional(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  schedule_type: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  created_by: z.string().nullable().optional(),
  updated_by: z.string().nullable().optional(),
  // 複数部屋選択対応
  venue_ids: z.array(z.string()).nullable().optional(),
  venues: z.array(ApiVenueSchema).nullable().optional(),
});

export type PracticeScheduleApiResponse = z.infer<typeof PracticeScheduleApiResponseSchema>;

// 練習スケジュールAPIレスポンス配列のスキーマ
export const PracticeScheduleApiResponseArraySchema = z.array(PracticeScheduleApiResponseSchema);

// 練習スケジュール（フロントエンド用）のZodスキーマ
export const PracticeScheduleSchema = z.object({
  id: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  venueId: z.string(),
  venueName: z.string(),
  campus: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // 複数部屋選択対応
  venueIds: z.array(z.string()).optional(),
  venues: z.array(VenueSchema).optional(),
});

export type PracticeScheduleFromSchema = z.infer<typeof PracticeScheduleSchema>;

// APIレスポンスをフロントエンド用に変換するスキーマ
export const transformApiResponseToSchedule = (apiResponse: unknown): PracticeScheduleFromSchema => {
  // まずAPIレスポンスをパースして検証
  const parsed = PracticeScheduleApiResponseSchema.safeParse(apiResponse);

  if (!parsed.success) {
    console.error('API response validation failed:', parsed.error);
    // フォールバック: 最低限のデータを返す
    return {
      id: '',
      date: '',
      startTime: '',
      endTime: '',
      venueId: '',
      venueName: '',
      campus: '',
      createdAt: '',
      updatedAt: '',
    };
  }

  const data = parsed.data;

  // 会場情報を正規化（必ず有効な値を持つようにする）
  const venues = (data.venues || []).map(v => ({
    id: v.id || '',
    name: v.name || '会場未設定',
    campus: v.campus || '',
  })).filter(v => v.id); // 空のIDは除外

  // メインの会場情報を取得
  const primaryVenue = venues[0];

  return {
    id: data.id || '',
    date: data.schedule_date || '',
    startTime: data.start_time || '',
    endTime: data.end_time || '',
    venueId: data.venue_ids?.[0] || primaryVenue?.id || '',
    venueName: primaryVenue?.name || '',
    campus: primaryVenue?.campus || '',
    title: data.title || '',
    description: data.description || '',
    createdAt: data.created_at || '',
    updatedAt: data.updated_at || '',
    venueIds: data.venue_ids || [],
    venues: venues,
  };
};

// 複数のAPIレスポンスを変換
export const transformApiResponsesToSchedules = (apiResponses: unknown[]): PracticeScheduleFromSchema[] => {
  return apiResponses.map(transformApiResponseToSchedule);
};
