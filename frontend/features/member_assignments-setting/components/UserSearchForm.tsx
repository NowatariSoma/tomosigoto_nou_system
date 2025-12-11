'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Search, User as UserIcon, Plus } from 'lucide-react';
import { userService, User as UserType } from '../services/user-service';

interface UserSearchFormProps {
  onUserSelect: (user: UserType) => void;
  selectedPartId: string;
  disabled?: boolean;
}

export const UserSearchForm: React.FC<UserSearchFormProps> = ({
  onUserSelect,
  selectedPartId,
  disabled = false
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
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
    onUserSelect(user);
    // 検索結果は保持して、複数選択を可能にする
  };

  const handleClear = () => {
    setFirstName('');
    setLastName('');
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <Card className="mb-6 border-2 border-blue-200 shadow-lg">
      <CardHeader className="bg-blue-50">
        <CardTitle className="text-lg text-black flex items-center gap-2">
          <Search className="h-5 w-5" />
          ユーザー検索
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lastName" className="label-form-semibold">
                姓（カタカナ）
              </Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="タナカ"
                className="border-2 border-gray-200 focus:border-blue-400 rounded-lg"
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName" className="label-form-semibold">
                名（カタカナ）
              </Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="タロウ"
                className="border-2 border-gray-200 focus:border-blue-400 rounded-lg"
                disabled={disabled}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading || disabled || (!firstName.trim() && !lastName.trim())}
              className="px-6 py-2 btn-primary disabled:bg-gray-300"
            >
              {loading ? '検索中...' : '検索'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={disabled}
              className="px-6 py-2 border-2 border-blue-300 hover:bg-blue-50"
            >
              クリア
            </Button>
          </div>
        </form>

        {/* 検索結果 */}
        {hasSearched && (
          <div className="mt-6">
            <h3 className="label-form-semibold mb-3">
              検索結果 ({searchResults.length}件)
            </h3>
            {searchResults.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.last_name_katakana} {user.first_name_katakana}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleUserSelect(user)}
                      disabled={disabled}
                      className="px-3 py-1 btn-primary text-sm"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      選択
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <UserIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>該当するユーザーが見つかりませんでした</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
