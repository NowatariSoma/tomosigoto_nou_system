'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  /**
   * 選択可能なオプションの配列
   */
  options: SelectOption[];
  /**
   * 現在選択されている値
   */
  value: string;
  /**
   * 値が変更された時のコールバック関数
   */
  onChange: (value: string) => void;
  /**
   * プレースホルダーテキスト
   */
  placeholder?: string;
  /**
   * 無効状態かどうか
   */
  disabled?: boolean;
  /**
   * エラー状態かどうか
   */
  error?: boolean;
  /**
   * 追加のCSSクラス名
   */
  className?: string;
  /**
   * ドロップダウンの幅を指定
   */
  width?: string;
  /**
   * 最大表示高さ（オプションが多い場合にスクロール）
   */
  maxHeight?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '選択してください',
  disabled = false,
  error = false,
  className = '',
  width = 'w-40',
  maxHeight = 'max-h-60'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // 選択されたオプションを取得
  const selectedOption = options.find(option => option.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  // 外側をクリックした時にドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const buttonClasses = cn(
    width,
    'px-4 py-2 border rounded-md bg-white text-left',
    'flex items-center justify-between transition-colors',
    disabled 
      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
      : error
        ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400',
    className
  );

  const dropdownClasses = cn(
    'absolute z-10',
    width,
    'mt-1 bg-white border border-gray-300 rounded-md shadow-lg'
  );

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={buttonClasses}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={!selectedOption ? 'text-gray-400' : ''}>
          {displayText}
        </span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${
            disabled ? 'text-gray-300' : 'text-gray-500'
          } ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {isOpen && !disabled && (
        <div className={dropdownClasses}>
          <div className={`${maxHeight} overflow-y-auto`}>
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOptionSelect(option.value)}
                className="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
                role="option"
                aria-selected={option.value === value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Select;