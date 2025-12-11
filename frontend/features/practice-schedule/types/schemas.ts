import { z } from 'zod';

// バリデーション定数
const VALIDATION = {
  MAX_DESCRIPTION_LENGTH: 500,
  TIME_FORMAT: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/,
} as const;

// バリデーションエラーメッセージ
const ERROR_MESSAGES = {
  DATE_REQUIRED: '日付は必須です',
  DATE_FORMAT: '正しい日付形式で入力してください (YYYY-MM-DD)',
  START_TIME_REQUIRED: '開始時間は必須です',
  START_TIME_FORMAT: '正しい時間形式で入力してください (HH:MM)',
  END_TIME_REQUIRED: '終了時間は必須です',
  END_TIME_FORMAT: '正しい時間形式で入力してください (HH:MM)',
  END_TIME_AFTER_START: '終了時間は開始時間より後である必要があります',
  VENUE_REQUIRED: '会場は必須です',
  TITLE_REQUIRED: 'タイトルは必須です',
  STAGE_REQUIRED: '舞台は必須です',
  DESCRIPTION_TOO_LONG: `説明は${VALIDATION.MAX_DESCRIPTION_LENGTH}文字以内で入力してください`,
} as const;

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

// ステージ情報のZodスキーマ
export const ApiStageSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
}).transform((data) => ({
  id: data.id || '',
  name: data.name || '',
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
  // ステージ（舞台）選択対応
  stage_id: z.string().nullable().optional(),
  stage: ApiStageSchema.nullable().optional(),
});

export type PracticeScheduleApiResponse = z.infer<typeof PracticeScheduleApiResponseSchema>;

// 練習スケジュールAPIレスポンス配列のスキーマ
export const PracticeScheduleApiResponseArraySchema = z.array(PracticeScheduleApiResponseSchema);

// ステージスキーマ（フロントエンド用）
export const StageSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Stage = z.infer<typeof StageSchema>;

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
  // ステージ（舞台）選択対応
  stageId: z.string().optional(),
  stage: StageSchema.optional(),
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

  // ステージ情報を正規化
  const stage = data.stage ? {
    id: data.stage.id || '',
    name: data.stage.name || '',
  } : undefined;

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
    stageId: data.stage_id || undefined,
    stage: stage,
  };
};

// 複数のAPIレスポンスを変換
export const transformApiResponsesToSchedules = (apiResponses: unknown[]): PracticeScheduleFromSchema[] => {
  return apiResponses.map(transformApiResponseToSchedule);
};

// Room型のZodスキーマ（フォームデータ用）
export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  campus: z.enum(['今出川', '京田辺']),
  capacity: z.number(),
  danceAllowed: z.boolean(),
});

export type RoomFromSchema = z.infer<typeof RoomSchema>;

// フォームデータ用のZodスキーマ（練習スケジュール作成/更新時に使用）
export const PracticeScheduleFormSchema = z.object({
  date: z
    .string()
    .min(1, ERROR_MESSAGES.DATE_REQUIRED)
    .regex(VALIDATION.DATE_FORMAT, ERROR_MESSAGES.DATE_FORMAT),
  startTime: z
    .string()
    .min(1, ERROR_MESSAGES.START_TIME_REQUIRED)
    .regex(VALIDATION.TIME_FORMAT, ERROR_MESSAGES.START_TIME_FORMAT),
  endTime: z
    .string()
    .min(1, ERROR_MESSAGES.END_TIME_REQUIRED)
    .regex(VALIDATION.TIME_FORMAT, ERROR_MESSAGES.END_TIME_FORMAT),
  venueId: z.string(),
  title: z.string().min(1, ERROR_MESSAGES.TITLE_REQUIRED),
  description: z.string().max(VALIDATION.MAX_DESCRIPTION_LENGTH, ERROR_MESSAGES.DESCRIPTION_TOO_LONG),
  venueIds: z.array(z.string()),
  selectedVenues: z.array(RoomSchema),
  stageId: z.string().min(1, ERROR_MESSAGES.STAGE_REQUIRED),
}).refine(
  (data) => {
    // 会場が選択されているか確認
    return data.venueId !== '' || data.venueIds.length > 0;
  },
  {
    message: ERROR_MESSAGES.VENUE_REQUIRED,
    path: ['venueId'],
  }
).refine(
  (data) => {
    // 終了時間が開始時間より後か確認
    if (data.startTime && data.endTime) {
      return data.startTime < data.endTime;
    }
    return true;
  },
  {
    message: ERROR_MESSAGES.END_TIME_AFTER_START,
    path: ['endTime'],
  }
);

export type PracticeScheduleFormDataFromSchema = z.infer<typeof PracticeScheduleFormSchema>;

// バリデーション結果の型
export type ValidationErrors = {
  [key: string]: string | undefined;
};

// フォームデータのバリデーション関数
export const validatePracticeScheduleForm = (data: unknown): { success: true; data: PracticeScheduleFormDataFromSchema } | { success: false; errors: ValidationErrors } => {
  const result = PracticeScheduleFormSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // エラーをフィールド名ごとにまとめる
  const errors: ValidationErrors = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });

  return { success: false, errors };
};

// APIリクエスト用Zodスキーマ（作成時）
export const CreatePracticeScheduleApiRequestSchema = z.object({
  schedule_date: z.string().regex(VALIDATION.DATE_FORMAT),
  start_time: z.string().regex(VALIDATION.TIME_FORMAT),
  end_time: z.string().regex(VALIDATION.TIME_FORMAT),
  division_count: z.number().optional().default(6),
  title: z.string().optional().default(''),
  description: z.string().optional().default(''),
  schedule_type: z.string().optional().default('regular'),
  status: z.string().optional().default('active'),
  venue_ids: z.array(z.string()).optional(),
  stage_id: z.string().min(1, ERROR_MESSAGES.STAGE_REQUIRED).optional(),
});

export type CreatePracticeScheduleApiRequest = z.infer<typeof CreatePracticeScheduleApiRequestSchema>;

// APIリクエスト用Zodスキーマ（更新時）
export const UpdatePracticeScheduleApiRequestSchema = z.object({
  schedule_date: z.string().regex(VALIDATION.DATE_FORMAT).optional(),
  start_time: z.string().regex(VALIDATION.TIME_FORMAT).optional(),
  end_time: z.string().regex(VALIDATION.TIME_FORMAT).optional(),
  division_count: z.number().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  schedule_type: z.string().optional(),
  status: z.string().optional(),
  venue_ids: z.array(z.string()).optional(),
  stage_id: z.string().optional(),
});

export type UpdatePracticeScheduleApiRequest = z.infer<typeof UpdatePracticeScheduleApiRequestSchema>;
