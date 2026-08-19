/** @type {import('next').NextConfig} */
// ルートディレクトリの.envファイルを読み込む
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const nextConfig = {
  // Dockerでのスタンドアロンビルドを有効化（一時的に無効化）
  // output: 'standalone',
  // ワークスペースルートを明示的に指定してlockfile警告を解決
  // outputFileTracingRoot: require('path').join(__dirname, '../'),
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // 静的生成をスキップ（エラー回避）
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
  publicRuntimeConfig: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL,
  },
  webpack: (config, { dev, isServer }) => {
    // CSS optimization settings - temporarily enabled for development
    // if (!dev && !isServer) {
    //   config.optimization.minimize = false;
    //   config.optimization.minimizer = [];
    // }
    return config;
  },
  // エラーページの静的生成を完全にスキップ
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // 静的生成時のエラーを無視（開発用）
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  async rewrites() {
    // プロダクション環境ではNginxがリバースプロキシとして機能するため、
    // rewritesは開発環境でのみ有効化
    if (process.env.NODE_ENV === 'production') {
      return [];
    }

    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ];
  },
  // Skip trailing slash redirect for API routes
  skipTrailingSlashRedirect: true,
};

// ---------------------------------------------------------------------------
// GitHub Pages 用の静的エクスポート設定
//
// PAGES_EXPORT=1 のときだけ有効になる。環境変数が無い通常のビルド／開発サーバー／
// Docker 運用では、この if ブロックはまるごとスキップされるため既存動作は不変。
//
// 使い方: npm run build:pages  (scripts/build-pages.mjs 経由)
// ---------------------------------------------------------------------------
if (process.env.PAGES_EXPORT === '1') {
  // https://nowatarisoma.github.io/tomosigoto_nou_system/demo/ で公開する想定
  const demoBasePath = process.env.PAGES_BASE_PATH || '/tomosigoto_nou_system/demo';

  nextConfig.output = 'export';
  nextConfig.basePath = demoBasePath;
  nextConfig.trailingSlash = true;
  nextConfig.images = { ...nextConfig.images, unoptimized: true };

  // output: 'export' は rewrites / publicRuntimeConfig / middleware に非対応
  delete nextConfig.rewrites;
  delete nextConfig.publicRuntimeConfig;

  // デモにはバックエンドも Supabase も存在しない。
  // ルートの .env に本物の値が入っていても成果物には絶対に含めないよう、
  // 明らかにダミーと分かる値で上書きする（実際の通信はすべて失敗する）。
  nextConfig.env = {
    NEXT_PUBLIC_API_URL: 'https://demo.invalid/api/v1',
    NEXT_PUBLIC_AUTH_URL: 'https://demo.invalid/api/v1',
    NEXT_PUBLIC_SUPABASE_URL: 'https://demo.invalid.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'demo-anon-key',
    SUPABASE_URL: 'https://demo.invalid.supabase.co',
    SUPABASE_ANON_KEY: 'demo-anon-key',
  };
}

module.exports = nextConfig;
