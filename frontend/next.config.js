/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dockerでのスタンドアロンビルドを有効化
  output: 'standalone',
  eslint: {
    // ESLintエラーを許可（開発環境で段階的に修正）
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    domains: ['localhost', 'example.com'],
  },
  env: {
    API_BASE_URL: process.env.API_BASE_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
  webpack: (config, { dev, isServer }) => {
    // Disable CSS optimization in production to avoid build errors
    if (!dev && !isServer) {
      config.optimization.minimize = false;
      config.optimization.minimizer = [];
    }
    return config;
  },
  async rewrites() {
    const isDev = process.env.NODE_ENV === 'development';
    return [
      // 既存のカメラとDB API設定
      {
        source: '/api/camera1/:path*',
        destination: isDev 
          ? 'http://localhost:8001/:path*'
          : 'http://people-counter:8000/:path*',
      },
      {
        source: '/api/camera2/:path*',
        destination: isDev 
          ? 'http://localhost:8002/:path*'
          : 'http://people-counter2:8000/:path*',
      },
      {
        source: '/api/db/:path*',
        destination: isDev 
          ? 'http://localhost:8003/:path*'
          : 'http://db-access:8000/:path*',
      },
      // 練習表システム用API設定
      {
        source: '/api/schedules/:path*',
        destination: `${process.env.API_BASE_URL || 'http://localhost:8000'}/api/schedules/:path*`,
      },
      {
        source: '/api/users/:path*',
        destination: `${process.env.API_BASE_URL || 'http://localhost:8000'}/api/users/:path*`,
      },
      {
        source: '/api/auth/:path*',
        destination: `${process.env.API_BASE_URL || 'http://localhost:8000'}/api/auth/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
