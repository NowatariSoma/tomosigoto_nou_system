/**
 * GitHub Pages デモ (PAGES_EXPORT=1) 専用の一時ファイル。
 *
 * scripts/build-pages.mjs が export ビルドの間だけ
 * app/materials/[playlistId]/[videoId]/layout.tsx として配置し、ビルド後に必ず削除する。
 * 通常のビルド／開発サーバー／Docker 運用では存在しない。
 *
 * 親セグメント([playlistId])の params を受け取り、そのプレイリストに属する
 * サブプレイリストIDを列挙する。
 */
import type { ReactNode } from 'react';
import { playlistVideos } from '@/features/materials/data/playlist_data';

export const dynamicParams = false;

export function generateStaticParams({
  params,
}: {
  params: { playlistId: string };
}) {
  return playlistVideos
    .filter((subPlaylist) => String(subPlaylist.playlistId) === String(params.playlistId))
    .map((subPlaylist) => ({ videoId: String(subPlaylist.id) }));
}

export default function MaterialsVideoDemoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
