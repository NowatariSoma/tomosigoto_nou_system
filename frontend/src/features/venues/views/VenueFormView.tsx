'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Settings, 
  Calendar, 
  ImageIcon, 
  Save, 
  ArrowLeft, 
  ArrowRight,
  Check,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useVenueForm } from '../hooks/useVenueForm';
import { VenueBasicInfoForm } from '../components/VenueBasicInfoForm';
import { EquipmentEditor } from '../components/EquipmentEditor';
import { VenueAvailabilityEditor } from '../components/VenueAvailabilityEditor';
import { FORM_STEPS } from '../types/venueForm';

interface VenueFormViewProps {
  venueId?: number;
  onSaveComplete?: (venueId: number) => void;
}

// ステップ情報の定義
const STEP_INFO = [
  {
    id: FORM_STEPS.BASIC_INFO,
    title: '基本情報',
    description: '会場の基本的な情報を入力',
    icon: Building2
  },
  {
    id: FORM_STEPS.EQUIPMENT,
    title: '設備情報',
    description: '利用可能な設備を設定',
    icon: Settings
  },
  {
    id: FORM_STEPS.AVAILABILITY,
    title: '利用可能時間',
    description: '利用可能な日時を設定',
    icon: Calendar
  },
  {
    id: FORM_STEPS.IMAGES,
    title: '画像',
    description: '会場の写真をアップロード',
    icon: ImageIcon
  }
];

export const VenueFormView: React.FC<VenueFormViewProps> = ({
  venueId,
  onSaveComplete
}) => {
  const router = useRouter();
  const { toast } = useToast();
  
  const {
    formData,
    currentStep,
    isLoading,
    isSaving,
    errors,
    isDirty,
    updateField,
    changeStep,
    nextStep,
    previousStep,
    validateCurrentStep,
    saveForm,
    isStepComplete,
    isCurrentStepValid,
    canSubmit,
    FORM_STEPS: STEPS
  } = useVenueForm({
    venueId,
    onSaveComplete: (savedVenueId) => {
      if (onSaveComplete) {
        onSaveComplete(savedVenueId);
      } else {
        router.push(`/venues/${savedVenueId}`);
      }
    }
  });

  // 進捗率の計算
  const progress = React.useMemo(() => {
    const completedSteps = Object.values(STEPS).filter(step => isStepComplete(step));
    return (completedSteps.length / Object.values(STEPS).length) * 100;
  }, [isStepComplete, STEPS]);

  // 次のステップへ進む
  const handleNext = () => {
    if (validateCurrentStep()) {
      nextStep();
    }
  };

  // フォーム保存
  const handleSave = async () => {
    try {
      await saveForm();
    } catch (error) {
      // エラーハンドリングはuseVenueForm内で実行される
    }
  };

  // 現在のステップコンテンツを取得
  const getCurrentStepContent = () => {
    switch (currentStep) {
      case STEPS.BASIC_INFO:
        return (
          <VenueBasicInfoForm
            value={formData.basicInfo}
            onChange={(data) => updateField('basicInfo', data)}
            errors={errors.basicInfo}
            disabled={isLoading || isSaving}
          />
        );
      case STEPS.EQUIPMENT:
        return (
          <EquipmentEditor
            value={formData.equipment}
            onChange={(data) => updateField('equipment', data)}
            errors={errors.equipment}
            disabled={isLoading || isSaving}
          />
        );
      case STEPS.AVAILABILITY:
        return (
          <VenueAvailabilityEditor
            value={formData.availability}
            onChange={(data) => updateField('availability', data)}
            errors={errors.availability}
            disabled={isLoading || isSaving}
          />
        );
      case STEPS.IMAGES:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ImageIcon className="h-6 w-6 text-primary" />
                <span>会場画像</span>
              </CardTitle>
              <CardDescription>
                会場の写真をアップロードしてください（任意）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  画像アップロード機能は準備中です
                </p>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">
              {venueId ? '会場情報編集' : '新規会場登録'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {venueId 
                ? '会場の情報を編集してください' 
                : '新しい会場の情報を入力してください'
              }
            </p>
          </div>
          {isDirty && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <AlertCircle className="h-3 w-3" />
              <span>未保存の変更あり</span>
            </Badge>
          )}
        </div>

        {/* 進捗バー */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>進捗状況</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* エラー表示 */}
      {errors.general && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* ステップナビゲーション */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">入力ステップ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {STEP_INFO.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = isStepComplete(step.id);
                const isAccessible = index === 0 || isStepComplete(STEP_INFO[index - 1].id);

                return (
                  <div key={step.id}>
                    <button
                      onClick={() => isAccessible && changeStep(step.id)}
                      disabled={!isAccessible || isLoading || isSaving}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : isCompleted
                          ? 'bg-green-50 hover:bg-green-100 border border-green-200'
                          : isAccessible
                          ? 'hover:bg-muted/50'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <IconComponent className="h-5 w-5" />
                          {isCompleted && !isActive && (
                            <Check className="h-3 w-3 absolute -top-1 -right-1 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{step.title}</div>
                          <div className="text-xs opacity-75 truncate">
                            {step.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* フォームコンテンツ */}
        <div className="lg:col-span-3">
          <div className="space-y-6">
            {getCurrentStepContent()}

            {/* ナビゲーションボタン */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={previousStep}
                    disabled={currentStep === STEPS.BASIC_INFO || isLoading || isSaving}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    前のステップ
                  </Button>

                  <div className="flex items-center space-x-3">
                    {currentStep === STEPS.IMAGES ? (
                      <Button
                        onClick={handleSave}
                        disabled={!canSubmit()}
                        className="min-w-[120px]"
                      >
                        {isSaving && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        )}
                        <Save className="h-4 w-4 mr-2" />
                        {venueId ? '更新' : '登録'}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        disabled={!isCurrentStepValid() || isLoading || isSaving}
                      >
                        次のステップ
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};