// イベント関連の型定義

export interface Event {
  id: string
  title: string
  description?: string
  event_date: string  // YYYY-MM-DD
  start_time?: string  // HH:MM
  end_time?: string  // HH:MM
  event_type?: 'practice' | 'performance' | 'meeting' | 'other'
  status?: 'active' | 'cancelled' | 'completed'
  total_amount?: number
  currency?: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

export interface EventSettlement {
  id: string
  event_id: string
  user_id?: string
  amount: number
  paid_amount?: number
  status?: 'pending' | 'paid' | 'partial' | 'cancelled'
  payment_method?: 'cash' | 'bank_transfer' | 'credit_card' | 'other'
  payment_date?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface EventSettlementSummary {
  event_id: string
  total_amount: number
  total_paid: number
  total_pending: number
  settlement_count: number
  paid_count: number
  pending_count: number
}

export interface EventWithSettlements extends Event {
  settlements: EventSettlement[]
}

export interface CreateEventInput {
  title: string
  description?: string
  event_date: string
  start_time?: string
  end_time?: string
  event_type?: string
  status?: string
  total_amount?: number
  currency?: string
}

export interface UpdateEventInput {
  title?: string
  description?: string
  event_date?: string
  start_time?: string
  end_time?: string
  event_type?: string
  status?: string
  total_amount?: number
  currency?: string
}

export interface CreateSettlementInput {
  event_id: string
  user_id?: string
  amount: number
  paid_amount?: number
  status?: string
  payment_method?: string
  payment_date?: string
  notes?: string
}

export interface UpdateSettlementInput {
  amount?: number
  paid_amount?: number
  status?: string
  payment_method?: string
  payment_date?: string
  notes?: string
}
