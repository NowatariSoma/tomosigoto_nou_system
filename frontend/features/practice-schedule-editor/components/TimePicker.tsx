import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  error?: string;
  className?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label,
  error,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(9);
  const [minutes, setMinutes] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 初期値の設定
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      setHours(h || 9);
      setMinutes(m || 0);
    }
  }, [value]);

  // 時間の更新
  const updateTime = (newHours: number, newMinutes: number) => {
    const formattedTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    onChange(formattedTime);
  };

  // 時間の増減
  const incrementHours = () => {
    const newHours = hours >= 23 ? 0 : hours + 1;
    setHours(newHours);
    updateTime(newHours, minutes);
  };

  const decrementHours = () => {
    const newHours = hours <= 0 ? 23 : hours - 1;
    setHours(newHours);
    updateTime(newHours, minutes);
  };

  const incrementMinutes = () => {
    const newMinutes = minutes >= 55 ? 0 : minutes + 5;
    setMinutes(newMinutes);
    updateTime(hours, newMinutes);
  };

  const decrementMinutes = () => {
    const newMinutes = minutes <= 0 ? 55 : minutes - 5;
    setMinutes(newMinutes);
    updateTime(hours, newMinutes);
  };

  // クリックアウトサイドで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const displayValue = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      
      <div
        className={cn(
          "relative w-full px-3 py-2 border rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500",
          error ? 'border-red-500' : 'border-gray-300',
          isOpen ? 'ring-2 ring-blue-500' : ''
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-900 font-medium">{displayValue}</span>
          <div className="flex flex-col">
            <ChevronUp className="h-4 w-4 text-gray-400" />
            <ChevronDown className="h-4 w-4 text-gray-400 -mt-1" />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-center space-x-6">
              {/* 時間選択 */}
              <div className="flex flex-col items-center space-y-2">
                <button
                  onClick={incrementHours}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  type="button"
                >
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                </button>
                <div className="text-2xl font-bold text-gray-900 min-w-[60px] text-center">
                  {hours.toString().padStart(2, '0')}
                </div>
                <button
                  onClick={decrementHours}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  type="button"
                >
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                </button>
                <div className="text-xs text-gray-500">時</div>
              </div>

              {/* 区切り文字 */}
              <div className="text-2xl font-bold text-gray-400">:</div>

              {/* 分選択 */}
              <div className="flex flex-col items-center space-y-2">
                <button
                  onClick={incrementMinutes}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  type="button"
                >
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                </button>
                <div className="text-2xl font-bold text-gray-900 min-w-[60px] text-center">
                  {minutes.toString().padStart(2, '0')}
                </div>
                <button
                  onClick={decrementMinutes}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  type="button"
                >
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                </button>
                <div className="text-xs text-gray-500">分</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
