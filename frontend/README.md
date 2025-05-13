# 練習表自動生成システム - フロントエンド

## 概要
練習表自動生成システムのフロントエンド部分です。Next.jsとTypeScriptで実装されています。

## 技術スタック
- Next.js
- TypeScript
- TailwindCSS
- ESLint
- Prettier

## ディレクトリ構造
```
src/
├── app/          # Appルーターコンポーネント
├── components/   # 共通コンポーネント
├── config/       # アプリケーション設定
├── lib/          # ユーティリティライブラリ
│   ├── api/      # APIクライアント
│   ├── hooks/    # カスタムフック
│   └── context/  # Reactコンテキスト
└── types/        # TypeScript型定義
    ├── api.ts    # API関連の型
    ├── models.ts # ドメインモデル
    └── utility.ts # ユーティリティ型
```

## パスエイリアスの使用
このプロジェクトでは、相対パスの代わりにパスエイリアスを使用しています。これにより、インポートパスの可読性と保守性が向上します。

### パスエイリアスの設定
パスエイリアスは `tsconfig.json` で設定されています：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 使用方法
```typescript
// 推奨：パスエイリアスを使用
import { Something } from '@/components/SomeComponent';
import { useApi } from '@/lib/hooks/useApi';
import { User } from '@/types/models';

// 非推奨：相対パスを使用
import { Something } from '../../components/SomeComponent';
import { useApi } from '../hooks/useApi';
import { User } from '../../types/models';
```

### メリット
- ファイルを移動しても、インポートパスを更新する必要がない
- 深くネストされたディレクトリでも、シンプルなインポートパスを維持できる
- コードの可読性が向上する
- エディタの自動インポート機能が正確に動作する

## 開発環境のセットアップ
```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

## 環境変数
`.env.example`ファイルを`.env.local`にコピーして、必要に応じて値を編集してください。

```
# API設定
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api

# 環境設定
NEXT_PUBLIC_ENV=development
```

## スクリプト
- `npm run dev` - 開発サーバーを起動します
- `npm run build` - プロダクションビルドを生成します
- `npm run start` - プロダクションサーバーを起動します
- `npm run lint` - ESLintによるコード検証を実行します

## API連携
APIクライアントは`src/lib/api/client.ts`に実装されています。APIとの通信には、`src/lib/hooks/useApi.ts`で定義されたカスタムフックを使用します。

## 型システム
- `src/types/api.ts` - APIレスポンスの型定義
- `src/types/models.ts` - ドメインモデルの型定義
- `src/types/utility.ts` - ユーティリティ型の定義
