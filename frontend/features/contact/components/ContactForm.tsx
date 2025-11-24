'use client';

import React, { useState } from 'react';
import { useContact } from '../hooks';
import { CreateContactRequest, ContactCategory } from '../types';
import { CATEGORY, CATEGORY_LABELS, UI_TEXT, INITIAL_CONTACT_FORM } from '../constants';
import { toast } from 'sonner';

export const ContactForm: React.FC = () => {
  const { createContact, loading, error } = useContact();
  const [formData, setFormData] = useState<CreateContactRequest>(INITIAL_CONTACT_FORM);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createContact(formData);
      toast.success(UI_TEXT.SUCCESS_MESSAGE);
      // フォームをリセット
      setFormData(INITIAL_CONTACT_FORM);
    } catch (error) {
      console.error('Failed to submit contact:', error);
      // エラーはuseContactで既に設定されている
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* カテゴリ */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-3">
            {UI_TEXT.CATEGORY_LABEL}
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg"
            required
            disabled={loading}
          >
            <option value={CATEGORY.BUG}>{CATEGORY_LABELS[CATEGORY.BUG]}</option>
            <option value={CATEGORY.FEATURE}>{CATEGORY_LABELS[CATEGORY.FEATURE]}</option>
            <option value={CATEGORY.QUESTION}>{CATEGORY_LABELS[CATEGORY.QUESTION]}</option>
            <option value={CATEGORY.OTHER}>{CATEGORY_LABELS[CATEGORY.OTHER]}</option>
          </select>
        </div>

        {/* 内容 */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-3">
            {UI_TEXT.CONTENT_LABEL}
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows={8}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg resize-none"
            placeholder={UI_TEXT.CONTENT_PLACEHOLDER}
            required
            disabled={loading}
          />
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            エラー: {error}
          </div>
        )}

        {/* 送信ボタン */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? UI_TEXT.LOADING_TEXT : UI_TEXT.SUBMIT_BUTTON}
          </button>
        </div>
      </form>
    </div>
  );
};

