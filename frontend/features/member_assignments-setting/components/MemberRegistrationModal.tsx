'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, User as UserIcon, Plus } from 'lucide-react';
import { userService, User as UserType } from '../services/user-service';
import { memberAssignmentService } from '../services/member-assignment-service';
import { CreateMemberAssignmentRequest } from '../types';
import { UI_TEXT, CATEGORY_OPTIONS } from '../constants';

interface MemberRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  partId: string;
  stageId: string;
  partName: string;
  stageName: string;
  onSuccess: () => void;
}

export const MemberRegistrationModal: React.FC<MemberRegistrationModalProps> = ({
  isOpen,
  onClose,
  partId,
  stageId,
  partName,
  stageName,
  onSuccess
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserType[]>([]);
  const [userCategories, setUserCategories] = useState<Record<string, 'utai' | 'mai'>>({});
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // モーダルが開かれた時に状態をリセット
      setFirstName('');
      setLastName('');
      setSearchResults([]);
      setSelectedUsers([]);
      setUserCategories({});
      setHasSearched(false);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!firstName.trim() && !lastName.trim()) {
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const results = await userService.searchUsersByName(firstName.trim(), lastName.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: UserType) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(prev => [...prev, user]);
      setUserCategories(prev => ({
        ...prev,
        [user.id]: 'utai' // デフォルトは謡
      }));
    }
  };

  const handleUserRemove = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
    setUserCategories(prev => {
      const newCategories = { ...prev };
      delete newCategories[userId];
      return newCategories;
    });
  };

  const handleClearSearch = () => {
    setFirstName('');
    setLastName('');
    setSearchResults([]);
    setHasSearched(false);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) return;

    setSubmitting(true);
    try {
      // 各ユーザーに対して登録処理を実行
      const promises = selectedUsers.map((user, index) => {
        const assignmentData: CreateMemberAssignmentRequest = {
          user_id: user.id,
          part_id: partId,
          category: userCategories[user.id] || 'utai', // 各ユーザーのカテゴリを使用
          display_order: index, // 表示順序を入力順で設定
        };
        return memberAssignmentService.createMemberAssignment(assignmentData);
      });

      await Promise.all(promises);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create assignments:', error);
      alert('メンバー登録に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setFirstName('');
    setLastName('');
    setSearchResults([]);
    setSelectedUsers([]);
    setUserCategories({});
    setHasSearched(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            メンバー登録
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
          {/* 舞台・パート情報 */}
          <div className="bg-white border-2 border-gray-300 rounded-lg p-6 shadow-lg">
            <div>
              <div className="text-2xl font-black text-gray-900 mb-1">{stageName}</div>
              <div className="text-base font-bold text-blue-600">パート: <span className="text-2xl font-black text-blue-800">{partName}</span></div>
            </div>
          </div>

          {/* ユーザー検索 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Search className="h-5 w-5" />
              ユーザー検索
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓（カタカナ）
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="タナカ"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    名（カタカナ）
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="タロウ"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={loading || (!firstName.trim() && !lastName.trim())}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {loading ? '検索中...' : '検索'}
                </button>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-semibold"
                >
                  検索クリア
                </button>
              </div>
            </div>

            {/* 検索結果 */}
            {hasSearched && (
              <div className="mt-4 bg-white border-2 border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  検索結果 ({searchResults.length}件)
                </h4>
                {searchResults.length > 0 ? (
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 focus-within:border-blue-500 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                            <UserIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.last_name_katakana} {user.first_name_katakana}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          disabled={selectedUsers.find(u => u.id === user.id) !== undefined}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                        >
                          <Plus className="h-4 w-4 mr-1 inline" />
                          {selectedUsers.find(u => u.id === user.id) ? '選択済み' : '選択'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <UserIcon className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                    <p>該当するユーザーが見つかりませんでした</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 選択されたユーザー */}
          {selectedUsers.length > 0 && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-green-800">
                  選択されたユーザー ({selectedUsers.length}名)
                </h4>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-1 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors text-sm font-semibold"
                >
                  全クリア
                </button>
              </div>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {selectedUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between bg-white rounded-lg p-4 hover:bg-green-100/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-bold text-green-800 text-xl">
                          {user.last_name_katakana} {user.first_name_katakana}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-medium">区分:</span>
                        <select
                          value={userCategories[user.id] || 'utai'}
                          onChange={(e) => setUserCategories(prev => ({
                            ...prev,
                            [user.id]: e.target.value as 'utai' | 'mai'
                          }))}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          {CATEGORY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUserRemove(user.id)}
                        className="px-3 py-1 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors text-sm font-semibold"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* ボタン */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-semibold"
              >
                キャンセル
              </button>
            </div>
            <button
              type="submit"
              disabled={selectedUsers.length === 0 || submitting}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
            >
              {submitting ? '登録中...' : 
               selectedUsers.length === 0 ? 'メンバーを選択してください' :
               `${selectedUsers.length}名のメンバーを登録`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
