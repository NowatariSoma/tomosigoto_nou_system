/**
 * GitHub Pages デモ (PAGES_EXPORT=1) 専用の Supabase クライアント代替。
 *
 * デモには Supabase が存在しないため、
 *   - 認証（gotrue）        … デモユーザーとしてログイン済みの状態を返す
 *   - PostgREST（.from()）  … インメモリの架空データに対する簡易クエリビルダ
 * を依存ゼロで実装している。
 *
 * 対応しているのはアプリが実際に使っているメソッドのみ:
 *   select / insert / update / delete / eq / in / ilike / order / limit / single
 */

import { DEMO_ACCESS_TOKEN, demoAuthUser } from './api';
import { DEMO_USER, departmentByCode, fullNameKanji, ts } from './fixtures';
import { demoId, nowIso, store } from './store';
import './install-fetch';

// ---------------------------------------------------------------------------
// 認証（gotrue の代替）
// ---------------------------------------------------------------------------

type AuthChangeHandler = (event: string, session: unknown) => void | Promise<void>;

function buildSession() {
  return {
    access_token: DEMO_ACCESS_TOKEN,
    refresh_token: 'demo-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: demoAuthUser(),
  };
}

// デモは「ログイン済み」から始まる。ログアウトすると null になり、
// ログイン画面で任意のメールアドレス／パスワードを入れれば再度ログインできる。
let currentSession: ReturnType<typeof buildSession> | null = buildSession();
const listeners = new Set<AuthChangeHandler>();

function emit(event: string) {
  listeners.forEach((handler) => {
    try {
      void handler(event, currentSession);
    } catch {
      /* デモではリスナーのエラーは無視する */
    }
  });
}

const auth = {
  async getUser() {
    return { data: { user: currentSession?.user ?? null }, error: null };
  },
  async getSession() {
    return { data: { session: currentSession }, error: null };
  },
  async signInWithPassword({ email }: { email: string; password: string }) {
    currentSession = buildSession();
    if (email) {
      currentSession.user = { ...currentSession.user, email };
    }
    setTimeout(() => emit('SIGNED_IN'), 0);
    return { data: { user: currentSession.user, session: currentSession }, error: null };
  },
  async signUp({ email }: { email: string; password: string }) {
    currentSession = buildSession();
    if (email) {
      currentSession.user = { ...currentSession.user, email };
    }
    setTimeout(() => emit('SIGNED_IN'), 0);
    return { data: { user: currentSession.user, session: currentSession }, error: null };
  },
  async signOut() {
    currentSession = null;
    setTimeout(() => emit('SIGNED_OUT'), 0);
    return { error: null };
  },
  async refreshSession() {
    return { data: { session: currentSession, user: currentSession?.user ?? null }, error: null };
  },
  onAuthStateChange(handler: AuthChangeHandler) {
    listeners.add(handler);
    // 実際の supabase-js と同じく、購読直後に初期状態を通知する
    setTimeout(() => {
      try {
        void handler('INITIAL_SESSION', currentSession);
      } catch {
        /* noop */
      }
    }, 0);
    return {
      data: {
        subscription: {
          id: demoId('sub'),
          unsubscribe() {
            listeners.delete(handler);
          },
        },
      },
    };
  },
};

// ---------------------------------------------------------------------------
// PostgREST の代替（テーブルのスナップショット）
// ---------------------------------------------------------------------------

type Row = Record<string, any>;

function assignmentRow(ma: (typeof store.memberAssignments)[number]): Row {
  return {
    id: ma.id,
    user_id: ma.user_id,
    part_id: ma.part_id,
    category: ma.category,
    display_order: ma.display_order,
    created_at: ma.created_at,
    updated_at: ma.updated_at,
  };
}

