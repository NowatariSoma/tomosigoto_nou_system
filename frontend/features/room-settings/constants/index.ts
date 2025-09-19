// API関連の定数
export const API_ENDPOINTS = {
  VENUES: '/venues/',
} as const;

// キャンパス関連の定数
export const CAMPUS = {
  IMADEGAWA: '今出川',
  KYOTANABE: '京田辺',
} as const;

export type Campus = typeof CAMPUS[keyof typeof CAMPUS];

// フォーム初期値
export const INITIAL_ROOM_FORM = {
  id: '',
  name: '',
  campus: CAMPUS.KYOTANABE,
  capacity: 0,
  danceAllowed: false,
  description: '',
  location: ''
} as const;

// UI表示用テキスト
export const UI_TEXT = {
  DANCE_ALLOWED: '可能',
  DANCE_NOT_ALLOWED: '不可',
  LOADING_TEXT: '読み込み中...',
  NO_ROOM_DATA: '会場データがありません',
  CAMPUS_SUFFIX: 'キャンパス',
  DANCE_KEYWORD: '舞',
} as const;

// デフォルト値
export const DEFAULTS = {
  CAMPUS: CAMPUS.KYOTANABE,
  CAPACITY: 0,
  DANCE_ALLOWED: false,
} as const;