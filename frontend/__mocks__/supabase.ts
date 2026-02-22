import { vi } from 'vitest'

export const mockSupabaseAuth = {
  getSession: vi.fn().mockResolvedValue({
    data: {
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
    },
    error: null,
  }),
  getUser: vi.fn().mockResolvedValue({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    },
    error: null,
  }),
  signInWithPassword: vi.fn().mockResolvedValue({
    data: {
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      },
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    },
    error: null,
  }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  onAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
}

export const mockSupabaseClient = {
  auth: mockSupabaseAuth,
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))
