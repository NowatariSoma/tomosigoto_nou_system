/**
 * SearchResultCount - 検索結果件数表示コンポーネント
 * 
 * 検索やフィルター適用後の結果件数を表示します。
 * - 検索結果の総件数を表示
 * - 動画検索モード時は「(動画検索結果)」ラベルを付加
 * - プレイリスト検索と動画検索の区別表示に対応
 * - ユーザーに検索状況を明確に伝える
 */
interface SearchResultCountProps {
  count: number;
  isVideoSearch?: boolean;
}

export const SearchResultCount = ({ count, isVideoSearch = false }: SearchResultCountProps) => {
  return (
    <div className="mb-4">
      <p className="text-slate-600">
        {count}件の記録が見つかりました
        {isVideoSearch && <span className="text-sm text-slate-500 ml-2">(動画検索結果)</span>}
      </p>
    </div>
  );
};

