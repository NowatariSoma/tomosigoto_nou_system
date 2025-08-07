'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';

export function ProjectsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle>プロジェクト規模別分析</CardTitle>
            <CardDescription>予算規模による分類</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">1,000万円未満</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '20%' }} />
                  </div>
                  <span className="text-sm font-medium">2件</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">1,000万円〜5,000万円</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '50%' }} />
                  </div>
                  <span className="text-sm font-medium">5件</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">5,000万円〜1億円</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '30%' }} />
                  </div>
                  <span className="text-sm font-medium">3件</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">1億円以上</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: '20%' }} />
                  </div>
                  <span className="text-sm font-medium">2件</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle>顧客業界分析</CardTitle>
            <CardDescription>業界別プロジェクト分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">自動車製造業</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '40%' }} />
                  </div>
                  <span className="text-sm font-medium">40%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">電子機器製造</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '30%' }} />
                  </div>
                  <span className="text-sm font-medium">30%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">建設・建材</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '20%' }} />
                  </div>
                  <span className="text-sm font-medium">20%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">その他</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-600 h-2 rounded-full" style={{ width: '10%' }} />
                  </div>
                  <span className="text-sm font-medium">10%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 