'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FormData {
  studentId: string;
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  year: string;
  faculty: string;
  email: string;
}

const AccountSettings: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    studentId: '1111111111',
    lastName: '田中',
    firstName: '太郎',
    lastNameKana: 'タナカ',
    firstNameKana: 'タロウ',
    year: '3',
    faculty: '文',
    email: ''
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const faculties = [
    { value: '神', label: '神学部' },
    { value: '文', label: '文学部' },
    { value: '社会', label: '社会学部' },
    { value: '法', label: '法学部' },
    { value: '経済', label: '経済学部' },
    { value: '商', label: '商学部' },
    { value: '理工', label: '理工学部' },
    { value: '医', label: '医学部' }
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFacultySelect = (faculty: string) => {
    handleInputChange('faculty', faculty);
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        
        <div className="space-y-8">
        {/* Student ID */}
        <div className="flex items-center">
            <label className="w-32 text-gray-700 font-medium">学籍番号</label>
            <input
            type="text"
            value={formData.studentId}
            onChange={(e) => handleInputChange('studentId', e.target.value)}
            className="flex-1 max-w-xs px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
        </div>

        {/* Name Fields */}
        <div className="flex items-center space-x-8">
            <div className="flex items-center">
            <label className="w-32 text-gray-700 font-medium">姓</label>
            <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-40 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            </div>
            <div className="flex items-center space-x-8">
            <label className="w-16 text-gray-700 font-medium">名</label>
            <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="w-40 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            </div>
        </div>

        {/* Kana Fields */}
        <div className="flex items-center space-x-8">
            <div className="flex items-center">
            <label className="w-32 text-gray-700 font-medium">セイ</label>
            <input
                type="text"
                value={formData.lastNameKana}
                onChange={(e) => handleInputChange('lastNameKana', e.target.value)}
                className="w-40 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            </div>
            <div className="flex items-center">
            <label className="w-24 text-gray-700 font-medium">メイ</label>
            <input
                type="text"
                value={formData.firstNameKana}
                onChange={(e) => handleInputChange('firstNameKana', e.target.value)}
                className="w-40 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            </div>
        </div>

        {/* Year */}
        <div className="flex items-center">
            <label className="w-32 text-gray-700 font-medium">学年</label>
            <input
            type="number"
            value={formData.year}
            onChange={(e) => handleInputChange('year', e.target.value)}
            min="1"
            max="6"
            className="w-20 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
        </div>

        {/* Faculty Dropdown */}
        <div className="flex items-center">
            <label className="w-32 text-gray-700 font-medium">学部</label>
            <div className="relative">
            <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-40 px-4 py-2 border border-gray-300 rounded-md bg-white text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center justify-between"
            >
                <span>{formData.faculty}</span>
                <ChevronDown 
                className={`w-4 h-4 text-gray-500 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                }`} 
                />
            </button>
            
            {isDropdownOpen && (
                <div className="absolute z-10 w-40 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                <div className="max-h-60 overflow-y-auto">
                    {faculties.map((faculty) => (
                    <button
                        key={faculty.value}
                        type="button"
                        onClick={() => handleFacultySelect(faculty.value)}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
                    >
                        {faculty.value}
                    </button>
                    ))}
                </div>
                </div>
            )}
            </div>
        </div>

        {/* Email */}
        <div className="flex items-center">
            <label className="w-32 text-gray-700 font-medium">メールアドレス</label>
            <div className="flex-1">
            <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="example@mail[].doshisha.ac.jp"
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <p className="text-sm text-gray-500 mt-1">※大学のメールアドレス</p>
            </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6">
            <button
            type="button"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
            >
            保存
            </button>
        </div>
        </div>
    </div>
  );
};

export default AccountSettings;