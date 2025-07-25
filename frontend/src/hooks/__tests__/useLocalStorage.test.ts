import { renderHook, act } from '@testing-library/react'
import {
  useLocalStorage,
  useSessionStorage,
  clearLocalStorageItem,
  clearLocalStorage,
  getLocalStorageSize,
  isLocalStorageAvailable,
} from '../useLocalStorage'

// LocalStorage と SessionStorage のモック
const mockStorage = () => {
  let store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    key: jest.fn((index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }),
    get length() {
      return Object.keys(store).length
    },
    hasOwnProperty: jest.fn((key: string) => key in store),
  }
}

const mockLocalStorage = mockStorage()
const mockSessionStorage = mockStorage()

// グローバルオブジェクトにモックを設定
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
})

describe('useLocalStorage', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    jest.clearAllMocks()
  })

  describe('基本機能', () => {
    it('初期値で正しく初期化されるべき', () => {
      const { result } = renderHook(() =>
        useLocalStorage('testKey', 'initialValue')
      )

      expect(result.current[0]).toBe('initialValue')
    })

    it('関数型初期値で初期化されるべき', () => {
      const initialValue = jest.fn(() => 'computedValue')
      
      const { result } = renderHook(() =>
        useLocalStorage('testKey', initialValue)
      )

      expect(result.current[0]).toBe('computedValue')
      expect(initialValue).toHaveBeenCalledTimes(1)
    })

    it('既存のlocalStorageの値で初期化されるべき', () => {
      mockLocalStorage.setItem('existingKey', JSON.stringify('existingValue'))
      
      const { result } = renderHook(() =>
        useLocalStorage('existingKey', 'initialValue')
      )

      expect(result.current[0]).toBe('existingValue')
    })

    it('値を設定できるべき', () => {
      const { result } = renderHook(() =>
        useLocalStorage('testKey', 'initial')
      )

      act(() => {
        result.current[1]('newValue')
      })

      expect(result.current[0]).toBe('newValue')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'testKey',
        JSON.stringify('newValue')
      )
    })

    it('関数型で値を設定できるべき', () => {
      const { result } = renderHook(() =>
        useLocalStorage('testKey', 'initial')
      )

      act(() => {
        result.current[1]((prev) => prev + '_updated')
      })

      expect(result.current[0]).toBe('initial_updated')
    })

    it('値を削除できるべき', () => {
      const { result } = renderHook(() =>
        useLocalStorage('testKey', 'initial')
      )

      act(() => {
        result.current[1](null)
      })

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testKey')
    })

    it('undefined値で削除できるべき', () => {
      const { result } = renderHook(() =>
        useLocalStorage('testKey', 'initial')
      )

      act(() => {
        result.current[1](undefined as any)
      })

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testKey')
    })

    it('removeValue関数で値を削除できるべき', () => {
      const { result } = renderHook(() =>
        useLocalStorage('testKey', 'initial')
      )

      act(() => {
        result.current[2]() // removeValue function
      })

      expect(result.current[0]).toBe('initial') // 初期値に戻る
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testKey')
    })
  })

  describe('複雑なデータ型', () => {
    it('オブジェクトを保存・取得できるべき', () => {
      const testObject = { name: 'テスト', age: 25 }
      
      const { result } = renderHook(() =>
        useLocalStorage('objectKey', testObject)
      )

      expect(result.current[0]).toEqual(testObject)

      const newObject = { name: '新しいテスト', age: 30 }
      act(() => {
        result.current[1](newObject)
      })

      expect(result.current[0]).toEqual(newObject)
    })

    it('配列を保存・取得できるべき', () => {
      const testArray = [1, 2, 3, 4, 5]
      
      const { result } = renderHook(() =>
        useLocalStorage('arrayKey', testArray)
      )

      expect(result.current[0]).toEqual(testArray)
    })

    it('boolean値を保存・取得できるべき', () => {
      const { result } = renderHook(() =>
        useLocalStorage('boolKey', false)
      )

      act(() => {
        result.current[1](true)
      })

      expect(result.current[0]).toBe(true)
    })

    it('number値を保存・取得できるべき', () => {
      const { result } = renderHook(() =>
        useLocalStorage('numberKey', 0)
      )

      act(() => {
        result.current[1](42)
      })

      expect(result.current[0]).toBe(42)
    })
  })

  describe('エラーハンドリング', () => {
    it('JSON.parseエラーが発生した場合初期値を使用するべき', () => {
      mockLocalStorage.setItem('corruptedKey', 'invalid json {')
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const { result } = renderHook(() =>
        useLocalStorage('corruptedKey', 'fallbackValue')
      )

      expect(result.current[0]).toBe('fallbackValue')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error reading localStorage key "corruptedKey":',
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })

    it('setItemエラーが発生した場合警告を出力するべき', () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded')
      })
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const { result } = renderHook(() =>
        useLocalStorage('testKey', 'initial')
      )

      act(() => {
        result.current[1]('newValue')
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error setting localStorage key "testKey":',
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })

    it('removeItemエラーが発生した場合警告を出力するべき', () => {
      mockLocalStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('Remove error')
      })
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const { result } = renderHook(() =>
        useLocalStorage('testKey', 'initial')
      )

      act(() => {
        result.current[2]() // removeValue
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error removing localStorage key "testKey":',
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('SSR対応', () => {
    const originalWindow = global.window

    beforeEach(() => {
      // window を undefined にしてSSR環境をシミュレート
      delete (global as any).window
    })

    afterEach(() => {
      global.window = originalWindow
    })

    it('SSR環境で初期値を使用するべき', () => {
      const { result } = renderHook(() =>
        useLocalStorage('testKey', 'ssrValue')
      )

      expect(result.current[0]).toBe('ssrValue')
    })

    it('SSR環境で関数型初期値を使用するべき', () => {
      const initialValue = jest.fn(() => 'ssrComputedValue')
      
      const { result } = renderHook(() =>
        useLocalStorage('testKey', initialValue)
      )

      expect(result.current[0]).toBe('ssrComputedValue')
      expect(initialValue).toHaveBeenCalled()
    })
  })
})

describe('useSessionStorage', () => {
  beforeEach(() => {
    mockSessionStorage.clear()
    jest.clearAllMocks()
  })

  it('sessionStorageで基本的な機能が動作するべき', () => {
    const { result } = renderHook(() =>
      useSessionStorage('sessionKey', 'initial')
    )

    expect(result.current[0]).toBe('initial')

    act(() => {
      result.current[1]('sessionValue')
    })

    expect(result.current[0]).toBe('sessionValue')
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'sessionKey',
      JSON.stringify('sessionValue')
    )
  })

  it('removeValue関数が動作するべき', () => {
    const { result } = renderHook(() =>
      useSessionStorage('sessionKey', 'initial')
    )

    act(() => {
      result.current[2]() // removeValue
    })

    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('sessionKey')
  })
})

