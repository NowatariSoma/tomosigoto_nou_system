---
description: this is the rule we have to follow when working on frontend
globs: apps/frontend/*/**
alwaysApply: false
---

# 002_frontend.mdc
- このファイルが読み込まれたら必ず「002_frontend.mdcを読み込みました！」と作業着手前にユーザーに必ず伝えてください。

## フロントエンド開発の基本原則

### 1. コンポーネント設計

- **アトミックデザイン**の原則に従う
  - Atoms: ボタン、入力フィールド、アイコンなど
  - Molecules: フォーム、カード、ナビゲーションなど
  - Organisms: ヘッダー、フッター、サイドバーなど
  - Templates: ページレイアウト
  - Pages: 実際のページ

- **コンポーネントの責務**
  - 単一責任の原則を遵守
  - 再利用可能なコンポーネントの作成
  - 適切な粒度での分割

### 2. 状態管理

- **Redux Toolkit**の使用
  - スライスの適切な分割
  - 非同期処理はRTK Queryを使用
  - 状態の正規化

- **ローカル状態**
  - `useState`と`useReducer`の適切な使い分け
  - コンテキストの適切な使用
  - 状態の持ち上げ方の判断

### 3. データフェッチング

- **TanStack Query**の使用
  - キャッシュ戦略の適切な設定
  - エラーハンドリング
  - ローディング状態の管理

- **APIクライアント**
  - Orvalによる自動生成
  - 型安全性の確保
  - エラーハンドリングの統一

### 4. フォーム管理

- **React Hook Form**の使用
  - Zodによるバリデーション
  - フォームの状態管理
  - エラーメッセージの表示

### 5. スタイリング

- **TailwindCSS**の使用
  - ユーティリティファーストの原則
  - カスタムクラスの作成
  - レスポンシブデザイン

- **Radix UI**の活用
  - アクセシビリティの確保
  - カスタマイズ可能なコンポーネント
  - キーボード操作のサポート

## ディレクトリ構造

```
apps/frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 認証関連ページ
│   │   ├── (dashboard)/       # ダッシュボード関連ページ
│   │   └── layout.tsx         # ルートレイアウト
│   ├── components/            # 共通コンポーネント
│   │   ├── atoms/            # 最小単位のコンポーネント
│   │   ├── molecules/        # 複数のatomsを組み合わせたコンポーネント
│   │   ├── organisms/        # 複数のmoleculesを組み合わせたコンポーネント
│   │   └── templates/        # ページレイアウト
│   ├── features/             # 機能単位のコンポーネント
│   │   ├── auth/            # 認証関連
│   │   ├── dashboard/       # ダッシュボード関連
│   │   └── settings/        # 設定関連
│   ├── hooks/               # カスタムフック
│   ├── lib/                 # ユーティリティ関数
│   ├── store/               # Reduxストア
│   │   ├── slices/         # Reduxスライス
│   │   └── api/            # RTK Query
│   ├── styles/             # グローバルスタイル
│   └── types/              # 型定義
└── public/                 # 静的ファイル
```

## コンポーネントの実装例

### アトム（Button.tsx）

```typescript
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
```

### 分子（Form.tsx）

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

const formSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
});

type FormValues = z.infer<typeof formSchema>;

export const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      // ログイン処理
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          type="email"
          placeholder="メールアドレス"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>
      <div>
        <Input
          type="password"
          placeholder="パスワード"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'ログイン中...' : 'ログイン'}
      </Button>
    </form>
  );
};
```

### 有機体（Header.tsx）

```typescript
import { useSession } from 'next-auth/react';
import { Button } from '@/components/atoms/Button';
import { UserMenu } from '@/components/molecules/UserMenu';

export const Header = () => {
  const { data: session } = useSession();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">アプリ名</h1>
          <nav className="hidden md:flex space-x-4">
            <a href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ダッシュボード
            </a>
            <a href="/projects" className="text-gray-600 hover:text-gray-900">
              プロジェクト
            </a>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          {session ? (
            <UserMenu user={session.user} />
          ) : (
            <Button variant="outline" href="/login">
              ログイン
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
```

## 状態管理の実装例

### Reduxスライス（authSlice.ts）

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
});

export const { setUser, setLoading, setError, logout } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;

export default authSlice.reducer;
```

### RTK Query（authApi.ts）

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { User, LoginRequest, RegisterRequest } from '@/types';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    login: builder.mutation<User, LoginRequest>({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<User, RegisterRequest>({
      query: (userData) => ({
        url: 'auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    getCurrentUser: builder.query<User, void>({
      query: () => 'auth/me',
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
} = authApi;
```

## データフェッチングの実装例

### TanStack Query（useUsers.ts）

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import type { User, CreateUserRequest, UpdateUserRequest } from '@/types';

export const useUsers = () => {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
  });

  const createUser = useMutation({
    mutationFn: (data: CreateUserRequest) => usersApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      usersApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    users,
    isLoading,
    createUser,
    updateUser,
    deleteUser,
  };
};
```

## フォームの実装例

### React Hook Form + Zod（UserForm.tsx）

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';

const userSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  role: z.enum(['admin', 'user', 'guest'], {
    required_error: 'ロールを選択してください',
  }),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: Partial<UserFormValues>;
  onSubmit: (data: UserFormValues) => Promise<void>;
}

export const UserForm = ({ initialData, onSubmit }: UserFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          label="名前"
          {...register('name')}
          error={errors.name?.message}
        />
      </div>
      <div>
        <Input
          label="メールアドレス"
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />
      </div>
      <div>
        <Select
          label="ロール"
          {...register('role')}
          error={errors.role?.message}
        >
          <option value="admin">管理者</option>
          <option value="user">一般ユーザー</option>
          <option value="guest">ゲスト</option>
        </Select>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '送信中...' : '保存'}
      </Button>
    </form>
  );
};
```

## スタイリングの実装例

### TailwindCSS（Card.tsx）

```typescript
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered';
}

export const Card = ({
  className,
  variant = 'default',
  children,
  ...props
}: CardProps) => {
  return (
    <div
      className={cn(
        'rounded-lg bg-white shadow-sm',
        variant === 'bordered' && 'border border-gray-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
);

export const CardTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
);

export const CardDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn('text-sm text-gray-500', className)}
    {...props}
  />
);

export const CardContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6 pt-0', className)} {...props} />
);

export const CardFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
);
```

## テストの実装例

### コンポーネントテスト（Button.test.tsx）

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByText('Delete');
    expect(button).toHaveClass('bg-destructive');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Submit</Button>);
    const button = screen.getByText('Submit');
    expect(button).toBeDisabled();
  });
});
```

### フックテスト（useUsers.test.ts）

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useUsers } from './useUsers';
import { usersApi } from '@/api/users';

jest.mock('@/api/users');

describe('useUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches users on mount', async () => {
    const mockUsers = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' },
    ];

    (usersApi.getUsers as jest.Mock).mockResolvedValue(mockUsers);

    const { result, waitForNextUpdate } = renderHook(() => useUsers());

    expect(result.current.isLoading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.users).toEqual(mockUsers);
    expect(result.current.isLoading).toBe(false);
  });

  it('creates a new user', async () => {
    const newUser = { name: 'New User', email: 'new@example.com' };
    const createdUser = { id: '3', ...newUser };

    (usersApi.createUser as jest.Mock).mockResolvedValue(createdUser);

    const { result } = renderHook(() => useUsers());

    await act(async () => {
      await result.current.createUser.mutateAsync(newUser);
    });

    expect(usersApi.createUser).toHaveBeenCalledWith(newUser);
  });
});
```

## エラーハンドリング

### エラーバウンダリ（ErrorBoundary.tsx）

```typescript
import React from 'react';
import { Button } from '@/components/atoms/Button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">エラーが発生しました</h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || '予期せぬエラーが発生しました'}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              再読み込み
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### エラーハンドリングフック（useErrorHandler.ts）

```typescript
import { useCallback } from 'react';
import { useToast } from '@/hooks/useToast';

export const useErrorHandler = () => {
  const { showToast } = useToast();

  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof Error) {
        showToast({
          title: 'エラー',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        showToast({
          title: 'エラー',
          description: '予期せぬエラーが発生しました',
          variant: 'destructive',
        });
      }

      console.error('Error:', error);
    },
    [showToast]
  );

  return { handleError };
};
```

## パフォーマンス最適化

### メモ化（MemoizedComponent.tsx）

```typescript
import { memo } from 'react';
import { useCallback } from 'react';

interface Props {
  data: string[];
  onItemClick: (item: string) => void;
}

export const MemoizedList = memo(function MemoizedList({
  data,
  onItemClick,
}: Props) {
  const handleClick = useCallback(
    (item: string) => {
      onItemClick(item);
    },
    [onItemClick]
  );

  return (
    <ul className="space-y-2">
      {data.map((item) => (
        <li
          key={item}
          onClick={() => handleClick(item)}
          className="cursor-pointer hover:bg-gray-100 p-2 rounded"
        >
          {item}
        </li>
      ))}
    </ul>
  );
});
```

### 仮想化リスト（VirtualizedList.tsx）

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface Props {
  items: string[];
  height: number;
}

export const VirtualizedList = ({ items, height }: Props) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      style={{
        height,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
            className="flex items-center px-4 hover:bg-gray-100"
          >
            {items[virtualRow.index]}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## アクセシビリティ

### アクセシブルなモーダル（Modal.tsx）

```typescript
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}: ModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) {
          onClose();
        }
      }}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'bg-white rounded-lg shadow-xl max-w-lg w-full',
          className
        )}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
};
```

## 国際化（i18n）

### 翻訳ファイル（ja.json）

```json
{
  "common": {
    "save": "保存",
    "cancel": "キャンセル",
    "delete": "削除",
    "edit": "編集",
    "loading": "読み込み中..."
  },
  "auth": {
    "login": "ログイン",
    "logout": "ログアウト",
    "register": "新規登録",
    "email": "メールアドレス",
    "password": "パスワード"
  },
  "validation": {
    "required": "{{field}}は必須です",
    "email": "有効なメールアドレスを入力してください",
    "minLength": "{{field}}は{{min}}文字以上で入力してください"
  }
}
```

### 翻訳フック（useTranslation.ts）

```typescript
import { useCallback } from 'react';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

i18next.use(initReactI18next).init({
  resources: {
    ja: {
      translation: require('./locales/ja.json'),
    },
  },
  lng: 'ja',
  fallbackLng: 'ja',
  interpolation: {
    escapeValue: false,
  },
});

export const useTranslation = () => {
  const t = useCallback(
    (key: string, options?: Record<string, any>) => {
      return i18next.t(key, options);
    },
    []
  );

  return { t };
};
```

## セキュリティ

### CSRF対策（csrf.ts）

```typescript
import { getCsrfToken } from 'next-auth/react';

export const getCsrfHeaders = async () => {
  const csrfToken = await getCsrfToken();
  return {
    'X-CSRF-Token': csrfToken || '',
  };
};
```

### XSS対策（sanitize.ts）

```typescript
import DOMPurify from 'dompurify';

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  });
};
```

## パフォーマンスモニタリング

### パフォーマンス計測（usePerformance.ts）

```typescript
import { useEffect } from 'react';

export const usePerformance = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`${componentName} render time: ${duration}ms`);

      // パフォーマンスメトリクスの送信
      if (duration > 100) {
        console.warn(`${componentName} took longer than 100ms to render`);
      }
    };
  }, [componentName]);
};
```

### エラートラッキング（errorTracking.ts）

```typescript
import * as Sentry from '@sentry/nextjs';

export const initializeErrorTracking = () => {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
      environment: process.env.NODE_ENV,
    });
  }
};

export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    extra: context,
  });
};
``` 