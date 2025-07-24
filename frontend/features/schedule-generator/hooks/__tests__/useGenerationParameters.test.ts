import { renderHook, act } from '@testing-library/react'
import { useGenerationParameters } from '../useGenerationParameters'
import { DEFAULT_GENERATION_PARAMETERS, GenerationParameters } from '../../types/generationParams'

// APIのモック
jest.mock('../../api/generationParametersApi', () => ({
  saveTemplate: jest.fn(),
  loadTemplate: jest.fn(),
}))

describe('useGenerationParameters', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('初期化', () => {
    it('デフォルトパラメータで初期化される', () => {
      const { result } = renderHook(() => useGenerationParameters())
      
      expect(result.current.parameters).toEqual(
        expect.objectContaining(DEFAULT_GENERATION_PARAMETERS)
      )
      expect(result.current.isModified).toBe(false)
    })

    it('初期パラメータが指定された場合、それがマージされる', () => {
      const initialParams = {
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
      }

      const { result } = renderHook(() => 
        useGenerationParameters(initialParams)
      )
      
      expect(result.current.parameters.dateRange).toEqual(initialParams.dateRange)
      expect(result.current.isModified).toBe(false)
    })
  })

  describe('パラメータ更新', () => {
    it('setParametersでパラメータ全体を更新できる', () => {
      const { result } = renderHook(() => useGenerationParameters())
      
      const newParameters: Partial<GenerationParameters> = {
        dateRange: {
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-29'),
        },
      }

      act(() => {
        result.current.setParameters(newParameters as GenerationParameters)
      })

      expect(result.current.parameters.dateRange).toEqual(newParameters.dateRange)
      expect(result.current.isModified).toBe(true)
    })

    it('updateParameterでネストしたパラメータを更新できる', () => {
      const { result } = renderHook(() => useGenerationParameters())
      
      const newStartDate = new Date('2024-03-01')

      act(() => {
        result.current.updateParameter('dateRange.startDate', newStartDate)
      })

      expect(result.current.parameters.dateRange.startDate).toEqual(newStartDate)
      expect(result.current.isModified).toBe(true)
    })

    it('updateParameterで配列の要素を更新できる', () => {
      const { result } = renderHook(() => useGenerationParameters())
      
      const excludedDate = new Date('2024-04-01')

      act(() => {
        result.current.updateParameter('excludedDates', [excludedDate])
      })

      expect(result.current.parameters.excludedDates).toEqual([excludedDate])
      expect(result.current.isModified).toBe(true)
    })

    it('深くネストしたプロパティを更新できる', () => {
      const { result } = renderHook(() => useGenerationParameters())

      act(() => {
        result.current.updateParameter('options.allowConflicts', true)
      })

      expect(result.current.parameters.options?.allowConflicts).toBe(true)
      expect(result.current.isModified).toBe(true)
    })
  })

  describe('パラメータリセット', () => {
    it('resetParametersでデフォルト値に戻る', () => {
      const { result } = renderHook(() => useGenerationParameters())
      
      // パラメータを変更
      act(() => {
        result.current.updateParameter('dateRange.startDate', new Date('2024-05-01'))
      })

      expect(result.current.isModified).toBe(true)

      // リセット
      act(() => {
        result.current.resetParameters()
      })

      expect(result.current.parameters).toEqual(
        expect.objectContaining(DEFAULT_GENERATION_PARAMETERS)
      )
      expect(result.current.isModified).toBe(false)
    })

    it('初期パラメータが指定されている場合、リセット時にそれに戻る', () => {
      const initialParams = {
        dateRange: {
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-06-30'),
        },
      }

      const { result } = renderHook(() => 
        useGenerationParameters(initialParams)
      )
      
      // パラメータを変更
      act(() => {
        result.current.updateParameter('dateRange.startDate', new Date('2024-07-01'))
      })

      // リセット
      act(() => {
        result.current.resetParameters()
      })

      expect(result.current.parameters.dateRange).toEqual(initialParams.dateRange)
      expect(result.current.isModified).toBe(false)
    })
  })

  describe('テンプレート機能', () => {
    it('saveAsTemplateでテンプレートを保存できる', async () => {
      const mockSaveTemplate = require('../../api/generationParametersApi').saveTemplate
      mockSaveTemplate.mockResolvedValue('template-id-123')

      const { result } = renderHook(() => useGenerationParameters())
      
      let templateId: string = ''
      await act(async () => {
        templateId = await result.current.saveAsTemplate('テストテンプレート')
      })

      expect(mockSaveTemplate).toHaveBeenCalledWith('テストテンプレート', result.current.parameters)
      expect(templateId).toBe('template-id-123')
    })

    it('loadTemplateでテンプレートを読み込める', async () => {
      const mockLoadTemplate = require('../../api/generationParametersApi').loadTemplate
      const templateData = {
        dateRange: {
          startDate: new Date('2024-08-01'),
          endDate: new Date('2024-08-31'),
        },
      }
      mockLoadTemplate.mockResolvedValue(templateData)

      const { result } = renderHook(() => useGenerationParameters())
      
      await act(async () => {
        await result.current.loadTemplate('template-id-123')
      })

      expect(mockLoadTemplate).toHaveBeenCalledWith('template-id-123')
      expect(result.current.parameters.dateRange).toEqual(templateData.dateRange)
      expect(result.current.isModified).toBe(false) // テンプレート読み込み後は未変更状態
    })

    it('saveAsTemplateでエラーが発生した場合、例外が投げられる', async () => {
      const mockSaveTemplate = require('../../api/generationParametersApi').saveTemplate
      mockSaveTemplate.mockRejectedValue(new Error('保存に失敗しました'))

      const { result } = renderHook(() => useGenerationParameters())
      
      await expect(async () => {
        await act(async () => {
          await result.current.saveAsTemplate('テストテンプレート')
        })
      }).rejects.toThrow('保存に失敗しました')
    })

    it('loadTemplateでエラーが発生した場合、例外が投げられる', async () => {
      const mockLoadTemplate = require('../../api/generationParametersApi').loadTemplate
      mockLoadTemplate.mockRejectedValue(new Error('読み込みに失敗しました'))

      const { result } = renderHook(() => useGenerationParameters())
      
      await expect(async () => {
        await act(async () => {
          await result.current.loadTemplate('invalid-id')
        })
      }).rejects.toThrow('読み込みに失敗しました')
    })
  })

  describe('変更状態の追跡', () => {
    it('パラメータ変更時にisModifiedがtrueになる', () => {
      const { result } = renderHook(() => useGenerationParameters())
      
      expect(result.current.isModified).toBe(false)

      act(() => {
        result.current.updateParameter('dateRange.startDate', new Date('2024-09-01'))
      })

      expect(result.current.isModified).toBe(true)
    })

    it('同じ値に変更してもisModifiedがtrueになる', () => {
      const { result } = renderHook(() => useGenerationParameters())
      
      const currentStartDate = result.current.parameters.dateRange.startDate

      act(() => {
        result.current.updateParameter('dateRange.startDate', currentStartDate)
      })

      expect(result.current.isModified).toBe(true)
    })

    it('リセット後はisModifiedがfalseになる', () => {
      const { result } = renderHook(() => useGenerationParameters())
      
      act(() => {
        result.current.updateParameter('dateRange.startDate', new Date('2024-10-01'))
      })

      expect(result.current.isModified).toBe(true)

      act(() => {
        result.current.resetParameters()
      })

      expect(result.current.isModified).toBe(false)
    })
  })
})