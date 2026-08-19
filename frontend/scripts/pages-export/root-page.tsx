/**
 * GitHub Pages デモ (PAGES_EXPORT=1) 専用の一時ファイル。
 *
 * scripts/build-pages.mjs が export ビルドの間だけ app/page.tsx として配置し、
 * ビルド後に必ず元の app/page.tsx へ戻す。
 *
 * 本来の app/page.tsx はサーバー側の redirect('/schedule') を行うが、
 * output: 'export' ではビルド時 redirect を静的化できないため、
 * デモではリンク一覧のインデックスページに差し替える。
 */
import Link from 'next/link';

const DEMO_PAGES: { href: string; title: string; description: string }[] = [
  { href: '/schedule', title: 'スケジュール', description: '全体スケジュールのカレンダー表示' },
  { href: '/practice-schedule', title: '稽古スケジュール', description: '稽古予定の一覧・詳細' },
  { href: '/practice-schedule-editor', title: '稽古スケジュール編集', description: '稽古予定の作成・編集画面' },
  { href: '/materials', title: '資料庫', description: 'YouTube プレイリストのアーカイブ' },
  { href: '/materials/favorites', title: '資料庫（お気に入り）', description: 'お気に入り登録した動画' },
  { href: '/materials/new', title: '資料庫（新規登録）', description: 'プレイリストの新規登録' },
  { href: '/materials/edit', title: '資料庫（編集）', description: 'プレイリストの編集' },
  { href: '/member-management', title: 'メンバー管理', description: '部員の一覧と権限管理' },
  { href: '/member-assignments-setting', title: 'メンバー配役設定', description: '公演ごとの配役設定' },
  { href: '/part-member-assignment', title: 'パート別メンバー割当', description: 'パートへのメンバー割当' },
  { href: '/parts-setting', title: 'パート設定', description: '演目パートのマスタ設定' },
  { href: '/stage-part-assignment', title: '舞台パート割当', description: '舞台ごとのパート構成' },
  { href: '/room-settings', title: '稽古場設定', description: '稽古場所のマスタ設定' },
  { href: '/admin/attendance', title: '出欠管理（管理者）', description: '出欠状況の集計画面' },
  { href: '/account-setting', title: 'アカウント設定', description: 'プロフィール情報の設定' },
  { href: '/settings', title: '初期設定', description: '初回ログイン時のプロフィール登録' },
  { href: '/login', title: 'ログイン', description: 'ログイン画面（デモでは認証不可）' },
  { href: '/signup', title: 'サインアップ', description: '新規登録画面（デモでは認証不可）' },
  { href: '/contact', title: 'お問い合わせ', description: 'お問い合わせフォーム' },
  { href: '/test-schedule-table', title: 'スケジュールテーブル検証', description: '開発用の表示検証ページ' },
];

export default function DemoIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto max-w-5xl px-4 py-12">
        <header className="mb-10">
          <p className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
            UI デモ（静的エクスポート版）
          </p>
          <h1 className="mb-3 text-3xl font-bold text-slate-900">トモシゴト能システム</h1>
          <p className="text-slate-600">
            GitHub Pages 上で公開している UI 閲覧専用のデモです。
            バックエンド API と Supabase には接続されていないため、
            ログイン・データの取得や保存はできません。各画面の見た目と遷移のみ確認できます。
          </p>
        </header>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_PAGES.map((page) => (
            <li key={page.href}>
              <Link
                href={page.href}
                className="block h-full rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-400 hover:shadow-md"
              >
                <span className="block font-semibold text-slate-900">{page.title}</span>
                <span className="mt-1 block text-sm text-slate-500">{page.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
