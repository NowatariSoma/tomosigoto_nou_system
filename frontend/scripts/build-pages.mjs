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
 *   - app/layout.tsx           … デモ告知バー + fetch インターセプトを差し込む
 *   - lib/supabase.ts          … Supabase が存在しないのでインメモリ実装に差し替え
 *   - lib/demo/                … デモ用の架空データとモック層（丸ごとコピー）
 *   - app/materials/[playlistId]/(**)/layout.tsx
 *                              … 動的セグメント用の generateStaticParams を追加
 *   - features/{stage-part-assignment,part-member-assignment}/data/mockData.ts
 *                              … 「公演名 1」等のプレースホルダをデモ用架空データに差し替え
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

/** ビルド中だけ配置するファイル／ディレクトリ [テンプレート, 配置先] */
const OVERLAY = [
  ['scripts/pages-export/demo', 'lib/demo'],
  ['scripts/pages-export/demo-supabase.ts', 'lib/supabase.ts'],
  ['scripts/pages-export/root-layout.tsx', 'app/layout.tsx'],
  ['scripts/pages-export/root-page.tsx', 'app/page.tsx'],
  ['scripts/pages-export/playlist-layout.tsx', 'app/materials/[playlistId]/layout.tsx'],
  ['scripts/pages-export/video-layout.tsx', 'app/materials/[playlistId]/[videoId]/layout.tsx'],
  ['scripts/pages-export/stage-part-mock.ts', 'features/stage-part-assignment/data/mockData.ts'],
  ['scripts/pages-export/part-member-mock.ts', 'features/part-member-assignment/data/mockData.ts'],
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
  if (fs.statSync(template).isDirectory()) {
    fs.cpSync(template, target, { recursive: true });
  } else {
    fs.copyFileSync(template, target);
  }
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

  const rscCount = duplicateRscPayloads(outDir);
  log(`RSC プリフェッチ用に ${rscCount} 個の .txt を複製しました`);

  const assetFixCount = prefixPublicAssetPaths(outDir);
  log(`public/ 直参照 ${assetFixCount} ファイルに basePath を付与しました`);

  const htmlCount = countHtml(outDir);
  log(`完了: out/ に ${htmlCount} 個の HTML を生成しました`);
}

/**
 * trailingSlash: true の静的エクスポートでは RSC ペイロードが `<route>/index.txt` に
 * 出力されるのに対し、クライアントの Link プリフェッチは `<route>.txt` を要求するため
 * 404 がコンソールに並ぶ。実害は無い（プリフェッチが失敗するだけ）が、
 * 兄弟パスにコピーしておけばプリフェッチも成立しコンソールも静かになる。
 */
function duplicateRscPayloads(dir, count = 0) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count = duplicateRscPayloads(full, count);
      continue;
    }
    if (entry.name !== 'index.txt') continue;
    if (path.resolve(dir) === path.resolve(abs('out'))) continue; // ルートは対象外
    const sibling = `${dir}.txt`;
    fs.copyFileSync(full, sibling);
    count += 1;
  }
  return count;
}

/**
 * next/image を images.unoptimized で使うと、src="/favicon.png" のような
 * public/ 直下への絶対パスに basePath が付与されない（Next.js の既知の挙動）。
 * ソースを触らずに済ませるため、出力後の out/ の中だけ書き換える。
 */
function prefixPublicAssetPaths(outDir) {
  const publicDir = abs('public');
  if (!fs.existsSync(publicDir)) return 0;

  const basePath = process.env.PAGES_BASE_PATH || '/tomosigoto_nou_system/demo';
  const assets = fs
    .readdirSync(publicDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
  if (assets.length === 0) return 0;

  let changed = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(html|js|txt)$/.test(entry.name)) continue;

      const original = fs.readFileSync(full, 'utf8');
      let updated = original;
      for (const asset of assets) {
        // 引用符で囲まれた "/asset" のみを対象にする（既に basePath 付きのものは一致しない）
        updated = updated.split(`"/${asset}"`).join(`"${basePath}/${asset}"`);
        updated = updated.split(`\\"/${asset}\\"`).join(`\\"${basePath}/${asset}\\"`);
      }
      if (updated !== original) {
        fs.writeFileSync(full, updated);
        changed += 1;
      }
    }
  };
  walk(outDir);
  return changed;
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
