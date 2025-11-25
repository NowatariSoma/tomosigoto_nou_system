// API関連の定数
export const API_ENDPOINTS = {
  CONTACTS: '/contacts/',
} as const;

// カテゴリ関連の定数
export const CATEGORY = {
  BUG: 'bug',
  FEATURE: 'feature',
  QUESTION: 'question',
  OTHER: 'other',
} as const;

// カテゴリの日本語表示名
export const CATEGORY_LABELS = {
  [CATEGORY.BUG]: 'バグ報告',
  [CATEGORY.FEATURE]: '機能要望',
  [CATEGORY.QUESTION]: '質問',
  [CATEGORY.OTHER]: 'その他',
} as const;

// UI表示用テキスト
export const UI_TEXT = {
  LOADING_TEXT: '送信中...',
  SUCCESS_MESSAGE: 'お問い合わせを送信しました',
  ERROR_MESSAGE: 'お問い合わせの送信に失敗しました',
  CATEGORY_LABEL: 'カテゴリ',
  CONTENT_LABEL: '内容',
  SUBMIT_BUTTON: '送信',
  CONTENT_PLACEHOLDER: 'お問い合わせ内容を入力してください',
} as const;

// フォーム初期値
export const INITIAL_CONTACT_FORM = {
  category: CATEGORY.QUESTION,
  content: '',
} as const;

