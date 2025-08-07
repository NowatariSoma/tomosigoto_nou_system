'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { TrendingUp } from 'lucide-react';

export function PerformanceTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle>設計効率</CardTitle>
            <CardDescription>平均設計時間の推移</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">18.5日</div>
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">12%改善</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">前期比較</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle>品質スコア</CardTitle>
            <CardDescription>プロジェクト品質評価</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">92.3</div>
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">+3.2pt</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">100点満点</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle>顧客満足度</CardTitle>
            <CardDescription>プロジェクト満足度評価</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">4.7</div>
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">+0.3pt</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">5点満点</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle>改善提案</CardTitle>
          <CardDescription>システム分析に基づく改善案</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">設計時間短縮</h4>
              <p className="text-sm text-blue-800">
                MCP連携システムの活用により、計算時間を平均30%短縮できる可能性があります。
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">コスト最適化</h4>
              <p className="text-sm text-green-800">
                材料データベースの活用により、材料コストを平均15%削減できる見込みです。
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">品質向上</h4>
              <p className="text-sm text-purple-800">
                レイアウト設計ツールの機能拡張により、設計品質をさらに向上できます。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 