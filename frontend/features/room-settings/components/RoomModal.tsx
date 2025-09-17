import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Room } from '../types';
import { INITIAL_ROOM_FORM } from '../constants';

interface RoomModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (room: Room) => void;
}

export const RoomModal: React.FC<RoomModalProps> = ({ room, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Room>(INITIAL_ROOM_FORM);

  useEffect(() => {
    if (room) {
      setFormData(room);
    }
  }, [room]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleRadioChange = (value: boolean) => {
    setFormData(prev => ({
      ...prev,
      danceAllowed: value
    }));
  };

  const handleCampusChange = (campus: string) => {
    setFormData(prev => ({
      ...prev,
      campus: campus as '今出川' | '京田辺'
    }));
  };

  if (!isOpen || !room) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">会場情報編集</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 会場名 */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-3">会場名</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg"
              required
            />
          </div>

          {/* キャンパス */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-3">キャンパス</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleCampusChange('今出川')}
                className={`px-6 py-3 rounded-full border-2 transition-all text-lg font-medium ${
                  formData.campus === '今出川'
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-400 text-gray-800 hover:bg-gray-50'
                }`}
              >
                今出川
              </button>
              <button
                type="button"
                onClick={() => handleCampusChange('京田辺')}
                className={`px-6 py-3 rounded-full border-2 transition-all text-lg font-medium ${
                  formData.campus === '京田辺'
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-400 text-gray-800 hover:bg-gray-50'
                }`}
              >
                京田辺
              </button>
            </div>
          </div>

          {/* 収容可能人数 */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-3">収容可能人数</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                className="w-32 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg text-center"
                min="1"
                required
              />
              <span className="text-lg text-gray-700">人</span>
            </div>
          </div>

          {/* 舞の可否 */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-3">舞の可否</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="radio"
                    name="danceAllowed"
                    checked={formData.danceAllowed === true}
                    onChange={() => handleRadioChange(true)}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    formData.danceAllowed === true
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-400 bg-white'
                  }`}>
                    {formData.danceAllowed === true && (
                      <div className="w-3 h-3 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>
                <span className="text-lg text-gray-700">可能</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="radio"
                    name="danceAllowed"
                    checked={formData.danceAllowed === false}
                    onChange={() => handleRadioChange(false)}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    formData.danceAllowed === false
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-400 bg-white'
                  }`}>
                    {formData.danceAllowed === false && (
                      <div className="w-3 h-3 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>
                <span className="text-lg text-gray-700">不可</span>
              </label>
            </div>
          </div>

          {/* 場所 */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-3">場所</label>
            <div className="w-48 h-32 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-300">
              <img
                src={formData.location || 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'}
                alt="場所の地図"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-3">説明</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg resize-none"
              placeholder="会場の詳細情報を入力してください"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-lg font-medium"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-lg font-medium"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 