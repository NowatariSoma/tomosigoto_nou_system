# コーディングガイドライン

## 目次
1. [はじめに](#はじめに)
2. [ファイル構成](#ファイル構成)
3. [命名規則](#命名規則)
4. [インポートとエクスポート](#インポートとエクスポート)
5. [コンポーネント](#コンポーネント)
6. [フック](#フック)
7. [型定義](#型定義)
8. [ユーティリティ関数](#ユーティリティ関数)

## はじめに
このドキュメントは、練習表自動生成システムのフロントエンド開発における一貫性のあるコーディング規約を定義しています。すべての開発者はこのガイドラインに従ってコードを書くことが推奨されます。

## ファイル構成
プロジェクトは機能ごとにディレクトリを分割し、関連ファイルをグループ化します。

```
src/
├── app/                 # Appルーターコンポーネント
├── components/          # 共通コンポーネント
│   ├── common/          # 汎用コンポーネント
│   ├── layout/          # レイアウトコンポーネント
│   └── forms/           # フォームコンポーネント
├── config/              # アプリケーション設定
├── lib/                 # ユーティリティライブラリ
│   ├── api/             # APIクライアント
│   ├── hooks/           # カスタムフック
│   └── context/         # Reactコンテキスト
└── types/               # TypeScript型定義
```

## 命名規則
- **ファイル名**: コンポーネントはパスカルケース（例: `UserProfile.tsx`）、それ以外はキャメルケース（例: `useAuth.ts`）
- **変数名・関数名**: キャメルケース（例: `getUserData`）
- **型・インターフェース名**: パスカルケース（例: `UserProfile`）
- **定数**: 大文字のスネークケース（例: `MAX_RETRY_COUNT`）

## インポートとエクスポート

### パスエイリアスの使用
このプロジェクトでは、**必ず**パスエイリアスを使用してファイルをインポートします。相対パスの使用は避けてください。

#### パスエイリアスの使用例
```typescript
// ✅ 良い例: パスエイリアスを使用
import { Button } from '@/components/common/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { User } from '@/types/models';
import { config } from '@/config';

// ❌ 悪い例: 相対パスを使用
import { Button } from '../../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { User } from '../../types/models';
import { config } from '../../config';
```

### インポートの順序
インポートは以下の順序で整理してください：

1. 外部ライブラリのインポート
2. パスエイリアスを使用した内部モジュールのインポート
3. 同一ディレクトリ内のファイルのインポート
4. CSS/SCSSファイルのインポート

各グループの間には空行を入れてください。

```typescript
// 外部ライブラリ
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// 内部モジュール（パスエイリアス使用）
import { Button } from '@/components/common/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { User } from '@/types/models';

// 同一ディレクトリ内
import { ProfileHeader } from './ProfileHeader';
import { ProfileActions } from './ProfileActions';

// スタイル
import './UserProfile.css';
```

## コンポーネント
コンポーネントは基本的に関数コンポーネントとして実装し、可能な限りプレゼンテーショナルコンポーネントとコンテナコンポーネントを分離してください。

```typescript
// ✅ 良い例: 明示的な型定義とパスエイリアス使用
import { FC } from 'react';
import { Button } from '@/components/common/Button';
import { User } from '@/types/models';

interface UserProfileProps {
  user: User;
  onEdit: (userId: string) => void;
}

export const UserProfile: FC<UserProfileProps> = ({ user, onEdit }) => {
  return (
    <div>
      <h2>{user.displayName}</h2>
      <Button onClick={() => onEdit(user.id)}>編集</Button>
    </div>
  );
};
```

## フック
カスタムフックは `use` プレフィックスで始め、単一責任の原則に従って設計してください。

```typescript
// ✅ 良い例: パスエイリアスとフック命名規則
import { useState, useEffect } from 'react';
import { User } from '@/types/models';
import { ApiClient } from '@/lib/api/client';

export const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const apiClient = new ApiClient();
        const response = await apiClient.get<User>(`/users/${userId}`);
        setUser(response.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [userId]);
  
  return { user, loading, error };
};
```

## 型定義
型定義は明示的に行い、any型の使用は可能な限り避けてください。

```typescript
// ✅ 良い例: 明確な型定義
import { User, Role } from '@/types/models';

interface UserProfileState {
  user: User | null;
  roles: Role[];
  isAdmin: boolean;
  loading: boolean;
  error: Error | null;
}

const initialState: UserProfileState = {
  user: null,
  roles: [],
  isAdmin: false,
  loading: false,
  error: null,
};
```

## ユーティリティ関数
ユーティリティ関数は純粋関数として実装し、副作用を含まないようにしてください。

```typescript
// ✅ 良い例: 純粋関数としてのユーティリティ
export const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
  // 日付フォーマット処理
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day);
};
``` 