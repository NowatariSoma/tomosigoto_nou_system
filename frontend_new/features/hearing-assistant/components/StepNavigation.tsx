'use client';

import { HearingStep, HearingInput, AIAnalysisResult, AIResponse } from '../types';
import { 
  FileText, 
  Search, 
  MessageCircle, 
  Eye
} from 'lucide-react';
import { StepNavigation as GenericStepNavigation } from '@/shared/components';
import { StepDefinition } from '@/shared/types';

const steps: StepDefinition<HearingStep>[] = [
  {
    key: 'input',
    label: 'ヒアリング入力',
    description: 'メモや議事録を入力',
    shortLabel: '入力',
    icon: FileText
  },
  {
    key: 'analysis',
    label: 'AI分析',
    description: 'キーワード抽出・マッピング',
    shortLabel: '分析',
    icon: Search
  },
  {
    key: 'dialogue',
    label: '対話質問',
    description: 'AIとの質疑応答',
    shortLabel: '対話',
    icon: MessageCircle
  },
  {
    key: 'preview',
    label: 'プレビュー',
    description: '要件定義書確認',
    shortLabel: '確認',
    icon: Eye
  }
];

interface StepNavigationProps {
  currentStep: HearingStep;
  setCurrentStep: (step: HearingStep) => void;
  hearingInput: HearingInput;
  analysisResult: AIAnalysisResult | null;
  responses: AIResponse[];
}

export function StepNavigation({ 
  currentStep, 
  setCurrentStep, 
  hearingInput, 
  analysisResult, 
  responses 
}: StepNavigationProps) {

  const canNavigateToStep = (stepKey: HearingStep): boolean => {
    // すべてのステップに自由に移動できるように条件を緩和
    return true;
    
    // 以下は元の厳密な条件（必要に応じてコメントアウトを外す）
    // switch (stepKey) {
    //   case 'input':
    //     return true;
    //   case 'analysis':
    //     return hearingInput.rawText.trim().length > 0 || analysisResult !== null;
    //   case 'dialogue':
    //     return analysisResult !== null;
    //   case 'preview':
    //     return responses.length > 0;
    //   default:
    //     return false;
    // }
  };

  const getNavigationMessage = (stepKey: HearingStep): string => {
    // すべてのステップに移動可能なので、常に移動メッセージを表示
    return `${steps.find(s => s.key === stepKey)?.label}に移動`;
    
    // 以下は元の条件付きメッセージ（必要に応じてコメントアウトを外す）
    // if (canNavigateToStep(stepKey)) {
    //   return `${steps.find(s => s.key === stepKey)?.label}に移動`;
    // }
    // 
    // switch (stepKey) {
    //   case 'analysis':
    //     return 'ヒアリング内容を入力してください';
    //   case 'dialogue':
    //     return 'AI分析を完了してください';
    //   case 'preview':
    //     return '対話質問に回答してください';
    //   default:
    //     return 'まだ利用できません';
    // }
  };

  return (
    <GenericStepNavigation
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      canNavigateToStep={canNavigateToStep}
      getNavigationMessage={getNavigationMessage}
      showProgressBar={true}
      showCurrentStepInfo={true}
      debugMode={true}
    />
  );
} 