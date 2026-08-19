/**
 * GitHub Pages デモ (PAGES_EXPORT=1) 専用の一時ファイル。
 *
 * scripts/build-pages.mjs が export ビルドの間だけ
 * app/materials/[playlistId]/layout.tsx として配置し、ビルド後に必ず削除する。
 * 通常のビルド／開発サーバー／Docker 運用では存在しない。
 *
 * output: 'export' は動的セグメントに generateStaticParams を要求するため、
 * ローカルのデモ用データから playlistId を列挙する。
 */
import type { ReactNode } from 'react';
import { mockData } from '@/features/materials/data/material_data';

export const dynamicParams = false;

export function generateStaticParams() {
  return mockData.map((playlist) => ({ playlistId: String(playlist.id) }));
}

export default function MaterialsPlaylistDemoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
