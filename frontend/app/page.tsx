'use client';
  
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Calendar, Settings, BookOpen, Building, Home, Users } from 'lucide-react';

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  difficulty?: 'low' | 'medium' | 'high';
  variant?: 'default' | 'outline';
}

const dashboardCards: DashboardCard[] = [
  {
    id: 'practice-schedule',
    title: '登録',
    description: '練習スケジュールと部屋の登録・管理',
    icon: 'Calendar',
    route: '/practice-schedule',
    difficulty: 'low',
    variant: 'default'
  },
  {
    id: 'practice-slots',
    title: '練習表',
    description: '日毎の練習スケジュールを確認・管理',
    icon: 'BookOpen',
    route: '/practice-slots',
    difficulty: 'low',
    variant: 'default'
  },
  {
    id: 'room-settings',
    title: '部屋設定',
    description: '使用する部屋の登録と管理',
    icon: 'Building',
    route: '/room-settings',
    difficulty: 'medium',
    variant: 'default'
  },
  {
    id: 'settings',
    title: '設定',
    description: 'システム設定とユーザー管理',
    icon: 'Settings',
    route: '/settings',
    difficulty: 'low',
    variant: 'default'
  }
];

const iconMap = {
  Calendar,
  Settings,
  BookOpen,
  Building,
  Home,
  Users
};

const difficultyColors = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-red-600'
};

const difficultyLabels = {
  low: '低',
  medium: '中',
  high: '高'
};

const iconColors = {
  Calendar: 'text-blue-600',
  Settings: 'text-orange-600',
  BookOpen: 'text-green-600',
  Building: 'text-purple-600',
  Home: 'text-indigo-600',
  Users: 'text-red-600'
};

export default function HomePage() {
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  const handleCardClick = (route: string) => {
    router.push(route);
  };
  
  return (
    <div className="min-h-screen bg-white">
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={handleMobileSidebarClose}
      />
      
      <div className="flex flex-col min-h-screen md:pl-64">
        <Header onMobileSidebarToggle={handleMobileSidebarToggle} />
        
        <main className="flex-1 w-full px-4 py-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Home className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    練習管理システム
                  </h1>
                </div>
              </div>
              <p className="text-gray-600">
                練習スケジュールと部屋の管理を効率的に行うシステムです
              </p>
            </div>

            {/* 練習管理 Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">練習管理</h2>
              <p className="text-gray-600 mb-6">練習スケジュールと部屋の登録・管理機能</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardCards.filter(card => ['practice-schedule', 'practice-slots', 'room-settings'].includes(card.id)).map((card) => {
                  const IconComponent = iconMap[card.icon as keyof typeof iconMap];
                  const iconColor = iconColors[card.icon as keyof typeof iconColors] || 'text-gray-600';
                  const isClickable = !!card.route;

                  return (
                    <Card 
                      key={card.id}
                      className={`bg-white border border-gray-200 ${isClickable ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}
                      onClick={isClickable ? () => handleCardClick(card.route) : undefined}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {IconComponent && <IconComponent className={`h-5 w-5 ${iconColor}`} />}
                          {card.title}
                        </CardTitle>
                        <CardDescription>
                          {card.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full">
                          {card.id === 'practice-schedule' ? '登録画面を開く' : 
                           card.id === 'practice-slots' ? '練習表を確認' :
                           card.id === 'room-settings' ? '部屋設定を開く' : 'スタート'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* その他 Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">その他</h2>
              <p className="text-gray-600 mb-6">システム設定とその他の機能</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardCards.filter(card => card.id === 'settings').map((card) => {
                  const IconComponent = iconMap[card.icon as keyof typeof iconMap];
                  const iconColor = iconColors[card.icon as keyof typeof iconColors] || 'text-gray-600';
                  const isClickable = !!card.route;

                  return (
                    <Card 
                      key={card.id}
                      className={`bg-white border border-gray-200 ${isClickable ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}
                      onClick={isClickable ? () => handleCardClick(card.route) : undefined}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {IconComponent && <IconComponent className={`h-5 w-5 ${iconColor}`} />}
                          {card.title}
                        </CardTitle>
                        <CardDescription>
                          {card.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full">
                          {card.id === 'settings' ? '設定を開く' : 'スタート'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 