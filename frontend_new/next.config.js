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
  webpack: (config, { dev, isServer }) => {
    // Enable CSS optimization for proper Tailwind CSS purging
    // Remove the minimize = false setting to allow proper CSS processing
    return config;
  },
  async rewrites() {
    const isDev = process.env.NODE_ENV === 'development';
    return [
      {
        source: '/api/db/:path*',
        destination: isDev 
          ? 'http://localhost:8001/:path*'
          : 'http://auth:8000/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
