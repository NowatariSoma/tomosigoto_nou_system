import { StageData } from '../types';

// API関連の定数
export const API_ENDPOINTS = {
  STAGES: '/stages/',
} as const;

export const UI_TEXT = {
  TITLE: '舞台・パート登録画面',
  NEW_REGISTRATION: '新しく登録する',
  REGISTRATION_TITLE: '新規登録',
  REGISTERED_STAGES: '登録済み舞台',
  NO_STAGES: '登録された舞台はありません',
  START_MESSAGE: '「新しく登録する」ボタンから始めましょう',
  DATE_LABEL: '日付',
  STAGE_NAME_LABEL: '舞台名',
  STAGE_NAME_PLACEHOLDER: '舞台名を入力してください',
  PART_LABEL: 'パート',
  PART_PLACEHOLDER: '名',
  CANCEL: 'キャンセル',
  REGISTER: '登録する',
  NOT_SET: '未設定',
  LOADING_TEXT: '読み込み中...',
} as const;

export const PART_COUNT_LIMITS = {
  MIN: 1,
  MAX: 10,
  DEFAULT: 3,
} as const;

export const MOCK_DATA: StageData[] = [
  {
    id: '1',
    date: '2024-03-15',
    stageName: 'ハムレット',
    parts: ['淡路パート', '佐藤花子', '鈴木次郎'],
    partCount: 3
  },
  {
    id: '2',
    date: '2024-03-22',
    stageName: 'ロミオとジュリエット',
    parts: ['山田一郎', '高橋美咲', ''],
    partCount: 3
  },
  {
    id: '3',
    date: '2024-04-05',
    stageName: 'マクベス',
    parts: ['伊藤健太', '', '渡辺真理'],
    partCount: 3
  },
  {
    id: '4',
    date: '2024-04-12',
    stageName: '夏の夜の夢',
    parts: ['小林優子', '中村大輔', '松本さくら'],
    partCount: 3
  },
  {
    id: '5',
    date: '2024-04-20',
    stageName: 'オセロ',
    parts: ['森田和也', '岡田麻衣', ''],
    partCount: 3
  }
];
