import { useState, useEffect, useCallback } from 'react'

// ローカルストレージの値の型
type SetValue<T> = T | ((val: T) => T)

// ローカルストレージフック
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: SetValue<T>) => void, () => void] {
  // 初期値を計算する関数
  const getInitialValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      // SSR環境では初期値を返す
      return typeof initialValue === 'function' 
        ? (initialValue as () => T)() 
        : initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      if (item === null) {
        return typeof initialValue === 'function' 
          ? (initialValue as () => T)() 
          : initialValue
      }
      return JSON.parse(item)
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return typeof initialValue === 'function' 
        ? (initialValue as () => T)() 
        : initialValue
    }
  }, [key, initialValue])

  // 状態の初期化
  const [storedValue, setStoredValue] = useState<T>(getInitialValue)

  // ローカルストレージから値を読み込む
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return typeof initialValue === 'function' 
        ? (initialValue as () => T)() 
        : initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      if (item === null) {
        return typeof initialValue === 'function' 
          ? (initialValue as () => T)() 
          : initialValue
      }
      return JSON.parse(item)
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return typeof initialValue === 'function' 
        ? (initialValue as () => T)() 
        : initialValue
    }
  }, [key, initialValue])

  // 値を設定する関数
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        // 関数の場合は現在の値を引数として呼び出し
        const valueToStore = value instanceof Function ? value(storedValue) : value
        
        // 状態を更新
        setStoredValue(valueToStore)
        
        // ローカルストレージに保存
        if (typeof window !== 'undefined') {
          if (valueToStore === undefined || valueToStore === null) {
            window.localStorage.removeItem(key)
          } else {
            window.localStorage.setItem(key, JSON.stringify(valueToStore))
          }
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  // 値を削除する関数
  const removeValue = useCallback(() => {
    try {
      setStoredValue(
        typeof initialValue === 'function' 
          ? (initialValue as () => T)() 
          : initialValue
      )
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  // コンポーネントマウント時に値を同期
  useEffect(() => {
    setStoredValue(readValue())
  }, [readValue])

  // ストレージイベントを監視して他のタブでの変更を検知
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.warn(`Error parsing localStorage key "${key}" from storage event:`, error)
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(
          typeof initialValue === 'function' 
            ? (initialValue as () => T)() 
            : initialValue
        )
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

// 特定のキーをクリアする関数
export function clearLocalStorageItem(key: string): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key)
    }
  } catch (error) {
    console.warn(`Error clearing localStorage key "${key}":`, error)
  }
}

// プレフィックスを持つすべてのキーをクリアする関数
export function clearLocalStorage(prefix?: string): void {
  try {
    if (typeof window === 'undefined') return

    if (prefix) {
      // 特定のプレフィックスを持つキーのみをクリア
      const keysToRemove: string[] = []
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => window.localStorage.removeItem(key))
    } else {
      // 全てのローカルストレージをクリア
      window.localStorage.clear()
    }
  } catch (error) {
    console.warn('Error clearing localStorage:', error)
  }
}

// ローカルストレージのサイズを取得する関数
export function getLocalStorageSize(): number {
  if (typeof window === 'undefined') return 0

  try {
    let total = 0
    for (let key in window.localStorage) {
      if (window.localStorage.hasOwnProperty(key)) {
        total += window.localStorage[key].length + key.length
      }
    }
    return total
  } catch (error) {
    console.warn('Error calculating localStorage size:', error)
    return 0
  }
}

// ローカルストレージが利用可能かチェックする関数
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const testKey = '__localStorage_test__'
    window.localStorage.setItem(testKey, 'test')
    window.localStorage.removeItem(testKey)
    return true
  } catch (error) {
    return false
  }
}

// セッションストレージ版のフック
export function useSessionStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: SetValue<T>) => void, () => void] {
  const getInitialValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return typeof initialValue === 'function' 
        ? (initialValue as () => T)() 
        : initialValue
    }

    try {
      const item = window.sessionStorage.getItem(key)
      if (item === null) {
        return typeof initialValue === 'function' 
          ? (initialValue as () => T)() 
          : initialValue
      }
      return JSON.parse(item)
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error)
      return typeof initialValue === 'function' 
        ? (initialValue as () => T)() 
        : initialValue
    }
  }, [key, initialValue])

  const [storedValue, setStoredValue] = useState<T>(getInitialValue)

  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        
        if (typeof window !== 'undefined') {
          if (valueToStore === undefined || valueToStore === null) {
            window.sessionStorage.removeItem(key)
          } else {
            window.sessionStorage.setItem(key, JSON.stringify(valueToStore))
          }
        }
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  const removeValue = useCallback(() => {
    try {
      setStoredValue(
        typeof initialValue === 'function' 
          ? (initialValue as () => T)() 
          : initialValue
      )
      
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key)
      }
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}