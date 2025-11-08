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

module.exports = nextConfig;
