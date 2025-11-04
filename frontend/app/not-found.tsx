'use client';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-gray-600 mb-8">ページが見つかりませんでした</p>
      <a href="/" className="text-blue-600 hover:underline">
        ホームに戻る
      </a>
    </div>
  );
}

