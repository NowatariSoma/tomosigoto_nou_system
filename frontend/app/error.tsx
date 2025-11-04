'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">エラーが発生しました</h1>
      <p className="text-gray-600 mb-8">{error.message || '予期しないエラーが発生しました'}</p>
      <button
        onClick={reset}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        再試行
      </button>
      <a href="/" className="text-blue-600 hover:underline mt-4">
        ホームに戻る
      </a>
    </div>
  );
}

