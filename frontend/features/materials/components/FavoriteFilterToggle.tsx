/**
 * FavoriteFilterToggle - お気に入りフィルタートグルコンポーネント
 * 
 * お気に入りのみ表示するフィルターボタンとリンクを提供します。
 * - お気に入りのみフィルターボタン（トグル機能）
 * - アクティブ時のスタイル変更（赤色のハイライト）
 * - フィルター有効時にお気に入り一覧ページへのリンクを表示
 * - 複数の材料ページで共通使用
 */
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/forms/button';
import { useRouter } from 'next/navigation';

interface FavoriteFilterToggleProps {
  showFavoritesOnly: boolean;
  onToggle: () => void;
}

export const FavoriteFilterToggle = ({
  showFavoritesOnly,
  onToggle
}: FavoriteFilterToggleProps) => {
  const router = useRouter();

  return (
    <>
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          showFavoritesOnly
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        <Heart className={`h-4 w-4 ${showFavoritesOnly ? 'fill-red-600 text-red-600' : ''}`} />
        <span>お気に入りのみ</span>
      </button>
      {showFavoritesOnly && (
        <Button
          onClick={() => router.push('/materials/favorites')}
          variant="outline"
          size="sm"
        >
          お気に入り一覧へ
        </Button>
      )}
    </>
  );
};

