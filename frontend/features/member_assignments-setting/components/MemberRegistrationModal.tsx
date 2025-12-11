'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, User as UserIcon, Plus } from 'lucide-react';
import { userService, User as UserType } from '../services/user-service';
import { memberAssignmentService } from '../services/member-assignment-service';
import { partAssignmentsService } from '../services/part-assignments-service';
import { CreateMemberAssignmentRequest, MemberAssignmentWithDetails } from '../types';
import { UI_TEXT, CATEGORY_OPTIONS } from '../constants';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/inputs/select';

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
  const [existingMembers, setExistingMembers] = useState<MemberAssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      // モーダルが開かれた時に状態をリセット
      setFirstName('');
      setLastName('');
      setSearchResults([]);
      setSelectedUsers([]);
      setUserCategories({});
      setHasSearched(false);
      setErrorMessage('');
      loadExistingMembers();
    }
  }, [isOpen, partId]);

  const loadExistingMembers = async () => {
    try {
      setLoading(true);
      const partData = await partAssignmentsService.getPartWithAssignments(partId);
      setExistingMembers(partData.member_assignments || []);
    } catch (error) {
      // エラーは発生したが、ログは出力しない
    } finally {
      setLoading(false);
    }
  };

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
      // エラーは発生したが、ログは出力しない
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: UserType) => {
    // 既に選択されているかチェック
    if (selectedUsers.find(u => u.id === user.id)) {
      setErrorMessage('このユーザーは既に選択されています。');
      return;
    }
    
    // 既存メンバーと重複するかチェック
    if (existingMembers.find(member => member.user_id === user.id)) {
      setErrorMessage(`${user.last_name_katakana} ${user.first_name_katakana}さんは既にこのパートに登録されています。`);
      return;
    }
    
    // エラーメッセージをクリア
    setErrorMessage('');
    
    setSelectedUsers(prev => [...prev, user]);
    setUserCategories(prev => ({
      ...prev,
      [user.id]: 'utai' // デフォルトは謡
    }));
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
      // エラーは発生したが、ログは出力しない
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
    setErrorMessage('');
  };

  const handleDeleteMember = async (assignmentId: string) => {
    try {
      setSubmitting(true);

      // 即座にUIを更新（楽観的更新）
      setExistingMembers(prev => prev.filter(member => member.id !== assignmentId));

      await memberAssignmentService.deleteMemberAssignment(assignmentId);

      // サーバーから最新データを取得して同期
      await loadExistingMembers();
      // 削除の場合は親コンポーネントへの通知は不要（リロードを避けるため）
    } catch (error) {
      // エラーは発生したが、ログは出力しない
      // エラー時は元の状態に戻す
      await loadExistingMembers();
      alert('メンバーの削除に失敗しました');
    } finally {
      setSubmitting(false);
    }
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
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-6 w-6 text-gray-500" />
          </Button>
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
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="タナカ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    名（カタカナ）
                  </label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="タロウ"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleSearch}
                  disabled={loading || (!firstName.trim() && !lastName.trim())}
                  className="px-6 py-3"
                >
                  {loading ? '検索中...' : '検索'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearSearch}
                  className="px-6 py-3 border-2"
                >
                  検索クリア
                </Button>
              </div>
          </div>

          {/* エラーメッセージ */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-600 text-sm font-medium">
                  {errorMessage}
                </div>
              </div>
            </div>
          )}

          {/* 検索結果 */}
            {hasSearched && (
              <div className="mt-4 bg-white border-2 border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  検索結果 ({searchResults.length}件)
                </h4>
                {searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.map((user) => {
                      const isAlreadySelected = selectedUsers.find(u => u.id === user.id) !== undefined;
                      const isExistingMember = existingMembers.find(member => member.user_id === user.id) !== undefined;
                      const isDisabled = isAlreadySelected || isExistingMember;
                      
                      return (
                        <div
                          key={user.id}
                          className={`flex items-center justify-between p-4 bg-white border rounded-lg transition-colors ${
                            isDisabled 
                              ? 'border-gray-300 bg-gray-50 opacity-60' 
                              : 'border-gray-200 hover:border-blue-400 focus-within:border-blue-500'
                          }`}
                        >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                            <UserIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.last_name_katakana} {user.first_name_katakana}
                            </div>
                            <div className="text-sm text-gray-600">
                              {user.last_name_kanji} {user.first_name_kanji}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          disabled={isDisabled}
                          variant={isDisabled ? "outline" : "default"}
                          className="text-sm"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          {isAlreadySelected ? '選択済み' :
                           isExistingMember ? '登録済み' : '選択'}
                        </Button>
                        </div>
                      );
                    })}
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
                <h4 className="text-lg font-semibold text-blue-800">
                  選択されたユーザー ({selectedUsers.length}名)
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="px-3 py-1 border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 text-sm"
                >
                  全クリア
                </Button>
              </div>
              <div className="space-y-3">
                {selectedUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between bg-white rounded-lg p-4 hover:bg-blue-100/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-bold text-blue-800 text-xl">
                          {user.last_name_katakana} {user.first_name_katakana}
                        </div>
                        <div className="text-sm text-blue-600">
                          {user.last_name_kanji} {user.first_name_kanji}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-medium">区分:</span>
                        <Select
                          value={userCategories[user.id] || 'utai'}
                          onValueChange={(value) => setUserCategories(prev => ({
                            ...prev,
                            [user.id]: value as 'utai' | 'mai'
                          }))}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleUserRemove(user.id)}
                        className="px-3 py-1 border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 text-sm"
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 既存メンバー */}
          {existingMembers.length > 0 && (
            <div className="p-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                既存メンバー ({existingMembers.length}名)
              </h4>
              <div className="space-y-3">
                {existingMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-bold text-gray-900 text-xl">
                          {member.user.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {member.user.last_name_kanji} {member.user.first_name_kanji}
                        </div>
                        <div className="text-sm text-gray-500">
                          区分: {member.category === 'utai' ? '謡' : '舞'}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleDeleteMember(member.id)}
                      disabled={submitting}
                      className="px-3 py-1 text-sm"
                    >
                      削除
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ボタン */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-6 py-3 border-2"
              >
                キャンセル
              </Button>
            </div>
            <Button
              type="submit"
              disabled={selectedUsers.length === 0 || submitting}
              className="px-8 py-3 text-lg"
            >
              {submitting ? '登録中...' :
               selectedUsers.length === 0 ? 'メンバーを選択してください' :
               `${selectedUsers.length}名のメンバーを登録`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
