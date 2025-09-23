// API関連の定数
export const API_ENDPOINTS = {
  ACCOUNT_SETTING: '/api/v1/account-setting',
  PROFILE: '/api/v1/account-setting/profile',
  PROFILE_PUBLIC: '/api/v1/account-setting/profile-public',
  DEPARTMENTS: '/api/v1/account-setting/departments',
  VALIDATE: '/api/v1/account-setting/validate-public',
} as const;

// 学部関連の定数
export const DEPARTMENT = {
  DEFAULT_CODE: 'LIT',
  DEFAULT_NAME: '文学部',
} as const;

// フォーム初期値（空の状態）
export const INITIAL_ACCOUNT_FORM = {
  student_id: '',
  last_name_kanji: '',
  first_name_kanji: '',
  last_name_katakana: '',
  first_name_katakana: '',
  year: 1,
  department_code: '',
  email: ''
} as const;

// UI表示用テキスト
export const UI_TEXT = {
  LOADING_TEXT: '読み込み中...',
  SAVING_TEXT: '保存中...',
  SUCCESS_MESSAGE: 'プロフィールが正常に保存されました',
  ERROR_MESSAGE: 'エラーが発生しました',
  VALIDATION_ERROR: '入力内容に問題があります',
  NEW_USER_BUTTON: '新しいユーザーで開始',
  SAVE_BUTTON: '保存',
} as const;

// バリデーション関連の定数
export const VALIDATION = {
  MIN_YEAR: 1,
  MAX_YEAR: 6,
  STUDENT_ID_LENGTH: 10,
} as const;

// デフォルト値
export const DEFAULTS = {
  DEPARTMENT_CODE: DEPARTMENT.DEFAULT_CODE,
  DEPARTMENT_NAME: DEPARTMENT.DEFAULT_NAME,
  YEAR: 1,
  EMAIL: '',
} as const;
