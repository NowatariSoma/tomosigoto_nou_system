'use client';

import { useState } from 'react';
import { useHearingAssistant } from '../../hooks/useHearingAssistant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { Textarea } from '@/components/ui/inputs/textarea';
import { Label } from '@/components/ui/inputs/label';
import { Input } from '@/components/ui/inputs/input';
import { FileText, Upload, ArrowRight, Lightbulb } from 'lucide-react';

export function HearingInputStep() {
  const { 
    hearingInput, 
    updateHearingInput, 
    analyzeInput, 
    canProceedToAnalysis 
  } = useHearingAssistant();

  const [keywords, setKeywords] = useState<string>('');

  const handleKeywordsChange = (value: string) => {
    setKeywords(value);
    const keywordArray = value.split(',').map(k => k.trim()).filter(k => k.length > 0);
    updateHearingInput({ keywords: keywordArray });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        updateHearingInput({ meetingNotes: content });
      };
      reader.readAsText(file);
    }
  };

  const exampleText = `顧客は自動車部品メーカー。SUS304の薄板（0.5mm〜2mm）を高速で切断したい。
精度は±0.05mmが必須。既存の生産管理システムと連携して、実績データを送れるようにしたいらしい。
予算は3000万円くらい。安全規格はISO対応が必要。`;

  const handleUseExample = () => {
    updateHearingInput({ rawText: exampleText });
  };

  return (
    <div className="space-y-6">
      {/* 説明カード */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Lightbulb className="h-5 w-5" />
            使い方のコツ
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ul className="space-y-2 text-sm">
            <li>• ヒアリング内容を自由な形式で入力してください（箇条書き、文章、議事録など）</li>
            <li>• 完璧な文章である必要はありません。断片的な情報でも大丈夫です</li>
            <li>• AIが自動的にキーワードを抽出し、要件定義の項目にマッピングします</li>
            <li>• 入力後、AIが不足している情報について質問形式で確認します</li>
          </ul>
        </CardContent>
      </Card>

      {/* メインの入力フォーム */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            ヒアリング内容の入力
          </CardTitle>
          <CardDescription>
            お客様とのヒアリング内容を自由な形式で入力してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* メインテキストエリア */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="rawText">ヒアリングメモ・議事録</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseExample}
                className="text-xs"
              >
                サンプルを使用
              </Button>
            </div>
            <Textarea
              id="rawText"
              value={hearingInput.rawText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                updateHearingInput({ rawText: e.target.value })
              }
              placeholder="例：顧客は自動車部品メーカー。SUS304の薄板を高速で切断したい。精度は±0.05mmが必須..."
              rows={8}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              {hearingInput.rawText.length} 文字
            </div>
          </div>

          {/* 追加情報セクション */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 議事録ファイルアップロード */}
            <div>
              <Label htmlFor="meetingNotes">議事録・補足資料</Label>
              <div className="mt-2 space-y-2">
                <Textarea
                  id="meetingNotes"
                  value={hearingInput.meetingNotes || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    updateHearingInput({ meetingNotes: e.target.value })
                  }
                  placeholder="会議の詳細な議事録や補足情報があれば入力してください"
                  rows={4}
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".txt,.md,.doc,.docx"
                    onChange={handleFileUpload}
                    className="text-sm"
                  />
                  <Upload className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* キーワード入力 */}
            <div>
              <Label htmlFor="keywords">重要キーワード（任意）</Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleKeywordsChange(e.target.value)
                }
                placeholder="切断,SUS304,高精度,MES連携"
                className="mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">
                カンマ区切りで入力してください
              </div>
            </div>
          </div>

          {/* 追加情報 */}
          <div>
            <Label htmlFor="additionalInfo">その他の情報</Label>
            <Textarea
              id="additionalInfo"
              value={hearingInput.additionalInfo || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                updateHearingInput({ additionalInfo: e.target.value })
              }
              placeholder="技術的な制約、特殊な要求、将来の拡張予定など"
              rows={3}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* アクションボタン */}
      <div className="flex justify-end">
        <Button
          onClick={analyzeInput}
          disabled={!canProceedToAnalysis}
          className="btn-primary flex items-center gap-2"
        >
          AI分析を開始
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 