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
