#!/usr/bin/env node
/**
 * GitHub Pages 用の静的エクスポートビルド。
 *
 *   npm run build:pages   →   frontend/out/
 *
 * next.config.js は PAGES_EXPORT=1 のときだけ export 設定を有効にするため、
 * 通常のビルド／開発サーバー／Docker 運用には一切影響しない。
 *
 * output: 'export' が非対応の要素は、このスクリプトがビルド中だけ
 * 一時的に退避／差し替えし、成否にかかわらず必ず元に戻す。
 *
 *   - middleware.ts            … export 非対応なので退避
 *   - app/api/                 … Route Handler は export 非対応なので退避
 *   - app/auth/                … cookies() を使う Route Handler なので退避
 *   - app/page.tsx             … サーバー redirect を静的化できないのでデモ索引に差し替え
 *   - app/materials/[playlistId]/(**)/layout.tsx
 *                              … 動的セグメント用の generateStaticParams を追加
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const backupRoot = path.join(projectRoot, '.pages-export-backup');

/** ビルド中だけ退避するパス（プロジェクトルートからの相対） */
const MOVE_AWAY = ['middleware.ts', 'app/api', 'app/auth'];

/** ビルド中だけ配置するファイル [テンプレート, 配置先] */
const OVERLAY = [
  ['scripts/pages-export/root-page.tsx', 'app/page.tsx'],
  ['scripts/pages-export/playlist-layout.tsx', 'app/materials/[playlistId]/layout.tsx'],
  ['scripts/pages-export/video-layout.tsx', 'app/materials/[playlistId]/[videoId]/layout.tsx'],
];

/** 復元手順のスタック（後入れ先出しで実行する） */
const undoStack = [];
let restored = false;

const abs = (relPath) => path.join(projectRoot, relPath);
const backupPathFor = (relPath) => path.join(backupRoot, relPath.replace(/[\\/]/g, '__'));

function log(message) {
  console.log(`[build:pages] ${message}`);
}

function moveAway(relPath) {
  const source = abs(relPath);
  if (!fs.existsSync(source)) {
    log(`skip (存在しない): ${relPath}`);
    return;
  }
  fs.mkdirSync(backupRoot, { recursive: true });
  const backup = backupPathFor(relPath);
  fs.rmSync(backup, { recursive: true, force: true });
  fs.renameSync(source, backup);
  log(`退避: ${relPath}`);
  undoStack.push(() => {
    fs.rmSync(source, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(source), { recursive: true });
    fs.renameSync(backup, source);
    log(`復元: ${relPath}`);
  });
}

function overlay(templateRelPath, targetRelPath) {
  const template = abs(templateRelPath);
  const target = abs(targetRelPath);
  if (!fs.existsSync(template)) {
    throw new Error(`テンプレートが見つかりません: ${templateRelPath}`);
  }

  let backup = null;
  if (fs.existsSync(target)) {
    fs.mkdirSync(backupRoot, { recursive: true });
    backup = backupPathFor(targetRelPath);
    fs.rmSync(backup, { recursive: true, force: true });
    fs.renameSync(target, backup);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(template, target);
  log(`差し替え: ${targetRelPath}`);

  undoStack.push(() => {
    fs.rmSync(target, { recursive: true, force: true });
    if (backup) {
      fs.renameSync(backup, target);
      log(`復元: ${targetRelPath}`);
    } else {
      log(`削除: ${targetRelPath}`);
    }
  });
}

function restore() {
  if (restored) return;
  restored = true;
  while (undoStack.length > 0) {
    const undo = undoStack.pop();
    try {
      undo();
    } catch (error) {
      console.error('[build:pages] 復元に失敗しました:', error);
    }
  }
  fs.rmSync(backupRoot, { recursive: true, force: true });
}

// 中断されても必ず元に戻す
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    restore();
    process.exit(130);
  });
}
process.on('uncaughtException', (error) => {
  console.error(error);
  restore();
  process.exit(1);
});

function main() {
  if (fs.existsSync(backupRoot)) {
    throw new Error(
      `${backupRoot} が残っています。前回のビルドが異常終了した可能性があります。` +
        '中身を手動で元の場所へ戻してから再実行してください。'
    );
  }

  for (const relPath of MOVE_AWAY) moveAway(relPath);
  for (const [template, target] of OVERLAY) overlay(template, target);

  // 過去の出力を消してから生成する
  fs.rmSync(abs('out'), { recursive: true, force: true });

  log('next build を実行します (PAGES_EXPORT=1)');
  const result = spawnSync('npx', ['--no-install', 'next', 'build'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      PAGES_EXPORT: '1',
      NODE_ENV: 'production',
      // next.config.js 側でも上書きするが、二重の保険としてダミー値を渡す
      NEXT_PUBLIC_API_URL: 'https://demo.invalid/api/v1',
      NEXT_PUBLIC_AUTH_URL: 'https://demo.invalid/api/v1',
      NEXT_PUBLIC_SUPABASE_URL: 'https://demo.invalid.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'demo-anon-key',
      SUPABASE_URL: 'https://demo.invalid.supabase.co',
      SUPABASE_ANON_KEY: 'demo-anon-key',
    },
  });

  if (result.status !== 0) {
    throw new Error(`next build が失敗しました (exit code: ${result.status})`);
  }

  const outDir = abs('out');
  if (!fs.existsSync(path.join(outDir, 'index.html'))) {
    throw new Error('out/index.html が生成されませんでした');
  }

  // GitHub Pages の Jekyll が _next/ を無視しないようにする
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
  log('out/.nojekyll を作成しました');

  const htmlCount = countHtml(outDir);
  log(`完了: out/ に ${htmlCount} 個の HTML を生成しました`);
}

function countHtml(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countHtml(full);
    else if (entry.name.endsWith('.html')) count += 1;
  }
  return count;
}

try {
  main();
} catch (error) {
  console.error(`[build:pages] ${error.message}`);
  restore();
  process.exit(1);
}
restore();
