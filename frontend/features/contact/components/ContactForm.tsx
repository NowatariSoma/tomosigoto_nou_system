'use client';

import React, { useState } from 'react';
import { useContact } from '../hooks';
import { CreateContactRequest, ContactCategory } from '../types';
import { CATEGORY, CATEGORY_LABELS, UI_TEXT, INITIAL_CONTACT_FORM } from '../constants';
import { toast } from 'sonner';
import { Button } from '@/components/ui/forms/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/inputs/select';

export const ContactForm: React.FC = () => {
  const { createContact, loading, error } = useContact();
  const [formData, setFormData] = useState<CreateContactRequest>(INITIAL_CONTACT_FORM);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value as ContactCategory,
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
          <label className="block text-lg font-medium text-black mb-3">
            {UI_TEXT.CATEGORY_LABEL}
          </label>
          <Select
            value={formData.category}
            onValueChange={handleCategoryChange}
            disabled={loading}
          >
            <SelectTrigger className="w-full h-12 px-4 py-3 input-field text-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CATEGORY.BUG}>{CATEGORY_LABELS[CATEGORY.BUG]}</SelectItem>
              <SelectItem value={CATEGORY.FEATURE}>{CATEGORY_LABELS[CATEGORY.FEATURE]}</SelectItem>
              <SelectItem value={CATEGORY.QUESTION}>{CATEGORY_LABELS[CATEGORY.QUESTION]}</SelectItem>
              <SelectItem value={CATEGORY.OTHER}>{CATEGORY_LABELS[CATEGORY.OTHER]}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 内容 */}
        <div>
          <label className="block text-lg font-medium text-black mb-3">
            {UI_TEXT.CONTENT_LABEL}
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows={8}
            className="w-full px-4 py-3 input-field text-lg resize-none"
            placeholder={UI_TEXT.CONTENT_PLACEHOLDER}
            required
            disabled={loading}
          />
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="panel-error px-4 py-3 rounded">
            エラー: {error}
          </div>
        )}

        {/* 送信ボタン */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="px-8 py-3 text-lg font-medium"
          >
            {loading ? UI_TEXT.LOADING_TEXT : UI_TEXT.SUBMIT_BUTTON}
          </Button>
        </div>
      </form>
    </div>
  );
};

