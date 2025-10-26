import { Input } from '@/components/ui/inputs/input';
import { SearchInputProps } from '@/shared/types/filter_types';
import { X } from 'lucide-react';

export const MaterialSearchInput = ({ 
  value, 
  onChange, 
  placeholder = "検索...", 
  className = "",
  icon,
  iconPosition = 'left'
}: SearchInputProps) => {
  const iconElement = icon || (
    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const inputClassName = iconPosition === 'left' 
    ? `pl-10 ${className}` 
    : `pr-10 ${className}`;

  const iconClassName = iconPosition === 'left'
    ? "absolute left-3 top-1/2 transform -translate-y-1/2"
    : "absolute right-3 top-1/2 transform -translate-y-1/2";

  return (
    <div className="relative">
      {icon && (
        <div className={iconClassName}>
          {iconElement}
        </div>
      )}
      <Input
        type="text"
        placeholder={placeholder}
        className={inputClassName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
