// イベント型定義
export interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: string; // YYYY-MM-DD形式
  start_time?: string; // HH:MM:SS形式
  end_time?: string; // HH:MM:SS形式
  location?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

// ラウンド型定義
export interface Round {
  id: string;
  event_id: string;
  round_number: number;
  round_name: string;
  description?: string;
  start_time?: string; // HH:MM:SS形式
  end_time?: string; // HH:MM:SS形式
  status: string;
  created_at?: string;
  updated_at?: string;
}

// イベント作成リクエスト
export interface CreateEventRequest {
  id?: string;
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  status?: string;
}

// イベント更新リクエスト
export interface UpdateEventRequest {
  title?: string;
  description?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  status?: string;
}

// ラウンド作成リクエスト
export interface CreateRoundRequest {
  event_id: string;
  round_number: number;
  round_name: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
}

// ラウンド更新リクエスト
export interface UpdateRoundRequest {
  round_number?: number;
  round_name?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
}

// ラウンド情報を含むイベント
export interface EventWithRounds extends Event {
  rounds: Round[];
}
