/**
 * Next.jsフレームワークの設定
 * 
 * このファイルはNext.jsフレームワークの設定を定義します。
 * ビルド設定、環境変数設定、APIプロキシ、画像最適化設定などを行います。
 */

import type { NextConfig } from 'next';

/**
 * Next.js設定オブジェクト
 */
const nextConfig: NextConfig = {
  /**
   * Strictモードを有効にする
   */
  reactStrictMode: true,

  /**
   * 画像の最適化設定
   */
  images: {
    domains: ['localhost', 'example.com'],
  },

  /**
   * 環境変数
   */
  env: {
    /**
     * API基本URL
     */
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },

  /**
   * リライトルール設定
   * APIリクエストをバックエンドサーバーにプロキシする
   */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'}/:path*`,
      },
    ];
  },

  /**
   * swcMinify設定
   * SWCを使った最適化を有効にする
   */
  swcMinify: true,
};

export default nextConfig; 