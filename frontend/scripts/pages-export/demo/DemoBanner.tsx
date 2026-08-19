'use client';

/**
 * GitHub Pages デモ (PAGES_EXPORT=1) 専用のデモ告知バー。
 *
 * このモジュールを import した時点で fetch のインターセプトが有効になる
 * （install-fetch.ts の副作用）ため、AuthProvider などが動き出す前に
 * デモ用のモック応答が使える状態になる。
 */

import './install-fetch';

const BAR_HEIGHT = 28;

export function DemoBanner() {
  return (
    <>
      <style>{`
        body { padding-top: ${BAR_HEIGHT}px; }
        .sticky.top-0 { top: ${BAR_HEIGHT}px !important; }
        .fixed.inset-y-0 { top: ${BAR_HEIGHT}px !important; }
        .fixed.inset-0 { top: ${BAR_HEIGHT}px !important; }
        #tomosigoto-demo-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: ${BAR_HEIGHT}px;
          z-index: 2147483000;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 12px;
          background: #1f2937;
          color: #f8fafc;
          font-size: 12px;
          line-height: 1;
          letter-spacing: 0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        #tomosigoto-demo-banner b {
          background: #f59e0b;
          color: #1f2937;
          border-radius: 9999px;
          padding: 2px 8px;
          font-weight: 700;
        }
        @media (max-width: 640px) {
          #tomosigoto-demo-banner span { font-size: 11px; }
        }
      `}</style>
      <div id="tomosigoto-demo-banner" role="note">
        <b>DEMO</b>
        <span>
          これはデモです — 表示されているデータはすべて架空で、変更してもリロードすると元に戻ります
        </span>
      </div>
    </>
  );
}

export default DemoBanner;
