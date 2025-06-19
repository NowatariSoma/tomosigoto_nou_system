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
    const isDev = process.env.NODE_ENV === 'development';
    return [
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
    ];
  },
};

module.exports = nextConfig;
