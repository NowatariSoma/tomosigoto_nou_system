/**
 * MaterialFilterSelects - 資料フィルター選択コンポーネント
 * 
 * 資料管理機能で使用する複数のフィルター選択UIを表示します。
 * - 年度、舞台、フェーズなどの複数フィルターを同時に表示
 * - 各フィルターの幅をカスタマイズ可能
 * - オプションの動的表示に対応
 * - フィルター値の変更時に関連データを再フィルタリング
 */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';
import { FilterSelectsProps } from '@/shared/types/filter_types';

export const MaterialFilterSelects = ({ filters, className = '' }: FilterSelectsProps) => {
  return (
    <div className={`flex gap-4 flex-wrap ${className}`}>
      {filters.map((filter) => (
        <Select key={filter.id} value={filter.value} onValueChange={filter.onValueChange}>
          <SelectTrigger className={filter.width || 'w-[180px]'}>
            <SelectValue placeholder={filter.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((option) => (
              <SelectItem key={`${filter.id}-${option.value}`} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
};
