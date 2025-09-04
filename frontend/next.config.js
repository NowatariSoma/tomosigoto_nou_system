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
    // Disable CSS optimization in production to avoid build errors
    if (!dev && !isServer) {
      config.optimization.minimize = false;
      config.optimization.minimizer = [];
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
  // Skip trailing slash redirect for API routes
  skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;
