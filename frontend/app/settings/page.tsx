'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { 
  User, 
  Mail, 
  Shield, 
  Palette, 
  Users, 
  UserPlus, 
  Settings as SettingsIcon, 
  Bell,
  Monitor,
  Moon,
  Sun
} from 'lucide-react';

type Tab = 'profile' | 'team' | 'notifications';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  theme: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  lastActive: string;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  comments: boolean;
  uploads: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  // プロフィール情報
  const [profile, setProfile] = useState<UserProfile>({
    name: 'テストユーザー',
    email: 'admin@tomosigoto-system.local',
    role: 'admin',
    theme: 'light',
  });

  // チームメンバー
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'テスト管理者',
      email: 'admin@tomosigoto-system.local',
      role: 'admin',
      lastActive: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      name: 'チームメンバー1',
      email: 'member1@tomosigoto-system.local',
      role: 'user',
      lastActive: '2024-01-14T16:45:00Z',
    },
    {
      id: '3',
      name: 'チームメンバー2',
      email: 'member2@tomosigoto-system.local',
      role: 'viewer',
      lastActive: '2024-01-13T09:15:00Z',
    },
  ]);

  // 通知設定
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: false,
    comments: true,
    uploads: true,
  });

  // URLパラメータからタブを設定
  useEffect(() => {
    const tab = searchParams.get('tab') as Tab;
    if (tab && ['profile', 'team', 'notifications'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    router.push(`/settings?tab=${tab}`);
  };

  const handleProfileUpdate = async () => {
    try {
      // プロフィール更新API呼び出し（モック）
      console.log('Updating profile:', profile);
      // await updateUserProfile(profile);
      alert('プロフィールを更新しました');
    } catch (error) {
      console.error('Profile update failed:', error);
      alert('プロフィールの更新に失敗しました');
    }
  };

  const handleInviteMember = async () => {
    const email = prompt('招待するメンバーのメールアドレスを入力してください');
    if (email) {
      try {
        // メンバー招待API呼び出し（モック）
        console.log('Inviting member:', email);
        // await inviteTeamMember(email);
        alert(`${email} に招待メールを送信しました`);
      } catch (error) {
        console.error('Member invitation failed:', error);
        alert('招待メールの送信に失敗しました');
      }
    }
  };

  const handleRoleChange = (memberId: string, newRole: 'admin' | 'user' | 'viewer') => {
    setTeamMembers(prev => 
      prev.map(member => 
        member.id === memberId ? { ...member, role: newRole } : member
      )
    );
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('このメンバーを削除しますか？')) {
      setTeamMembers(prev => prev.filter(member => member.id !== memberId));
    }
  };

  const handleNotificationToggle = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">管理者</span>;
      case 'user':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">ユーザー</span>;
      case 'viewer':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">閲覧者</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={handleMobileSidebarClose}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileSidebarToggle={handleMobileSidebarToggle} />
        
        <main className="flex-1 container mx-auto px-4 py-8 bg-white">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              設定
            </h1>
            <p className="text-gray-600">
              アカウント設定とチーム管理を行います
            </p>
          </div>

          {/* タブナビゲーション */}
          <div className="border-b border-gray-200 mb-8 bg-white">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'profile'
                    ? 'active-tab'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover-border'
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                プロフィール
              </button>
              <button
                onClick={() => handleTabChange('team')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'team'
                    ? 'active-tab'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover-border'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                チーム管理
              </button>
              <button
                onClick={() => handleTabChange('notifications')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'notifications'
                    ? 'active-tab'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover-border'
                }`}
              >
                <Bell className="w-4 h-4 inline mr-2" />
                通知設定
              </button>
            </nav>
          </div>

          {/* プロフィールタブ */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl">
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle>プロフィール情報</CardTitle>
                  <CardDescription>
                    アカウントの基本情報を管理します
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        名前
                      </label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        メールアドレス
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      権限
                    </label>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      {getRoleBadge(profile.role)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      テーマ
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setProfile(prev => ({ ...prev, theme: 'light' }))}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-md transition-colors hover-button ${
                          profile.theme === 'light'
                            ? 'active-button border-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        <Sun className="w-4 h-4" />
                        ライト
                      </button>
                      <button
                        onClick={() => setProfile(prev => ({ ...prev, theme: 'dark' }))}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-md transition-colors hover-button ${
                          profile.theme === 'dark'
                            ? 'active-button border-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        <Moon className="w-4 h-4" />
                        ダーク
                      </button>
                      <button
                        onClick={() => setProfile(prev => ({ ...prev, theme: 'system' }))}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-md transition-colors hover-button ${
                          profile.theme === 'system'
                            ? 'active-button border-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        <Monitor className="w-4 h-4" />
                        システム
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleProfileUpdate} className="bg-blue-600 text-white hover:bg-blue-700">
                      更新
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* チーム管理タブ */}
          {activeTab === 'team' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">チームメンバー</h2>
                  <p className="text-gray-600">チームメンバーの招待と権限管理</p>
                </div>
                <Button onClick={handleInviteMember} className="bg-blue-600 text-white hover:bg-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  メンバーを招待
                </Button>
              </div>

              <Card className="bg-white border border-gray-200">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            メンバー
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            権限
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            最終アクティブ
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {teamMembers.map((member) => (
                          <tr key={member.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <User className="h-5 w-5 text-blue-600" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {member.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {member.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={member.role}
                                onChange={(e) => handleRoleChange(member.id, e.target.value as any)}
                                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                                disabled={member.id === '1'} // 自分の権限は変更不可
                              >
                                <option value="admin">管理者</option>
                                <option value="user">ユーザー</option>
                                <option value="viewer">閲覧者</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(member.lastActive)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {member.id !== '1' && ( // 自分は削除不可
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="hover-danger"
                                >
                                  削除
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 通知設定タブ */}
          {activeTab === 'notifications' && (
            <div className="max-w-2xl">
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle>通知設定</CardTitle>
                  <CardDescription>
                    受信する通知の種類を設定します
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">メール通知</p>
                          <p className="text-sm text-gray-500">重要な更新をメールで受信</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.email}
                          onChange={() => handleNotificationToggle('email')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">プッシュ通知</p>
                          <p className="text-sm text-gray-500">ブラウザでの通知を受信</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.push}
                          onChange={() => handleNotificationToggle('push')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <SettingsIcon className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">コメント通知</p>
                          <p className="text-sm text-gray-500">新しいコメントの通知</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.comments}
                          onChange={() => handleNotificationToggle('comments')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">アップロード完了通知</p>
                          <p className="text-sm text-gray-500">ファイル処理完了の通知</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.uploads}
                          onChange={() => handleNotificationToggle('uploads')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">
                      設定を保存
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 