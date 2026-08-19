/**
 * GitHub Pages デモ (PAGES_EXPORT=1) 専用の一時ファイル。
 *
 * scripts/build-pages.mjs が export ビルドの間だけ app/layout.tsx として配置し、
 * ビルド後に必ず本物の app/layout.tsx へ戻す。
 *
 * 本物との違いは 1 点だけ:
 *   <DemoBanner /> を追加している。
 *   このコンポーネントは lib/demo/install-fetch.ts を import しており、
 *   読み込まれた時点で window.fetch がデモ用モックに差し替わる。
 */
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/feedback/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { DemoBanner } from '@/lib/demo/DemoBanner';

const inter = Inter({ subsets: ['latin'] });

// metadata.icons は basePath が自動付与されないため、明示的に前置する
const basePath = process.env.NEXT_PUBLIC_PAGES_BASE_PATH || '';

export const metadata: Metadata = {
  title: 'トモシゴト能システム（デモ）',
  description: '架空データで動作する UI デモ',
  icons: {
    icon: [{ url: `${basePath}/favicon.png`, sizes: '32x32', type: 'image/png' }],
    shortcut: `${basePath}/favicon.png`,
    apple: [{ url: `${basePath}/favicon.png`, sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <DemoBanner />
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