/** クエリ時点の store から、埋め込みリレーション込みの行を組み立てる */
function snapshot(table: string): Row[] {
  switch (table) {
    case 'stages':
      return store.stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        description: stage.description,
        performance_date: stage.performance_date,
        status: stage.status,
        created_at: ts('2026-04-01'),
        updated_at: ts('2026-04-01'),
        parts: store.parts
          .filter((p) => p.stage_id === stage.id)
          .map((p) => ({
            id: p.id,
            name: p.name,
            stage_id: p.stage_id,
            description: p.description,
            status: p.status,
            member_assignments: store.memberAssignments
              .filter((ma) => ma.part_id === p.id)
              .map(assignmentRow),
          })),
      }));

    case 'parts':
      return store.parts.map((part) => {
        const stage = store.stages.find((s) => s.id === part.stage_id);
        return {
          id: part.id,
          name: part.name,
          stage_id: part.stage_id,
          description: part.description,
          status: part.status,
          created_at: ts('2026-04-01'),
          updated_at: ts('2026-04-01'),
          stage: stage
            ? { id: stage.id, name: stage.name, performance_date: stage.performance_date }
            : null,
          member_assignments: store.memberAssignments
            .filter((ma) => ma.part_id === part.id)
            .map(assignmentRow),
        };
      });

    case 'member_assignments':
      return store.memberAssignments.map((ma) => {
        const part = store.parts.find((p) => p.id === ma.part_id);
        const stage = part ? store.stages.find((s) => s.id === part.stage_id) : undefined;
        return {
          ...assignmentRow(ma),
          part: part
            ? {
                id: part.id,
                name: part.name,
                stage_id: part.stage_id,
                stage: stage
                  ? { id: stage.id, name: stage.name, performance_date: stage.performance_date }
                  : null,
              }
            : null,
        };
      });

    case 'account_setting_profile':
      return store.members.map((m) => ({
        id: `profile-${m.id}`,
        user_id: m.id,
        student_id: m.studentId,
        first_name_kanji: m.firstKanji,
        first_name_katakana: m.firstKana,
        last_name_kanji: m.lastKanji,
        last_name_katakana: m.lastKana,
        grade: m.grade,
        year: m.grade,
        department_code: m.departmentCode,
        department_name: departmentByCode(m.departmentCode).department_name,
        email: m.email,
        name: fullNameKanji(m),
        created_at: ts('2026-04-01'),
        updated_at: ts('2026-04-01'),
      }));

    case 'venues':
      return store.venues.map((v) => ({ ...v }));

    case 'practice_schedules':
      return store.schedules.map((s) => ({ ...s }));

    default:
      return [];
  }
}

function readPath(row: Row, path: string): unknown {
  return path.split('.').reduce<any>((acc, key) => (acc == null ? acc : acc[key]), row);
}

interface Filter {
  kind: 'eq' | 'neq' | 'in' | 'ilike';
  column: string;
  value: unknown;
}

class DemoQuery implements PromiseLike<{ data: unknown; error: unknown }> {
  private filters: Filter[] = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private singleMode = false;
  private mutation: { kind: 'insert' | 'update' | 'delete'; payload?: Row | Row[] } | null = null;

  constructor(private readonly table: string) {}

  select(_columns?: string) {
    return this;
  }

  insert(payload: Row | Row[]) {
    this.mutation = { kind: 'insert', payload };
    return this;
  }

  update(payload: Row) {
    this.mutation = { kind: 'update', payload };
    return this;
  }

  delete() {
    this.mutation = { kind: 'delete' };
    return this;
  }

