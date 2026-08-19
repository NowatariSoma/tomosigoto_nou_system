/**
 * GitHub Pages デモ (PAGES_EXPORT=1) 専用の一時ファイル。
 *
 * scripts/build-pages.mjs が export ビルドの間だけ app/page.tsx として配置し、
 * ビルド後に必ず元の app/page.tsx へ戻す。
 *
 * 本来の app/page.tsx はサーバー側の redirect('/schedule') を行うが、
 * output: 'export' ではビルド時 redirect を静的化できないため、
 * デモでは各画面への入口となるインデックスページに差し替える。
 */
import Link from 'next/link';

type DemoPage = { href: string; title: string; description: string };

const PRIMARY_PAGES: DemoPage[] = [
  { href: '/schedule', title: 'スケジュール', description: '月間カレンダー。日付をクリックすると出欠・練習表のボトムシートが開きます' },
  { href: '/member-management', title: 'メンバー管理', description: '部員15名の権限・指導者フラグの一覧と変更' },
  { href: '/parts-setting', title: '舞台・パート登録', description: '公演（羽衣・高砂・敦盛・土蜘蛛）とパートのマスタ' },
  { href: '/member-assignments-setting', title: 'メンバー配役設定', description: '公演ごとの配役（シテ・ワキ・地謡・囃子方）の割当' },
  { href: '/room-settings', title: '稽古場登録', description: '今出川・京田辺の稽古場マスタ' },
  { href: '/materials', title: '能楽部資料庫', description: 'YouTube プレイリストのアーカイブと検索' },
];

const SECONDARY_PAGES: DemoPage[] = [
  { href: '/practice-schedule', title: '稽古スケジュール', description: '稽古予定の一覧・詳細' },
  { href: '/practice-schedule-editor', title: '稽古スケジュール編集', description: 'コマ割り・会場割当の編集画面' },
  { href: '/part-member-assignment', title: 'パート別メンバー割当', description: 'パートへのメンバー割当' },
  { href: '/stage-part-assignment', title: '舞台パート割当', description: '舞台ごとのパート構成' },
  { href: '/materials/favorites', title: '資料庫（お気に入り）', description: 'お気に入り登録した動画' },
  { href: '/materials/edit', title: '資料庫（編集）', description: 'プレイリストの編集' },
  { href: '/materials/new', title: '資料庫（新規登録）', description: 'プレイリストの新規登録' },
  { href: '/admin/attendance', title: '出欠管理（管理者）', description: '稽古ごとの出欠状況の集計' },
  { href: '/settings', title: 'アカウント設定', description: 'プロフィール情報の確認・編集' },
  { href: '/contact', title: 'お問い合わせ', description: 'お問い合わせフォーム' },
  { href: '/login', title: 'ログイン', description: '任意のメールアドレス・パスワードでログインできます' },
  { href: '/signup', title: 'サインアップ', description: '新規登録画面' },
];

function PageCard({ page }: { page: DemoPage }) {
  return (
    <li>
      <Link
        href={page.href}
        className="block h-full rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-400 hover:shadow-md"
      >
        <span className="block font-semibold text-slate-900">{page.title}</span>
        <span className="mt-1 block text-sm text-slate-500">{page.description}</span>
      </Link>
    </li>
  );
}

export default function DemoIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto max-w-5xl px-4 py-12">
        <header className="mb-10">
          <p className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
            UI デモ（静的エクスポート版）
          </p>
          <h1 className="mb-3 text-3xl font-bold text-slate-900">トモシゴト能システム</h1>
          <p className="mb-4 text-slate-600">
            大学の能楽サークル向け稽古管理システムの UI デモです。
            バックエンド API と Supabase の代わりに、ブラウザ内の架空データで動作しています。
            <strong className="font-semibold text-slate-800">
              デモ用の管理者アカウントでログイン済みの状態
            </strong>
            なので、そのまま各画面を操作できます。
          </p>
          <ul className="space-y-1 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <li>・登場する部員名・メールアドレス・会場・稽古予定はすべて架空のものです。</li>
            <li>・登録や編集の操作はブラウザのメモリ上にだけ反映され、リロードすると元に戻ります。</li>
            <li>・ログアウトしても、ログイン画面で任意のメールアドレスとパスワードを入力すれば再度入れます。</li>
          </ul>
        </header>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-slate-900">主な画面</h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRIMARY_PAGES.map((page) => (
              <PageCard key={page.href} page={page} />
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900">その他の画面</h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECONDARY_PAGES.map((page) => (
              <PageCard key={page.href} page={page} />
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
