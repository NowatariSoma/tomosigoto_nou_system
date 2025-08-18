'use client';

import { useHearingAssistant } from '../../hooks/useHearingAssistant';
import { AIAnalysisResult } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { Badge } from '@/components/ui/feedback/badge';
import { 
  Search, 
  ArrowRight, 
  CheckCircle, 
  Target,
  MessageCircle,
  TrendingUp
} from 'lucide-react';

export function AnalysisStep() {
  const { 
    analysisResult, 
    startDialogue,
    canProceedToDialogue 
  } = useHearingAssistant();

  // モックデータを生成する関数
  const generateMockAnalysisResult = (): AIAnalysisResult => {
    return {
      extractedKeywords: [
        {
          keyword: '切断',
          category: '加工モード',
          confidence: 0.95,
          context: 'SUS304の薄板を高速で切断したい'
        },
        {
          keyword: 'SUS304',
          category: '材料',
          confidence: 0.92,
          context: 'SUS304の薄板（0.5mm〜2mm）'
        },
        {
          keyword: '高速',
          category: '性能要件',
          confidence: 0.88,
          context: '高速で切断したい'
        },
        {
          keyword: '±0.05mm',
          category: '精度',
          confidence: 0.98,
          context: '精度は±0.05mmが必須'
        },
        {
          keyword: '生産管理システム',
          category: '通信',
          confidence: 0.85,
          context: '既存の生産管理システムと連携'
        },
        {
          keyword: '自動車部品',
          category: '業界',
          confidence: 0.90,
          context: '顧客は自動車部品メーカー'
        },
        {
          keyword: '3000万円',
          category: '予算',
          confidence: 0.87,
          context: '予算は3000万円くらい'
        }
      ],
      mappedRequirements: [
        {
          section: '機能要件',
          field: 'processingMode',
          value: 'レーザー切断',
          confidence: 0.95,
          source: 'SUS304の薄板を高速で切断したい'
        },
        {
          section: '機能要件',
          field: 'targetMaterials',
          value: 'ステンレス(SUS304), 厚み 0.5mm～2.0mm',
          confidence: 0.92,
          source: 'SUS304の薄板（0.5mm〜2mm）'
        },
        {
          section: '機能要件',
          field: 'processingPrecision',
          value: '±0.05mm',
          confidence: 0.98,
          source: '精度は±0.05mmが必須'
        },
        {
          section: '機能要件',
          field: 'communicationFeatures',
          value: '生産管理システム連携, 実績データ送信',
          confidence: 0.85,
          source: '既存の生産管理システムと連携して、実績データを送れるように'
        },
        {
          section: '非機能要件',
          field: 'performanceRequirements',
          value: '高速加工対応',
          confidence: 0.88,
          source: '高速で切断したい'
        },
        {
          section: '制約事項',
          field: 'budgetConstraints',
          value: '3,000万円',
          confidence: 0.87,
          source: '予算は3000万円くらい'
        }
      ],
      confidence: 0.89,
      suggestedQuestions: [
        '具体的な加工速度やタクトタイムの目標値は？',
        'ファイバーレーザーとCO2レーザーのどちらを希望されますか？',
        'アシストガスの種類（窒素、酸素など）に指定はありますか？',
        'HMI（操作画面）の要件はいかがですか？',
        '安全規格（CEマーキング、UL規格など）の対応は必要ですか？'
      ]
    };
  };

  // 分析結果がない場合はモックデータを使用
  const displayAnalysisResult = analysisResult || generateMockAnalysisResult();

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return '高';
    if (confidence >= 0.6) return '中';
    return '低';
  };

  return (
    <div className="space-y-6">
      {/* モックデータ使用時の警告 */}
      {!analysisResult && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">
                デモ用のサンプル分析結果を表示しています
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 分析サマリー */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            分析完了
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {displayAnalysisResult.extractedKeywords.length}
              </div>
              <div className="text-sm text-green-700">抽出キーワード</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {displayAnalysisResult.mappedRequirements.length}
              </div>
              <div className="text-sm text-green-700">マッピング済み項目</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(displayAnalysisResult.confidence * 100)}%
              </div>
              <div className="text-sm text-green-700">分析信頼度</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 抽出されたキーワード */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            抽出されたキーワード
          </CardTitle>
          <CardDescription>
            入力内容から自動的に抽出された重要なキーワードです
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(
              displayAnalysisResult.extractedKeywords.reduce((acc, keyword) => {
                if (!acc[keyword.category]) acc[keyword.category] = [];
                acc[keyword.category].push(keyword);
                return acc;
              }, {} as Record<string, typeof displayAnalysisResult.extractedKeywords>)
            ).map(([category, keywords]) => (
              <div key={category}>
                <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      className={`${getConfidenceColor(keyword.confidence)} border-0`}
                    >
                      {keyword.keyword}
                      <span className="ml-1 text-xs">
                        ({getConfidenceLabel(keyword.confidence)})
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* マッピングされた要件 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            要件定義項目へのマッピング
          </CardTitle>
          <CardDescription>
            キーワードから自動的に推定された要件定義項目です
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(
              displayAnalysisResult.mappedRequirements.reduce((acc, req) => {
                if (!acc[req.section]) acc[req.section] = [];
                acc[req.section].push(req);
                return acc;
              }, {} as Record<string, typeof displayAnalysisResult.mappedRequirements>)
            ).map(([section, requirements]) => (
              <div key={section} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">{section}</h4>
                <div className="space-y-2">
                  {requirements.map((req, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{req.field}</div>
                        <div className="text-gray-600 text-sm">{req.value}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          出典: "{req.source}"
                        </div>
                      </div>
                      <Badge className={getConfidenceColor(req.confidence)}>
                        {getConfidenceLabel(req.confidence)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 推奨される質問 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-orange-600" />
            AIが推奨する確認事項
          </CardTitle>
          <CardDescription>
            より詳細な要件を明確にするための質問項目です
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {displayAnalysisResult.suggestedQuestions.map((question, index) => (
              <li key={index} className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{question}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* アクションボタン */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
        >
          入力内容を修正
        </Button>
        
        <Button
          onClick={startDialogue}
          disabled={!canProceedToDialogue}
          className="btn-primary flex items-center gap-2"
        >
          対話を開始
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 