  upsert(payload: Row | Row[]) {
    this.mutation = { kind: 'insert', payload };
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ kind: 'eq', column, value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ kind: 'neq', column, value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ kind: 'in', column, value });
    return this;
  }

  ilike(column: string, value: string) {
    this.filters.push({ kind: 'ilike', column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending !== false };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleMode = true;
    return this;
  }

  maybeSingle() {
    this.singleMode = true;
    return this;
  }

  private matches(row: Row): boolean {
    return this.filters.every((filter) => {
      const actual = readPath(row, filter.column);
      switch (filter.kind) {
        case 'eq':
          return String(actual) === String(filter.value);
        case 'neq':
          return String(actual) !== String(filter.value);
        case 'in':
          return (filter.value as unknown[]).some((v) => String(v) === String(actual));
        case 'ilike': {
          const pattern = String(filter.value).replace(/%/g, '').toLowerCase();
          return String(actual ?? '').toLowerCase().includes(pattern);
        }
        default:
          return true;
      }
    });
  }

  private runMutation(): { data: unknown; error: unknown } {
    const mutation = this.mutation!;

    if (mutation.kind === 'insert') {
      const items = Array.isArray(mutation.payload) ? mutation.payload : [mutation.payload!];
      const inserted = items.map((item) => this.insertRow(item));
      const data = Array.isArray(mutation.payload) ? inserted : inserted[0];
      return { data: this.singleMode ? inserted[0] : data, error: null };
    }

    if (mutation.kind === 'update') {
      const targets = snapshot(this.table).filter((row) => this.matches(row));
      const updated = targets.map((row) => this.updateRow(row.id, mutation.payload as Row));
      return { data: this.singleMode ? updated[0] ?? null : updated, error: null };
    }

    const targets = snapshot(this.table).filter((row) => this.matches(row));
    targets.forEach((row) => this.deleteRow(row.id));
    return { data: null, error: null };
  }

  private insertRow(item: Row): Row {
    const id = String(item.id ?? demoId(this.table));
    const timestamps = { created_at: nowIso(), updated_at: nowIso() };

    if (this.table === 'stages') {
      store.stages.push({
        id,
        name: String(item.name ?? '新しい舞台'),
        description: String(item.description ?? ''),
        performance_date: String(item.performance_date ?? ''),
        status: (item.status as 'active' | 'inactive') ?? 'active',
      });
    } else if (this.table === 'parts') {
      store.parts.push({
        id,
        stage_id: String(item.stage_id ?? ''),
        name: String(item.name ?? '新しいパート'),
        description: String(item.description ?? ''),
        status: (item.status as 'active' | 'inactive') ?? 'active',
        color: '#64748b',
      });
    } else if (this.table === 'member_assignments') {
      store.memberAssignments.push({
        id,
        user_id: String(item.user_id ?? ''),
        part_id: String(item.part_id ?? ''),
        category: (item.category as 'utai' | 'mai') ?? 'utai',
        display_order: Number(item.display_order ?? 0),
        ...timestamps,
      });
    }

    const row = snapshot(this.table).find((r) => r.id === id);
    return row ?? { ...item, id, ...timestamps };
  }

  private updateRow(id: string, payload: Row): Row {
    if (this.table === 'stages') {
      const target = store.stages.find((s) => s.id === id);
      if (target) Object.assign(target, payload);
    } else if (this.table === 'parts') {
      const target = store.parts.find((p) => p.id === id);
      if (target) Object.assign(target, payload);
    } else if (this.table === 'member_assignments') {
      const target = store.memberAssignments.find((ma) => ma.id === id);
      if (target) Object.assign(target, payload, { updated_at: nowIso() });
    }
    return snapshot(this.table).find((r) => r.id === id) ?? { id, ...payload };
  }

  private deleteRow(id: string) {
    if (this.table === 'stages') {
      store.stages = store.stages.filter((s) => s.id !== id);
      const removedParts = store.parts.filter((p) => p.stage_id === id).map((p) => p.id);
      store.parts = store.parts.filter((p) => p.stage_id !== id);
      store.memberAssignments = store.memberAssignments.filter(
        (ma) => !removedParts.includes(ma.part_id)
      );
    } else if (this.table === 'parts') {
      store.parts = store.parts.filter((p) => p.id !== id);
      store.memberAssignments = store.memberAssignments.filter((ma) => ma.part_id !== id);
    } else if (this.table === 'member_assignments') {
      store.memberAssignments = store.memberAssignments.filter((ma) => ma.id !== id);
    }
  }

  private run(): { data: unknown; error: unknown } {
    if (this.mutation) return this.runMutation();

    let rows = snapshot(this.table).filter((row) => this.matches(row));

    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      rows = [...rows].sort((a, b) => {
        const av = readPath(a, column);
        const bv = readPath(b, column);
        if (av == null && bv == null) return 0;
        if (av == null) return ascending ? -1 : 1;
        if (bv == null) return ascending ? 1 : -1;
        const cmp = String(av).localeCompare(String(bv), 'ja');
        return ascending ? cmp : -cmp;
      });
    }

    if (this.limitCount != null) rows = rows.slice(0, this.limitCount);

    if (this.singleMode) {
      if (rows.length === 0) {
        return {
          data: null,
          error: { message: 'デモデータに該当する行がありません', code: 'PGRST116' },
        };
      }
      return { data: rows[0], error: null };
    }

    return { data: rows, error: null };
  }

  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected);
  }
}

// ---------------------------------------------------------------------------
// エクスポート
// ---------------------------------------------------------------------------

export const demoSupabase = {
  auth,
  from(table: string) {
    return new DemoQuery(table);
  },
  /** 実クライアントとの互換のためのダミー */
  channel() {
    return {
      on() {
        return this;
      },
      subscribe() {
        return this;
      },
      unsubscribe() {
        return Promise.resolve('ok');
      },
    };
  },
  removeChannel() {
    return Promise.resolve('ok');
  },
};

export const DEMO_USER_ID = DEMO_USER.id;
