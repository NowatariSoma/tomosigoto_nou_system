'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 relative overflow-hidden">
      {/* 背景パターン */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
      
      {/* アニメーションする背景のぼかしエフェクト */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-[#FFD07F]/20 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-400/10 to-[#B9D4FF]/10 rounded-full blur-3xl"></div>

      {/* メインコンテンツ */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-24">
        <div className="text-center w-full max-w-[600px] mx-auto">
          {/* 画像部分 */}
          <div className="mb-[200px] relative group flex justify-center">
            <div className="relative w-[420px] h-[420px]">
              <div className="absolute inset-0 -m-8 bg-gradient-to-r from-[#83A4FF]/30 via-[#B9D4FF]/30 to-[#FFD07F]/30 rounded-full blur-3xl group-hover:blur-2xl transition-all duration-700"></div>
              <div className="absolute inset-0 -m-4 bg-gradient-to-br from-[#83A4FF]/40 via-[#B9D4FF]/40 to-blue-600/40 rounded-full blur-2xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-[#83A4FF] via-[#B9D4FF] to-blue-600 rounded-full blur-sm opacity-60 animate-pulse"></div>
              <Image
                src="/god_takuichi.jpg"
                alt="404"
                width={420}
                height={420}
                className="rounded-full shadow-[0_0_80px_rgba(131,164,255,0.6),0_0_40px_rgba(185,212,255,0.4)] ring-[6px] ring-white/10 backdrop-blur-sm relative z-10 transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          </div>

          {/* テキスト部分 */}
          <div className="space-y-4 relative z-30">
            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-[#83A4FF] via-[#B9D4FF] to-[#FFD07F] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(131,164,255,0.5)] tracking-tight">
              404
            </h1>
            <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-[#83A4FF] via-[#B9D4FF] to-[#FFD07F] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(131,164,255,0.5)] tracking-tight">
              ページが見つかりません
            </h2>
            <p className="text-black/80 text-xl md:text-2xl font-light tracking-wide">
              お探しのページは存在しないか、移動された可能性があります
            </p>
          </div>

          {/* ボタン部分 */}
          <div className="mt-10 relative z-30 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => router.push('/')}
              className="group relative px-8 py-4 bg-gradient-to-r from-[#83A4FF] via-[#B9D4FF] to-blue-500 text-white rounded-full font-bold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(131,164,255,0.6)]"
            >
              <span className="relative z-10">ホームに戻る</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#83A4FF] via-[#B9D4FF] to-[#FFD07F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button
              onClick={() => router.push('/schedule')}
              className="group relative px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-full font-bold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:bg-white/20 hover:border-white/50"
            >
              <span className="relative z-10">スケジュールを見る</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
