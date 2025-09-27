import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { StageData, CreateStageRequest } from '../types';
import { UI_TEXT, PART_COUNT_LIMITS } from '../constants';

interface StageModalProps {
  stage: StageData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (stage: CreateStageRequest) => void;
  onDelete?: () => void;
}

export const StageModal: React.FC<StageModalProps> = ({ 
  stage, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete 
}) => {
  const [formData, setFormData] = useState<CreateStageRequest>({
    date: '',
    stageName: '',
    parts: Array(PART_COUNT_LIMITS.DEFAULT).fill(''),
    partCount: PART_COUNT_LIMITS.DEFAULT,
  });

  useEffect(() => {
    if (stage) {
      setFormData({
        date: stage.date,
        stageName: stage.stageName,
        parts: [...(stage.parts || [])],
        partCount: stage.partCount || PART_COUNT_LIMITS.DEFAULT,
      });
    }
  }, [stage]);

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePartCountChange = (count: number) => {
    const newParts = [...formData.parts];
    
    if (count > formData.partCount) {
      // パート数を増やす場合
      for (let i = formData.partCount; i < count; i++) {
        newParts.push('');
      }
    } else if (count < formData.partCount) {
      // パート数を減らす場合
      newParts.splice(count);
    }
    
    setFormData(prev => ({
      ...prev,
      parts: newParts,
      partCount: count,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const isFormValid = formData.date && formData.stageName && 
                     formData.parts.some(part => part.trim() !== '');

  if (!isOpen || !stage) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {UI_TEXT.REGISTRATION_TITLE}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 日付 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UI_TEXT.DATE_LABEL}
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          {/* 舞台名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {UI_TEXT.STAGE_NAME_LABEL}
            </label>
            <input
              type="text"
              value={formData.stageName}
              onChange={(e) => handleInputChange('stageName', e.target.value)}
              placeholder={UI_TEXT.STAGE_NAME_PLACEHOLDER}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          {/* パート数調整 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              パート数
            </label>
            <div className="flex items-center justify-center gap-4 p-6 bg-white rounded-xl border-2 border-gray-200">
              <button
                type="button"
                onClick={() => handlePartCountChange(Math.max(PART_COUNT_LIMITS.MIN, formData.partCount - 1))}
                disabled={formData.partCount <= PART_COUNT_LIMITS.MIN}
                className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:shadow-none transition-all duration-200"
              >
                <span className="text-xl font-bold">−</span>
              </button>
              
              <div className="flex flex-col items-center">
                <span className="text-4xl font-bold text-blue-600 mb-1">
                  {formData.partCount}
                </span>
                <span className="text-sm font-medium text-blue-500">
                  パート
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => handlePartCountChange(formData.partCount + 1)}
                className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <span className="text-xl font-bold">+</span>
              </button>
            </div>
            
            {/* パート数制限の表示 */}
            <div className="text-center mt-3">
              <span className="text-sm text-blue-500 bg-white px-3 py-1 rounded-full border border-blue-200">
                {PART_COUNT_LIMITS.MIN}パート以上設定可能
              </span>
            </div>
          </div>

          {/* パート入力 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {UI_TEXT.PART_LABEL}
            </label>
            <div className="space-y-3">
              {formData.parts.map((part, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 focus-within:border-blue-500 transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 bg-white text-blue-600 rounded-full text-sm font-bold border-2 border-blue-200">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={part}
                    onChange={(e) => {
                      const newParts = [...formData.parts];
                      newParts[index] = e.target.value;
                      handleInputChange('parts', newParts);
                    }}
                    placeholder={`${UI_TEXT.PART_PLACEHOLDER}${index + 1}`}
                    className="flex-1 px-4 py-3 border-0 bg-transparent focus:ring-0 focus:outline-none text-blue-600 placeholder-gray-400 text-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ボタン */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-semibold"
              >
                {UI_TEXT.CANCEL}
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  削除
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!isFormValid}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
            >
              {UI_TEXT.REGISTER}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
