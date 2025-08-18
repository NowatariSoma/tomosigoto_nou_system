'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Badge } from '@/components/ui/feedback/badge';
import { Textarea } from '@/components/ui/inputs/textarea';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Separator } from '@/components/ui/layout/separator';
import { StepNavigation } from '@/shared/components';
import { StepDefinition } from '@/shared/types';
import { 
  MessageSquare, 
  Target, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Users,
  Clock,
  Lightbulb
} from 'lucide-react';
import { useRequirements } from '../hooks/useRequirements';
import { RequirementItem, RequirementStep } from '../types';

// 要件定義プロセスのステップ定義
const requirementSteps: StepDefinition<RequirementStep>[] = [
  {
    key: 'hearing',
    label: 'ヒアリング',
    description: 'お客様情報・現状把握',
    shortLabel: 'ヒアリング',
    icon: Users
  },
  {
    key: 'requirements',
    label: '要件整理',
    description: '要件の洗い出し・整理',
    shortLabel: '要件整理',
    icon: FileText
  },
  {
    key: 'review',
    label: '確認・承認',
    description: '要件定義書の確認',
    shortLabel: '確認',
    icon: CheckCircle
  }
];

export function RequirementsPage() {
  const {
    currentStep,
    setCurrentStep,
    customerInfo,
    setCustomerInfo,
    requirements,
    newRequirement,
    setNewRequirement,
    addRequirement,
    updateRequirementStatus,
    getPriorityColor
  } = useRequirements();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'confirmed': return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <AppTemplate
      title="要望ヒアリング・要件洗い出し"
      description="お客様の導入目的と要件を明確化"
      maxWidth="7xl"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="h-8 w-8 text-blue-600" />
          <div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-green-100 text-green-800">難易度：低</Badge>
              <span className="text-gray-600">お客様の導入目的と要件を明確化</span>
            </div>
          </div>
        </div>
      </div>

      {/* ステップナビゲーション */}
      <StepNavigation
        steps={requirementSteps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        canNavigateToStep={() => true}
        showProgressBar={true}
        showCurrentStepInfo={true}
      />

      {/* ヒアリングステップ */}
      {currentStep === 'hearing' && (
        <div className="space-y-6">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                お客様情報・現状把握
              </CardTitle>
              <CardDescription>
                導入検討の背景と現在の課題を詳しくお聞かせください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">会社名</Label>
                  <Input
                    id="companyName"
                    value={customerInfo.companyName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerInfo({...customerInfo, companyName: e.target.value})}
                    placeholder="株式会社○○"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson">ご担当者様</Label>
                  <Input
                    id="contactPerson"
                    value={customerInfo.contactPerson}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerInfo({...customerInfo, contactPerson: e.target.value})}
                    placeholder="山田 太郎"
                  />
                </div>
                <div>
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    placeholder="yamada@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">電話番号</Label>
                  <Input
                    id="phone"
                    value={customerInfo.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    placeholder="03-1234-5678"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="industry">業界・事業内容</Label>
                <Input
                  id="industry"
                  value={customerInfo.industry}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerInfo({...customerInfo, industry: e.target.value})}
                  placeholder="例：自動車部品製造、精密機械加工"
                />
              </div>
              
              <div>
                <Label htmlFor="currentProcess">現在の製造プロセス</Label>
                <Textarea
                  id="currentProcess"
                  value={customerInfo.currentProcess}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomerInfo({...customerInfo, currentProcess: e.target.value})}
                  placeholder="現在の製造工程、使用している設備、作業フローなどを詳しく教えてください"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="challenges">現在の課題・困りごと</Label>
                <Textarea
                  id="challenges"
                  value={customerInfo.challenges}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomerInfo({...customerInfo, challenges: e.target.value})}
                  placeholder="生産性の問題、品質のばらつき、人手不足、コスト増加など"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="goals">導入目的・期待する効果</Label>
                <Textarea
                  id="goals"
                  value={customerInfo.goals}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomerInfo({...customerInfo, goals: e.target.value})}
                  placeholder="自動化による効率化、品質向上、コスト削減、生産能力向上など"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={() => setCurrentStep('requirements')}
            >
              要件整理へ進む
            </Button>
          </div>
        </div>
      )}

      {/* 要件整理ステップ */}
      {currentStep === 'requirements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 導入目的の明確化 */}
            <Card className="bg-blue-50 border border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Target className="h-5 w-5" />
                  導入目的の明確化
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-blue-700">主要目的：</div>
                  <ul className="list-disc list-inside space-y-1 text-blue-600">
                    <li>生産性向上</li>
                    <li>品質安定化</li>
                    <li>コスト削減</li>
                    <li>作業自動化</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 機能要件 */}
            <Card className="bg-green-50 border border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Settings className="h-5 w-5" />
                  機能要件
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-green-700">必要な機能：</div>
                  <ul className="list-disc list-inside space-y-1 text-green-600">
                    <li>レーザ加工機能</li>
                    <li>ワーク搬送システム</li>
                    <li>品質検査機能</li>
                    <li>制御システム</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 非機能要件 */}
            <Card className="bg-orange-50 border border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <AlertCircle className="h-5 w-5" />
                  非機能要件
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-orange-700">性能・制約：</div>
                  <ul className="list-disc list-inside space-y-1 text-orange-600">
                    <li>処理能力・速度</li>
                    <li>設置スペース</li>
                    <li>安全性要件</li>
                    <li>保守性</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 要件追加フォーム */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                新しい要件を追加
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">カテゴリ</Label>
                  <select
                    id="category"
                    value={newRequirement.category}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewRequirement({...newRequirement, category: e.target.value as RequirementItem['category']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="purpose">導入目的</option>
                    <option value="functional">機能要件</option>
                    <option value="non-functional">非機能要件</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="priority">優先度</Label>
                  <select
                    id="priority"
                    value={newRequirement.priority}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewRequirement({...newRequirement, priority: e.target.value as RequirementItem['priority']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="title">要件名</Label>
                  <Input
                    id="title"
                    value={newRequirement.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRequirement({...newRequirement, title: e.target.value})}
                    placeholder="要件の名称"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">詳細説明</Label>
                <Textarea
                  id="description"
                  value={newRequirement.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewRequirement({...newRequirement, description: e.target.value})}
                  placeholder="要件の詳細な説明を入力してください"
                  rows={3}
                />
              </div>
              <Button onClick={addRequirement}>要件を追加</Button>
            </CardContent>
          </Card>

          {/* 要件一覧 */}
          {requirements.length > 0 && (
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle>整理された要件一覧</CardTitle>
                <CardDescription>
                  {requirements.length}件の要件が登録されています
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {requirements.map((req) => (
                    <div key={req.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(req.status)}
                          <h4 className="font-medium">{req.title}</h4>
                          <Badge className={getPriorityColor(req.priority)}>
                            {req.priority === 'high' ? '高' : req.priority === 'medium' ? '中' : '低'}
                          </Badge>
                          <Badge variant="outline">
                            {req.category === 'purpose' ? '導入目的' : 
                             req.category === 'functional' ? '機能要件' : '非機能要件'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{req.description}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant={req.status === 'confirmed' ? 'default' : 'outline'}
                          onClick={() => updateRequirementStatus(req.id, req.status === 'confirmed' ? 'pending' : 'confirmed')}
                        >
                          {req.status === 'confirmed' ? '確認済み' : '確認'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('hearing')}>
              ヒアリングに戻る
            </Button>
            <Button 
              onClick={() => setCurrentStep('review')}
            >
              確認・承認へ進む
            </Button>
          </div>
        </div>
      )}

      {/* 確認・承認ステップ */}
      {currentStep === 'review' && (
        <div className="space-y-6">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                要件定義書（最終確認）
              </CardTitle>
              <CardDescription>
                以下の内容で要件定義を確定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* お客様情報サマリー */}
              <div>
                <h3 className="text-lg font-semibold mb-3">お客様情報</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">会社名：</span>{customerInfo.companyName}</div>
                  <div><span className="font-medium">担当者：</span>{customerInfo.contactPerson}</div>
                  <div><span className="font-medium">業界：</span>{customerInfo.industry}</div>
                  <div><span className="font-medium">連絡先：</span>{customerInfo.email}</div>
                </div>
              </div>

              <Separator />

              {/* 要件サマリー */}
              <div>
                <h3 className="text-lg font-semibold mb-3">要件サマリー</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['purpose', 'functional', 'non-functional'].map((category) => {
                    const categoryReqs = requirements.filter(req => req.category === category);
                    const categoryName = category === 'purpose' ? '導入目的' : 
                                       category === 'functional' ? '機能要件' : '非機能要件';
                    return (
                      <div key={category} className="space-y-2">
                        <h4 className="font-medium text-gray-700">{categoryName}</h4>
                        <div className="space-y-1">
                          {categoryReqs.map((req) => (
                            <div key={req.id} className="text-sm p-2 bg-gray-50 rounded">
                              <div className="font-medium">{req.title}</div>
                              <div className="text-gray-600 text-xs">{req.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* 次のステップ */}
              <div>
                <h3 className="text-lg font-semibold mb-3">次のステップ</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>機械選定（難易度：中）</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>装置レイアウト設計（難易度：高）</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>詳細設計・仕様書作成</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('requirements')}>
              要件整理に戻る
            </Button>
            <div className="flex gap-2">
              <Button variant="outline">
                要件定義書をダウンロード
              </Button>
              <Button>
                要件定義を確定
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppTemplate>
  );
} 