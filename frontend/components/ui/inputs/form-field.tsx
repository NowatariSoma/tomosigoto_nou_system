'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { LucideIcon } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
  rows?: number;
  as?: 'input' | 'textarea';
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  icon: Icon,
  disabled = false,
  className,
  rows = 3,
  as = 'input',
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={name} className="label-form flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        <span>
          {label}
          {required && <span className="text-black ml-1">*</span>}
        </span>
      </label>
      {as === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className="input-field w-full resize-none"
        />
      ) : (
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="input-field"
        />
      )}
      {error && (
        <p className="text-sm text-black">{error}</p>
      )}
    </div>
  );
};
