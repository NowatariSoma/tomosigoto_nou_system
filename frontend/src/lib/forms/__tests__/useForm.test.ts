import { renderHook, act } from '@testing-library/react'
import { useForm, validators, ValidationSchema, FormConfig } from '../useForm'

// テスト用の型定義
interface TestFormData {
  name: string
  email: string
  age: number
  agreed: boolean
}

describe('useForm', () => {
  const initialValues: TestFormData = {
    name: '',
    email: '',
    age: 0,
    agreed: false,
  }

  describe('初期化', () => {
    it('初期値で正しく初期化されるべき', () => {
      const { result } = renderHook(() =>
        useForm({ initialValues })
      )

      expect(result.current.values).toEqual(initialValues)
      expect(result.current.errors).toEqual({})
      expect(result.current.touched).toEqual({})
      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.isValid).toBe(true)
    })
  })

  describe('バリデーション', () => {
    const validationSchema: ValidationSchema<TestFormData> = {
      name: validators.required('名前は必須です'),
      email: [validators.required('メールは必須です'), validators.email()],
      age: [validators.required('年齢は必須です'), validators.min(0, '0以上を入力してください')],
    }

    it('フィールドバリデーションが正しく動作するべき', () => {
      const { result } = renderHook(() =>
        useForm({ initialValues, validationSchema })
      )

      // 名前フィールドのバリデーション
      const nameError = result.current.validateField('name')
      expect(nameError).toBe('名前は必須です')

      // メールフィールドのバリデーション
      const emailError = result.current.validateField('email')
      expect(emailError).toBe('メールは必須です')
    })

    it('複数のバリデーターが正しく動作するべき', () => {
      const { result } = renderHook(() =>
        useForm({ 
          initialValues: { ...initialValues, email: 'invalid-email' }, 
          validationSchema 
        })
      )

      const emailError = result.current.validateField('email')
      expect(emailError).toBe('有効なメールアドレスを入力してください')
    })

    it('フォーム全体のバリデーションが正しく動作するべき', async () => {
      const { result } = renderHook(() =>
        useForm({ initialValues, validationSchema })
      )

      await act(async () => {
        const isValid = await result.current.validateForm()
        expect(isValid).toBe(false)
      })

      expect(result.current.errors.name).toBe('名前は必須です')
      expect(result.current.errors.email).toBe('メールは必須です')
      expect(result.current.errors.age).toBe('年齢は必須です')
    })

    it('有効な値でのバリデーションが成功するべき', async () => {
      const validValues = {
        name: '田中太郎',
        email: 'tanaka@example.com',
        age: 25,
        agreed: true,
      }

      const { result } = renderHook(() =>
        useForm({ 
          initialValues: validValues, 
          validationSchema 
        })
      )

      await act(async () => {
        const isValid = await result.current.validateForm()
        expect(isValid).toBe(true)
      })

      expect(Object.keys(result.current.errors)).toHaveLength(0)
    })
  })

  describe('フィールド操作', () => {
    it('setFieldValue: フィールド値を設定できるべき', () => {
      const { result } = renderHook(() =>
        useForm({ initialValues })
      )

      act(() => {
        result.current.setFieldValue('name', '田中太郎')
      })

      expect(result.current.values.name).toBe('田中太郎')
    })

    it('setFieldError: フィールドエラーを設定できるべき', () => {
      const { result } = renderHook(() =>
        useForm({ initialValues })
      )

      act(() => {
        result.current.setFieldError('name', 'カスタムエラー')
      })

      expect(result.current.errors.name).toBe('カスタムエラー')
    })

    it('handleChange: テキスト入力の変更を処理できるべき', () => {
      const { result } = renderHook(() =>
        useForm({ initialValues })
      )

      act(() => {
        result.current.handleChange{
          target: { name: 'name', value: '田中太郎', type: 'text' }
        } as any)
      })

      expect(result.current.values.name).toBe('田中太郎')
    })

    it('handleChange: チェックボックスの変更を処理できるべき', () => {
      const { result } = renderHook(() =>
        useForm({ initialValues })
      )

      act(() => {
        result.current.handleChange({
          target: { name: 'agreed', checked: true, type: 'checkbox' }
        } as any)
      })

      expect(result.current.values.agreed).toBe(true)
    })

    it('handleBlur: フィールドがタッチされた状態になるべき', () => {
      const validationSchema: ValidationSchema<TestFormData> = {
        name: validators.required('名前は必須です'),
      }

      const { result } = renderHook(() =>
        useForm({ initialValues, validationSchema, validateOnBlur: true })
      )

      act(() => {
        result.current.handleBlur({
          target: { name: 'name' }
        } as any)
      })

      expect(result.current.touched.name).toBe(true)
      expect(result.current.errors.name).toBe('名前は必須です')
    })

    it('validateOnChange: 値変更時のバリデーションを制御できるべき', () => {
      const validationSchema: ValidationSchema<TestFormData> = {
        name: validators.required('名前は必須です'),
      }

      const { result } = renderHook(() =>
        useForm({ 
          initialValues, 
          validationSchema, 
          validateOnChange: false 
        })
      )

      // フィールドをタッチ状態にする
      act(() => {
        result.current.handleBlur({
          target: { name: 'name' }
        } as any)
      })

      // 値を変更
      act(() => {
        result.current.setFieldValue('name', '')
      })

      // validateOnChange: falseなので、エラーは設定されない
      expect(result.current.errors.name).toBeUndefined()
    })
  })

  describe('フォーム送信', () => {
    it('バリデーションエラーがある場合送信されないべき', async () => {
      const onSubmit = jest.fn()
      const validationSchema: ValidationSchema<TestFormData> = {
        name: validators.required('名前は必須です'),
      }

      const { result } = renderHook(() =>
        useForm({ 
          initialValues, 
          validationSchema, 
          onSubmit 
        })
      )

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn()
        } as any)
      })

      expect(onSubmit).not.toHaveBeenCalled()
      expect(result.current.errors.name).toBe('名前は必須です')
      expect(result.current.touched.name).toBe(true)
    })

    it('バリデーション成功時に送信されるべき', async () => {
      const onSubmit = jest.fn()
      const validValues = {
        name: '田中太郎',
        email: 'tanaka@example.com',
        age: 25,
        agreed: true,
      }

      const { result } = renderHook(() =>
        useForm({ 
          initialValues: validValues, 
          onSubmit 
        })
      )

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn()
        } as any)
      })

      expect(onSubmit).toHaveBeenCalledWith(validValues, expect.any(Object))
    })

    it('送信中はisSubmittingがtrueになるべき', async () => {
      const onSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      const { result } = renderHook(() =>
        useForm({ 
          initialValues: {
            name: '田中太郎',
            email: 'tanaka@example.com',
            age: 25,
            agreed: true,
          }, 
          onSubmit 
        })
      )

      let submitPromise: Promise<void>
      
      await act(async () => {
        submitPromise = result.current.handleSubmit({
          preventDefault: jest.fn()
        } as any)
        
        expect(result.current.isSubmitting).toBe(true)
        await submitPromise
      })

      expect(result.current.isSubmitting).toBe(false)
    })

    it('送信エラーが適切に処理されるべき', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const onSubmit = jest.fn().mockRejectedValue(new Error('送信エラー'))
      
      const { result } = renderHook(() =>
        useForm({ 
          initialValues: {
            name: '田中太郎',
            email: 'tanaka@example.com',
            age: 25,
            agreed: true,
          }, 
          onSubmit 
        })
      )

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn()
        } as any)
      })

      expect(consoleSpy).toHaveBeenCalledWith('Form submission error:', expect.any(Error))
      expect(result.current.isSubmitting).toBe(false)
      
      consoleSpy.mockRestore()
    })

    it('送信ヘルパーが正しく動作するべき', async () => {
      let capturedHelpers: any

      const onSubmit = jest.fn((values, helpers) => {
        capturedHelpers = helpers
        helpers.setFieldError('name', 'サーバーエラー')
      })

      const { result } = renderHook(() =>
        useForm({ 
          initialValues: {
            name: '田中太郎',
            email: 'tanaka@example.com',
            age: 25,
            agreed: true,
          }, 
          onSubmit 
        })
      )

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn()
        } as any)
      })

      expect(capturedHelpers).toHaveProperty('setSubmitting')
      expect(capturedHelpers).toHaveProperty('resetForm')
      expect(capturedHelpers).toHaveProperty('setErrors')
      expect(capturedHelpers).toHaveProperty('setFieldValue')
      expect(capturedHelpers).toHaveProperty('setFieldError')
      
      expect(result.current.errors.name).toBe('サーバーエラー')
    })
  })

  describe('フォームリセット', () => {
    it('フォームを初期値にリセットできるべき', () => {
      const { result } = renderHook(() =>
        useForm({ initialValues })
      )

      // 値を変更
      act(() => {
        result.current.setFieldValue('name', '田中太郎')
        result.current.setFieldError('email', 'エラー')
        result.current.handleBlur({ target: { name: 'name' } } as any)
      })

      // リセット実行
      act(() => {
        result.current.resetForm()
      })

      expect(result.current.values).toEqual(initialValues)
      expect(result.current.errors).toEqual({})
      expect(result.current.touched).toEqual({})
      expect(result.current.isSubmitting).toBe(false)
    })
  })

  describe('isValid 計算', () => {
    it('エラーがない場合trueを返すべき', () => {
      const { result } = renderHook(() =>
        useForm({ initialValues })
      )

      expect(result.current.isValid).toBe(true)
    })

    it('エラーがある場合falseを返すべき', () => {
      const { result } = renderHook(() =>
        useForm({ initialValues })
      )

      act(() => {
        result.current.setFieldError('name', 'エラー')
      })

      expect(result.current.isValid).toBe(false)
    })
  })
})

