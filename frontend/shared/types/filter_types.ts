export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterSelectConfig {
  id: string;
  placeholder: string;
  options: FilterOption[];
  value: string;
  onValueChange: (value: string) => void;
  width?: string;
}

export interface FilterSelectsProps {
  filters: FilterSelectConfig[];
  className?: string;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}
