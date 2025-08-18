'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';
import { Button } from '@/components/ui/forms/button';
import { Settings, Wifi, WifiOff } from 'lucide-react';
import { MCPSettings, MCPConnectionStatus } from '../../types';

interface SettingsTabProps {
  settings: MCPSettings;
  connectionStatus: MCPConnectionStatus;
  onUpdateSettings: (settings: Partial<MCPSettings>) => void;
  onTestConnection: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  connectionStatus,
  onUpdateSettings,
  onTestConnection,
}) => {
  const handleSaveSettings = () => {
    // TODO: 実際の設定保存処理
    alert('設定を保存しました');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            MCP接続設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="mcpEndpoint">MCPエンドポイント</Label>
            <Input
              id="mcpEndpoint"
              value={settings.endpoint}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                onUpdateSettings({ endpoint: e.target.value })
              }
              placeholder="MCPサーバーのURL"
            />
          </div>
          
          <div>
            <Label htmlFor="apiKey">APIキー</Label>
            <Input
              id="apiKey"
              type="password"
              value={settings.apiKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                onUpdateSettings({ apiKey: e.target.value })
              }
              placeholder="APIキーを入力"
            />
          </div>
          
          <div>
            <Label htmlFor="maxJobs">最大同時実行ジョブ数</Label>
            <Select 
              value={settings.maxJobs.toString()} 
              onValueChange={(value) => onUpdateSettings({ maxJobs: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveSettings} className="flex-1">
              設定を保存
            </Button>
            <Button 
              variant="outline" 
              onClick={onTestConnection}
              className="flex items-center gap-2"
            >
              {connectionStatus.isConnected ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              接続テスト
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 接続状態表示 */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle>接続状態</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm">
                {connectionStatus.isConnected ? 'MCP接続中' : 'MCP切断'}
              </span>
            </div>
            {connectionStatus.lastConnected && (
              <div className="text-sm text-gray-600">
                最終接続: {connectionStatus.lastConnected}
              </div>
            )}
            {connectionStatus.error && (
              <div className="text-sm text-red-600">
                エラー: {connectionStatus.error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 