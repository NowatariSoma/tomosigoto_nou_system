import { useState, useCallback, ChangeEvent, FocusEvent, FormEvent } from 'react'

// バリデーション関数の型
type ValidationFunction<T> = (value: any, allValues: T) => string | undefined

// バリデーションスキーマの型
export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationFunction<T> | ValidationFunction<T>[]
}

// フォームヘルパーの型
export interface FormHelpers<T> {
  setSubmitting: (isSubmitting: boolean) => void
  resetForm: () => void
  setErrors: (errors: Partial<Record<keyof T, string>>) => void
  setFieldValue: (name: keyof T, value: any) => void
  setFieldError: (name: keyof T, error: string | undefined) => void
}

// フォーム設定の型
export interface FormConfig<T> {
  initialValues: T
  validationSchema?: ValidationSchema<T>
  onSubmit?: (values: T, helpers: FormHelpers<T>) => void | Promise<void>
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

// フォームフックの戻り値型
export interface FormReturn<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  isValid: boolean
  handleChange: (e: ChangeEvent<any>) => void
  handleBlur: (e: FocusEvent<any>) => void
  handleSubmit: (e: FormEvent) => void
  setFieldValue: (name: keyof T, value: any) => void
  setFieldError: (name: keyof T, error: string | undefined) => void
  resetForm: () => void
  validateForm: () => Promise<boolean>
  validateField: (name: keyof T) => string | undefined
}

// バリデーション実行
function runValidation<T>(
  validationFn: ValidationFunction<T> | ValidationFunction<T>[],
  value: any,
  allValues: T
): string | undefined {
  if (Array.isArray(validationFn)) {
    for (const fn of validationFn) {
      const error = fn(value, allValues)
      if (error) return error
    }
    return undefined
  }
  return validationFn(value, allValues)
}

// メインのフォームフック
export function useForm<T extends Record<string, any>>(
  config: FormConfig<T>
): FormReturn<T> {
  const {
    initialValues,
    validationSchema,
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true,
  } = config

  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // フィールドのバリデーション
  const validateField = useCallback(
    (name: keyof T): string | undefined => {
      if (!validationSchema || !validationSchema[name]) {
        return undefined
      }

      const fieldValue = values[name]
      const validationFn = validationSchema[name]
      
      if (validationFn) {
        return runValidation(validationFn, fieldValue, values)
      }
      
      return undefined
    },
    [validationSchema, values]
  )

  // フォーム全体のバリデーション
  const validateForm = useCallback(async (): Promise<boolean> => {
    if (!validationSchema) return true

    const newErrors: Partial<Record<keyof T, string>> = {}
    let hasErrors = false

    for (const fieldName in validationSchema) {
      const error = validateField(fieldName as keyof T)
      if (error) {
        newErrors[fieldName as keyof T] = error
        hasErrors = true
      }
    }

    setErrors(newErrors)
    return !hasErrors
  }, [validationSchema, validateField])

  // フィールド値の設定
  const setFieldValue = useCallback(
    (name: keyof T, value: any) => {
      setValues(prev => ({ ...prev, [name]: value }))

      // バリデーションが有効な場合は実行
      if (validateOnChange && touched[name]) {
        const error = validateField(name)
        setErrors(prev => ({ ...prev, [name]: error }))
      }
    },
    [validateOnChange, touched, validateField]
  )

  // フィールドエラーの設定
  const setFieldError = useCallback(
    (name: keyof T, error: string | undefined) => {
      setErrors(prev => ({ ...prev, [name]: error }))
    },
    []
  )

  // 入力変更ハンドラー
  const handleChange = useCallback(
    (e: ChangeEvent<any>) => {
      const { name, value, type, checked } = e.target
      const fieldValue = type === 'checkbox' ? checked : value

      setFieldValue(name as keyof T, fieldValue)
    },
    [setFieldValue]
  )

  // フォーカス離脱ハンドラー
  const handleBlur = useCallback(
    (e: FocusEvent<any>) => {
      const { name } = e.target
      const fieldName = name as keyof T

      // タッチ状態を更新
      setTouched(prev => ({ ...prev, [fieldName]: true }))

      // バリデーションが有効な場合は実行
      if (validateOnBlur) {
        const error = validateField(fieldName)
        setErrors(prev => ({ ...prev, [fieldName]: error }))
      }
    },
    [validateOnBlur, validateField]
  )

  // フォーム送信ハンドラー
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()

      // 全フィールドをタッチ状態にする
      const allTouched: Partial<Record<keyof T, boolean>> = {}
      for (const key in values) {
        allTouched[key as keyof T] = true
      }
      setTouched(allTouched)

      // バリデーション実行
      const isValid = await validateForm()
      if (!isValid) return

      if (onSubmit) {
        setIsSubmitting(true)
        
        const helpers: FormHelpers<T> = {
          setSubmitting: setIsSubmitting,
          resetForm,
          setErrors,
          setFieldValue,
          setFieldError,
        }

        try {
          await onSubmit(values, helpers)
        } catch (error) {
          console.error('Form submission error:', error)
        } finally {
          setIsSubmitting(false)
        }
      }
    },
    [values, validateForm, onSubmit, setFieldValue, setFieldError]
  )

  // フォームリセット
  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  // フォームの有効性チェック
  const isValid = Object.keys(errors).length === 0

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    validateForm,
    validateField,
  }
}

// 共通バリデーター関数
export const validators = {
  required: (message = 'この項目は必須です') => (value: any) => {
    if (value === undefined || value === null || value === '') {
      return message
    }
    return undefined
  },

  email: (message = '有効なメールアドレスを入力してください') => (value: string) => {
    if (!value) return undefined
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? undefined : message
  },

  minLength: (min: number, message?: string) => (value: string) => {
    if (!value) return undefined
    return value.length >= min 
      ? undefined 
      : message || `${min}文字以上で入力してください`
  },

  maxLength: (max: number, message?: string) => (value: string) => {
    if (!value) return undefined
    return value.length <= max 
      ? undefined 
      : message || `${max}文字以内で入力してください`
  },

  pattern: (regex: RegExp, message = '正しい形式で入力してください') => (value: string) => {
    if (!value) return undefined
    return regex.test(value) ? undefined : message
  },

  number: (message = '数値を入力してください') => (value: any) => {
    if (value === undefined || value === null || value === '') return undefined
    return !isNaN(Number(value)) ? undefined : message
  },

  min: (min: number, message?: string) => (value: any) => {
    if (value === undefined || value === null || value === '') return undefined
    const num = Number(value)
    return num >= min 
      ? undefined 
      : message || `${min}以上の値を入力してください`
  },

  max: (max: number, message?: string) => (value: any) => {
    if (value === undefined || value === null || value === '') return undefined
    const num = Number(value)
    return num <= max 
      ? undefined 
      : message || `${max}以下の値を入力してください`
  },
}