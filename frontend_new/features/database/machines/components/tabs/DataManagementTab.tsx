'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { Badge } from '@/components/ui/feedback/badge';
import { Upload, Download, Database, AlertTriangle, Wrench } from 'lucide-react';

interface DataManagementTabProps {
  machineCount: number;
}

export const DataManagementTab: React.FC<DataManagementTabProps> = ({
  machineCount,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              データインポート
            </CardTitle>
            <CardDescription>
              CSVファイルから機械設備データを一括登録
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                CSVファイルをドラッグ&ドロップ
              </p>
              <Button variant="outline" size="sm">
                ファイルを選択
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              <p>対応形式: CSV (.csv)</p>
              <p>最大サイズ: 10MB</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-green-600" />
              データエクスポート
            </CardTitle>
            <CardDescription>
              現在の機械設備データベースをエクスポート
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                CSV形式でエクスポート
              </Button>
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Excel形式でエクスポート
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              <p>全{machineCount}台の機械設備データが出力されます</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 機械設備統計情報 */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-purple-600" />
            機械設備統計
          </CardTitle>
          <CardDescription>
            機械設備データベースの概要統計
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{machineCount}</div>
              <div className="text-sm text-blue-700">登録機械数</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">-</div>
              <div className="text-sm text-green-700">稼働中機械</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">-</div>
              <div className="text-sm text-yellow-700">メンテナンス予定</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 