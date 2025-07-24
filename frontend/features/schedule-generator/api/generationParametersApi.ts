import { GenerationParameters, ConditionTemplate } from '../types/generationParams'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * テンプレートを保存する
 * @param name テンプレート名
 * @param parameters 保存するパラメータ
 * @returns 保存されたテンプレートのID
 */
export async function saveTemplate(
  name: string,
  parameters: GenerationParameters
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generation-templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description: '',
        parameters,
      }),
    })

    if (!response.ok) {
      throw new Error(`テンプレートの保存に失敗しました: ${response.status}`)
    }

    const result = await response.json()
    return result.id
  } catch (error) {
    console.error('Template save error:', error)
    throw error
  }
}

/**
 * テンプレートを読み込む
 * @param templateId テンプレートID
 * @returns テンプレートのパラメータ
 */
export async function loadTemplate(templateId: string): Promise<Partial<GenerationParameters>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generation-templates/${templateId}`)

    if (!response.ok) {
      throw new Error(`テンプレートの読み込みに失敗しました: ${response.status}`)
    }

    const template: ConditionTemplate = await response.json()
    return template.parameters as Partial<GenerationParameters>
  } catch (error) {
    console.error('Template load error:', error)
    throw error
  }
}

/**
 * テンプレート一覧を取得する
 * @returns テンプレート一覧
 */
export async function getTemplates(): Promise<ConditionTemplate[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generation-templates`)

    if (!response.ok) {
      throw new Error(`テンプレート一覧の取得に失敗しました: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Templates fetch error:', error)
    throw error
  }
}

/**
 * テンプレートを削除する
 * @param templateId テンプレートID
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generation-templates/${templateId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`テンプレートの削除に失敗しました: ${response.status}`)
    }
  } catch (error) {
    console.error('Template delete error:', error)
    throw error
  }
}

/**
 * パラメータの事前検証を行う
 * @param parameters 検証するパラメータ
 * @returns 検証結果
 */
export async function validateParameters(parameters: GenerationParameters) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generation-validation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parameters),
    })

    if (!response.ok) {
      throw new Error(`パラメータ検証に失敗しました: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Parameter validation error:', error)
    throw error
  }
}