describe('validators', () => {
  describe('required', () => {
    it('値がない場合エラーを返すべき', () => {
      const validator = validators.required('必須です')
      
      expect(validator('')).toBe('必須です')
      expect(validator(null)).toBe('必須です')
      expect(validator(undefined)).toBe('必須です')
    })

    it('値がある場合undefinedを返すべき', () => {
      const validator = validators.required('必須です')
      
      expect(validator('value')).toBeUndefined()
      expect(validator(0)).toBeUndefined()
      expect(validator(false)).toBeUndefined()
    })
  })

  describe('email', () => {
    it('有効なメールアドレスの場合undefinedを返すべき', () => {
      const validator = validators.email()
      
      expect(validator('test@example.com')).toBeUndefined()
      expect(validator('user.name+tag@domain.co.jp')).toBeUndefined()
    })

    it('無効なメールアドレスの場合エラーを返すべき', () => {
      const validator = validators.email()
      
      expect(validator('invalid-email')).toBe('有効なメールアドレスを入力してください')
      expect(validator('test@')).toBe('有効なメールアドレスを入力してください')
      expect(validator('@example.com')).toBe('有効なメールアドレスを入力してください')
    })

    it('空の値の場合undefinedを返すべき', () => {
      const validator = validators.email()
      
      expect(validator('')).toBeUndefined()
    })
  })

  describe('minLength', () => {
    it('最小長を満たす場合undefinedを返すべき', () => {
      const validator = validators.minLength(5)
      
      expect(validator('12345')).toBeUndefined()
      expect(validator('123456')).toBeUndefined()
    })

    it('最小長を満たさない場合エラーを返すべき', () => {
      const validator = validators.minLength(5)
      
      expect(validator('1234')).toBe('5文字以上で入力してください')
    })

    it('空の値の場合undefinedを返すべき', () => {
      const validator = validators.minLength(5)
      
      expect(validator('')).toBeUndefined()
    })
  })

  describe('maxLength', () => {
    it('最大長を超えない場合undefinedを返すべき', () => {
      const validator = validators.maxLength(10)
      
      expect(validator('12345')).toBeUndefined()
      expect(validator('1234567890')).toBeUndefined()
    })

    it('最大長を超える場合エラーを返すべき', () => {
      const validator = validators.maxLength(10)
      
      expect(validator('12345678901')).toBe('10文字以内で入力してください')
    })
  })

  describe('pattern', () => {
    it('パターンにマッチする場合undefinedを返すべき', () => {
      const validator = validators.pattern(/^\d+$/, '数字のみ入力してください')
      
      expect(validator('123')).toBeUndefined()
      expect(validator('0')).toBeUndefined()
    })

    it('パターンにマッチしない場合エラーを返すべき', () => {
      const validator = validators.pattern(/^\d+$/, '数字のみ入力してください')
      
      expect(validator('abc')).toBe('数字のみ入力してください')
      expect(validator('12a')).toBe('数字のみ入力してください')
    })
  })

  describe('number', () => {
    it('数値の場合undefinedを返すべき', () => {
      const validator = validators.number()
      
      expect(validator('123')).toBeUndefined()
      expect(validator('123.45')).toBeUndefined()
      expect(validator(123)).toBeUndefined()
    })

    it('数値でない場合エラーを返すべき', () => {
      const validator = validators.number()
      
      expect(validator('abc')).toBe('数値を入力してください')
      expect(validator('12a')).toBe('数値を入力してください')
    })

    it('空の値の場合undefinedを返すべき', () => {
      const validator = validators.number()
      
      expect(validator('')).toBeUndefined()
      expect(validator(null)).toBeUndefined()
      expect(validator(undefined)).toBeUndefined()
    })
  })

  describe('min', () => {
    it('最小値を満たす場合undefinedを返すべき', () => {
      const validator = validators.min(0)
      
      expect(validator('0')).toBeUndefined()
      expect(validator('10')).toBeUndefined()
      expect(validator(5)).toBeUndefined()
    })

    it('最小値を満たさない場合エラーを返すべき', () => {
      const validator = validators.min(0)
      
      expect(validator('-1')).toBe('0以上の値を入力してください')
      expect(validator(-5)).toBe('0以上の値を入力してください')
    })
  })

  describe('max', () => {
    it('最大値を超えない場合undefinedを返すべき', () => {
      const validator = validators.max(100)
      
      expect(validator('50')).toBeUndefined()
      expect(validator('100')).toBeUndefined()
      expect(validator(75)).toBeUndefined()
    })

    it('最大値を超える場合エラーを返すべき', () => {
      const validator = validators.max(100)
      
      expect(validator('101')).toBe('100以下の値を入力してください')
      expect(validator(150)).toBe('100以下の値を入力してください')
    })
  })
})