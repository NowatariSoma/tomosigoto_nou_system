/**
 * EmptyState - 空の状態表示コンポーネント
 * 
 * 検索結果やフィルター結果が0件の場合に表示するメッセージコンポーネントです。
 * - 検索結果がない場合の通知メッセージ
 * - フィルター結果が0件の場合のメッセージ
 * - 中央揃えでわかりやすい表示
 * - カスタムメッセージに対応
 */
interface EmptyStateProps {
  message: string;
}

export const EmptyState = ({ message }: EmptyStateProps) => {
  return (
    <div className="text-center py-16">
      <p className="text-slate-500 text-lg">{message}</p>
    </div>
  );
};

