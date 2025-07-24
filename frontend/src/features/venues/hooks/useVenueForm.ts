import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  VenueFormData, 
  VenueFormErrors, 
  VenueFormState,
  FORM_STEPS 
} from '../types/venueForm';
import { 
  createDefaultVenueFormData,
  validateVenueFormData,
  validateVenueBasicInfo,
  validateEquipmentData,
  validateVenueAvailability
} from '../utils/validationHelpers';
import { 
  fetchVenue,
  createVenue,
  updateVenue,
  VenueApiError
} from '../api/venueFormApi';

interface UseVenueFormOptions {
  venueId?: number;
  onSaveComplete?: (venueId: number) => void;
  onError?: (error: Error) => void;
}

export const useVenueForm = (options: UseVenueFormOptions = {}) => {
  const { venueId, onSaveComplete, onError } = options;
  const { toast } = useToast();

  // フォーム状態
  const [formState, setFormState] = useState<VenueFormState>({
    data: createDefaultVenueFormData(),
    currentStep: FORM_STEPS.BASIC_INFO,
    isLoading: false,
    isSaving: false,
    errors: {},
    isDirty: false
  });

  // 初期データの読み込み
  const loadVenue = useCallback(async (id: number) => {
    setFormState(prev => ({ ...prev, isLoading: true, errors: {} }));
    
    try {
      const venueData = await fetchVenue(id);
      setFormState(prev => ({
        ...prev,
        data: venueData,
        isLoading: false,
        isDirty: false
      }));
    } catch (error) {
      const errorMessage = error instanceof VenueApiError 
        ? error.message 
        : '会場データの読み込みに失敗しました';
      
      setFormState(prev => ({
        ...prev,
        isLoading: false,
        errors: { general: errorMessage }
      }));

      toast({
        title: 'エラー',
        description: errorMessage,
        variant: 'destructive'
      });

      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  }, [toast, onError]);

  // コンポーネントマウント時の初期化
  useEffect(() => {
    if (venueId) {
      loadVenue(venueId);
    }
  }, [venueId, loadVenue]);

  // フィールドの更新
  const updateField = useCallback((path: string, value: any) => {
    setFormState(prev => {
      const newData = { ...prev.data };
      const keys = path.split('.');
      let current: any = newData;

      // ネストしたオブジェクトのプロパティを更新
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current)) {
          current[key] = {};
        }
        current = current[key];
      }

      current[keys[keys.length - 1]] = value;

      return {
        ...prev,
        data: newData,
        isDirty: true,
        errors: {
          ...prev.errors,
          // 該当フィールドのエラーをクリア
          [path]: undefined
        }
      };
    });
  }, []);

  // ステップの変更
  const changeStep = useCallback((step: number) => {
    setFormState(prev => ({
      ...prev,
      currentStep: step
    }));
  }, []);

  // 次のステップへ
  const nextStep = useCallback(() => {
    setFormState(prev => {
      const nextStep = Math.min(prev.currentStep + 1, FORM_STEPS.IMAGES);
      return {
        ...prev,
        currentStep: nextStep
      };
    });
  }, []);

  // 前のステップへ
  const previousStep = useCallback(() => {
    setFormState(prev => {
      const prevStep = Math.max(prev.currentStep - 1, FORM_STEPS.BASIC_INFO);
      return {
        ...prev,
        currentStep: prevStep
      };
    });
  }, []);

  // 現在のステップの検証
  const validateCurrentStep = useCallback(() => {
    const { data, currentStep } = formState;
    let validationResult = { isValid: true, errors: {} };

    switch (currentStep) {
      case FORM_STEPS.BASIC_INFO:
        validationResult = validateVenueBasicInfo(data.basicInfo);
        break;
      case FORM_STEPS.EQUIPMENT:
        validationResult = validateEquipmentData(data.equipment);
        break;
      case FORM_STEPS.AVAILABILITY:
        validationResult = validateVenueAvailability(data.availability);
        break;
      case FORM_STEPS.IMAGES:
        // 画像は必須ではないのでバリデーションなし
        validationResult = { isValid: true, errors: {} };
        break;
    }

    if (!validationResult.isValid) {
      setFormState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          ...validationResult.errors
        }
      }));
    }

    return validationResult.isValid;
  }, [formState]);

  // フォーム全体の検証
  const validateForm = useCallback(() => {
    const { data } = formState;
    const result = validateVenueFormData(data);

    setFormState(prev => ({
      ...prev,
      errors: result.isValid ? {} : result.errors
    }));

    return result.isValid;
  }, [formState]);

  // フォームの保存
  const saveForm = useCallback(async (): Promise<number> => {
    if (!validateForm()) {
      toast({
        title: '入力エラー',
        description: 'フォームに不正な入力があります。確認してください。',
        variant: 'destructive'
      });
      throw new Error('バリデーションエラー');
    }

    setFormState(prev => ({ ...prev, isSaving: true, errors: {} }));

    try {
      const { data } = formState;
      let savedVenueId: number;

      if (venueId) {
        // 更新
        await updateVenue(venueId, data);
        savedVenueId = venueId;
        toast({
          title: '保存完了',
          description: '会場情報を更新しました。'
        });
      } else {
        // 新規作成
        savedVenueId = await createVenue(data);
        toast({
          title: '保存完了',
          description: '新しい会場を登録しました。'
        });
      }

      setFormState(prev => ({
        ...prev,
        isSaving: false,
        isDirty: false
      }));

      if (onSaveComplete) {
        onSaveComplete(savedVenueId);
      }

      return savedVenueId;
    } catch (error) {
      const errorMessage = error instanceof VenueApiError 
        ? error.message 
        : '会場情報の保存に失敗しました';

      setFormState(prev => ({
        ...prev,
        isSaving: false,
        errors: { general: errorMessage }
      }));

      toast({
        title: 'エラー',
        description: errorMessage,
        variant: 'destructive'
      });

      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }

      throw error;
    }
  }, [formState, validateForm, venueId, toast, onSaveComplete, onError]);

  // フォームのリセット
  const resetForm = useCallback(() => {
    setFormState({
      data: createDefaultVenueFormData(),
      currentStep: FORM_STEPS.BASIC_INFO,
      isLoading: false,
      isSaving: false,
      errors: {},
      isDirty: false
    });
  }, []);

  // 特定のステップの完了状態を確認
  const isStepComplete = useCallback((step: number) => {
    const { data } = formState;
    
    switch (step) {
      case FORM_STEPS.BASIC_INFO:
        return validateVenueBasicInfo(data.basicInfo).isValid;
      case FORM_STEPS.EQUIPMENT:
        return validateEquipmentData(data.equipment).isValid;
      case FORM_STEPS.AVAILABILITY:
        return validateVenueAvailability(data.availability).isValid;
      case FORM_STEPS.IMAGES:
        return true; // 画像は必須ではない
      default:
        return false;
    }
  }, [formState]);

  // 現在のステップが有効かチェック
  const isCurrentStepValid = useCallback(() => {
    return isStepComplete(formState.currentStep);
  }, [formState.currentStep, isStepComplete]);

  // フォームの送信可能性をチェック
  const canSubmit = useCallback(() => {
    return Object.values(FORM_STEPS).every(step => isStepComplete(step)) && 
           !formState.isSaving && 
           !formState.isLoading;
  }, [isStepComplete, formState.isSaving, formState.isLoading]);

  return {
    // 状態
    formData: formState.data,
    currentStep: formState.currentStep,
    isLoading: formState.isLoading,
    isSaving: formState.isSaving,
    errors: formState.errors,
    isDirty: formState.isDirty,

    // アクション
    updateField,
    changeStep,
    nextStep,
    previousStep,
    validateCurrentStep,
    validateForm,
    saveForm,
    resetForm,
    loadVenue,

    // ヘルパー
    isStepComplete,
    isCurrentStepValid,
    canSubmit,

    // 定数
    FORM_STEPS
  };
};