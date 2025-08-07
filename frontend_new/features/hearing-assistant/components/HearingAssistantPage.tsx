'use client';

import { AppTemplate } from '@/shared/components/layout/AppTemplate';
import { useHearingAssistant } from '../hooks/useHearingAssistant';
import { HearingInputStep } from './steps/HearingInputStep';
import { AnalysisStep } from './steps/AnalysisStep';
import { DialogueStep } from './steps/DialogueStep';
import { PreviewStep } from './steps/PreviewStep';
import { StepNavigation } from './StepNavigation';
import { MessageSquare, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/feedback/badge';
import { Alert, AlertDescription } from '@/components/ui/feedback/alert';

export function HearingAssistantPage() {
  const {
    currentStep,
    isLoading,
    error,
    progressPercentage,
    resetAssistant,
    setCurrentStep,
    hearingInput,
    analysisResult,
    responses
  } = useHearingAssistant();

  // デバッグ用: currentStepの変更を監視
  console.log('HearingAssistantPage: currentStep =', currentStep);

  const renderCurrentStep = () => {
    console.log('renderCurrentStep called with currentStep:', currentStep);
    switch (currentStep) {
      case 'input':
        return <HearingInputStep />;
      case 'analysis':
        return <AnalysisStep />;
      case 'dialogue':
        return <DialogueStep />;
      case 'preview':
        return <PreviewStep />;
      default:
        return <HearingInputStep />;
    }
  };

  return (
    <AppTemplate
      title="対話型ヒアリング・アシスタント"
      description="AIとの対話を通じて要件定義書を自動生成"
      maxWidth="7xl"
    >
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">対話型ヒアリング・アシスタント</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-green-100 text-green-800">AI支援</Badge>
                <span className="text-gray-600">断片的な情報から要件定義書を自動生成</span>
              </div>
            </div>
          </div>
          
          {currentStep !== 'input' && (
            <button
              onClick={resetAssistant}
              className="btn-secondary"
            >
              最初からやり直す
            </button>
          )}
        </div>

        {/* プログレスバー */}
        {currentStep === 'dialogue' && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>対話の進捗</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* ステップナビゲーション - propsで状態を渡す */}
      <StepNavigation 
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        hearingInput={hearingInput}
        analysisResult={analysisResult}
        responses={responses}
      />

      {/* ローディング表示 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">
              {currentStep === 'input' && '入力内容を分析中...'}
              {currentStep === 'analysis' && '質問を生成中...'}
              {currentStep === 'dialogue' && '要件定義書を生成中...'}
            </span>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      {!isLoading && (
        <div className="space-y-6">
          {renderCurrentStep()}
        </div>
      )}
    </AppTemplate>
  );
} 