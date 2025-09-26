/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dockerでのスタンドアロンビルドを有効化
  output: 'standalone',
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://noh-api.fullweak.com/api/v1',
    NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL || 'https://noh-api.fullweak.com',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uilydqaqephxtcnnqihy.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHlkcWFxZXBoeHRjbm5xaWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NDAxNzUsImV4cCI6MjA2NjIxNjE3NX0.DAkWIVyi8n8Zkt6TNKvwaVFU6jLCuRXiGP0JISNmJak',
  },
  publicRuntimeConfig: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://noh-api.fullweak.com/api/v1',
    NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL || 'https://noh-api.fullweak.com',
  },
  webpack: (config, { dev, isServer }) => {
    // CSS optimization settings - temporarily enabled for development
    // if (!dev && !isServer) {
    //   config.optimization.minimize = false;
    //   config.optimization.minimizer = [];
    // }
    return config;
  },
  // APIリライト（プロキシ設定）
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://noh-api.fullweak.com/api/:path*',
      },
    ];
  },
  // Skip trailing slash redirect for API routes
  skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;