describe('ユーティリティ関数', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    jest.clearAllMocks()
  })

  describe('clearLocalStorageItem', () => {
    it('指定したkeyをクリアできるべき', () => {
      clearLocalStorageItem('testKey')
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testKey')
    })

    it('エラーが発生した場合警告を出力するべき', () => {
      mockLocalStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('Remove error')
      })
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      clearLocalStorageItem('testKey')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error clearing localStorage key "testKey":',
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('clearLocalStorage', () => {
    it('全てのlocalStorageをクリアできるべき', () => {
      clearLocalStorage()
      
      expect(mockLocalStorage.clear).toHaveBeenCalled()
    })

    it('プレフィックス付きキーのみをクリアできるべき', () => {
      // テストデータをセットアップ
      const testStore = {
        'prefix_key1': 'value1',
        'prefix_key2': 'value2',
        'other_key': 'value3',
      }
      
      mockLocalStorage.key.mockImplementation((index) => {
        const keys = Object.keys(testStore)
        return keys[index] || null
      })
      
      Object.defineProperty(mockLocalStorage, 'length', {
        get: () => Object.keys(testStore).length,
      })
      
      clearLocalStorage('prefix_')
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('prefix_key1')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('prefix_key2')
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('other_key')
    })

    it('エラーが発生した場合警告を出力するべき', () => {
      mockLocalStorage.clear.mockImplementationOnce(() => {
        throw new Error('Clear error')
      })
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      clearLocalStorage()
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error clearing localStorage:',
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('getLocalStorageSize', () => {
    it('localStorageのサイズを計算できるべき', () => {
      const testStore = {
        'key1': 'value1', // key1(4) + value1(6) = 10
        'key2': 'value2', // key2(4) + value2(6) = 10
      }
      
      mockLocalStorage.hasOwnProperty.mockImplementation((key) => key in testStore)
      
      // for...in ループをモック
      Object.defineProperty(mockLocalStorage, Symbol.iterator, {
        *value() {
          for (const key in testStore) {
            yield key
          }
        }
      })
      
      Object.keys(testStore).forEach(key => {
        Object.defineProperty(mockLocalStorage, key, {
          value: testStore[key as keyof typeof testStore],
          enumerable: true,
          configurable: true,
        })
      })
      
      const size = getLocalStorageSize()
      expect(size).toBe(20) // 10 + 10
    })

    it('エラーが発生した場合0を返すべき', () => {
      mockLocalStorage.hasOwnProperty.mockImplementationOnce(() => {
        throw new Error('hasOwnProperty error')
      })
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const size = getLocalStorageSize()
      
      expect(size).toBe(0)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error calculating localStorage size:',
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('isLocalStorageAvailable', () => {
    it('localStorageが利用可能な場合trueを返すべき', () => {
      const result = isLocalStorageAvailable()
      expect(result).toBe(true)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        '__localStorage_test__',
        'test'
      )
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        '__localStorage_test__'
      )
    })

    it('localStorageが利用できない場合falseを返すべき', () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage not available')
      })
      
      const result = isLocalStorageAvailable()
      expect(result).toBe(false)
    })
  })

  describe('SSR環境でのユーティリティ関数', () => {
    const originalWindow = global.window

    beforeEach(() => {
      delete (global as any).window
    })

    afterEach(() => {
      global.window = originalWindow
    })

    it('getLocalStorageSize: SSR環境で0を返すべき', () => {
      const size = getLocalStorageSize()
      expect(size).toBe(0)
    })

    it('isLocalStorageAvailable: SSR環境でfalseを返すべき', () => {
      const result = isLocalStorageAvailable()
      expect(result).toBe(false)
    })
  })
})