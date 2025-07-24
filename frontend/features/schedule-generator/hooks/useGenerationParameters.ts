import { useState, useCallback, useMemo } from 'react'
import { GenerationParameters, DEFAULT_GENERATION_PARAMETERS } from '../types/generationParams'
import { saveTemplate, loadTemplate as loadTemplateApi } from '../api/generationParametersApi'

/**
 * ネストしたオブジェクトのプロパティを更新するヘルパー関数
 * @param obj 更新対象のオブジェクト
 * @param path ドット記法のパス (例: "dateRange.startDate")
 * @param value 新しい値
 * @returns 更新されたオブジェクト
 */
function updateNestedProperty(obj: any, path: string, value: any): any {
  const keys = path.split('.')
  const result = JSON.parse(JSON.stringify(obj)) // ディープコピー
  
  let current = result
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current)) {
      current[key] = {}
    }
    current = current[key]
  }
  
  current[keys[keys.length - 1]] = value
  return result
}

/**
 * 生成パラメータの状態管理を行うカスタムフック
 * @param initialParams 初期パラメータ
 * @returns パラメータの状態と操作関数
 */
export function useGenerationParameters(
  initialParams?: Partial<GenerationParameters>
) {
  // 初期値をマージして作成
  const mergedInitialParams = useMemo(() => ({
    ...DEFAULT_GENERATION_PARAMETERS,
    ...initialParams,
  } as GenerationParameters), [initialParams])

  const [parameters, setParametersState] = useState<GenerationParameters>(mergedInitialParams)
  const [isModified, setIsModified] = useState(false)

  /**
   * パラメータ全体を設定する
   */
  const setParameters = useCallback((newParameters: GenerationParameters) => {
    setParametersState(newParameters)
    setIsModified(true)
  }, [])

  /**
   * ネストしたパラメータを部分更新する
   * @param path ドット記法のパス
   * @param value 新しい値
   */
  const updateParameter = useCallback((path: string, value: any) => {
    setParametersState(prev => updateNestedProperty(prev, path, value))
    setIsModified(true)
  }, [])

  /**
   * パラメータを初期値にリセットする
   */
  const resetParameters = useCallback(() => {
    setParametersState(mergedInitialParams)
    setIsModified(false)
  }, [mergedInitialParams])

  /**
   * 現在のパラメータをテンプレートとして保存する
   * @param name テンプレート名
   * @returns 保存されたテンプレートのID
   */
  const saveAsTemplate = useCallback(async (name: string): Promise<string> => {
    try {
      const templateId = await saveTemplate(name, parameters)
      return templateId
    } catch (error) {
      console.error('Failed to save template:', error)
      throw error
    }
  }, [parameters])

  /**
   * テンプレートを読み込んでパラメータに適用する
   * @param templateId テンプレートID
   */
  const loadTemplate = useCallback(async (templateId: string): Promise<void> => {
    try {
      const templateParameters = await loadTemplateApi(templateId)
      const mergedParameters = {
        ...parameters,
        ...templateParameters,
      } as GenerationParameters
      
      setParametersState(mergedParameters)
      setIsModified(false) // テンプレート読み込み後は未変更状態
    } catch (error) {
      console.error('Failed to load template:', error)
      throw error
    }
  }, [parameters])

  return {
    parameters,
    setParameters,
    updateParameter,
    resetParameters,
    saveAsTemplate,
    loadTemplate,
    isModified,
  }
}