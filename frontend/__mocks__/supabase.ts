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

/**
 * Supabaseクエリビルダーのモックを作成するファクトリ関数
 * select/insert/update/delete/eq/order/single/in/ilikeのチェーンをサポート
 *
 * 使用例:
 *   const query = createMockSupabaseQuery({ data: [{ id: '1' }], error: null });
 *   mockSupabaseClient.from.mockReturnValue(query);
 *
 * チェーン終端(single/order/then)の戻り値を設定:
 *   const query = createMockSupabaseQuery({ data: { id: '1' }, error: null });
 */
export function createMockSupabaseQuery(
  result: { data: unknown; error: unknown } = { data: null, error: null }
) {
  const resolvedResult = Promise.resolve(result);

  const query: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => resolvedResult),
    maybeSingle: vi.fn().mockImplementation(() => resolvedResult),
    then: vi.fn().mockImplementation((resolve) => resolvedResult.then(resolve)),
  };

  // チェーンメソッドが自分自身を返すように設定
  const chainMethods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'ilike', 'order', 'limit', 'range',
  ];
  for (const method of chainMethods) {
    query[method].mockReturnValue(
      new Proxy(query, {
        get(target, prop) {
          if (prop === 'then') {
            return (resolve: (value: unknown) => unknown) => resolvedResult.then(resolve);
          }
          return target[prop as string];
        },
      })
    );
  }

  return query;
}

export const mockSupabaseClient = {
  auth: mockSupabaseAuth,
  from: vi.fn().mockReturnValue(
    createMockSupabaseQuery()
  ),
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))
