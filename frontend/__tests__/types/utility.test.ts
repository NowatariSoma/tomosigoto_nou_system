import {
  Result,
  AsyncState,
  DeepPartial,
  Nullable,
  Optional,
  PartialBy,
  RequiredBy,
  SortDirection,
  LoadingState,
} from '@/types/utility'

describe('utility types', () => {
  describe('Result type', () => {
    it('成功結果を正しく表現する', () => {
      const successResult: Result<string, Error> = {
        success: true,
        value: 'test value',
      }
      
      expect(successResult.success).toBe(true)
      if (successResult.success) {
        expect(successResult.value).toBe('test value')
      }
    })

    it('失敗結果を正しく表現する', () => {
      const errorResult: Result<string, Error> = {
        success: false,
        error: new Error('test error'),
      }
      
      expect(errorResult.success).toBe(false)
      if (!errorResult.success) {
        expect(errorResult.error.message).toBe('test error')
      }
    })
  })

  describe('AsyncState type', () => {
    it('非同期状態を正しく表現する', () => {
      const idleState: AsyncState<string> = {
        data: null,
        loading: false,
        error: null,
        status: 'idle',
      }
      
      expect(idleState.status).toBe('idle')
      expect(idleState.data).toBeNull()
      expect(idleState.loading).toBe(false)
      expect(idleState.error).toBeNull()

      const loadingState: AsyncState<string> = {
        data: null,
        loading: true,
        error: null,
        status: 'loading',
      }
      
      expect(loadingState.status).toBe('loading')
      expect(loadingState.loading).toBe(true)

      const successState: AsyncState<string> = {
        data: 'success data',
        loading: false,
        error: null,
        status: 'success',
      }
      
      expect(successState.status).toBe('success')
      expect(successState.data).toBe('success data')

      const errorState: AsyncState<string> = {
        data: null,
        loading: false,
        error: new Error('test error'),
        status: 'error',
      }
      
      expect(errorState.status).toBe('error')
      expect(errorState.error?.message).toBe('test error')
    })
  })

  describe('DeepPartial type', () => {
    interface TestObject {
      id: string
      name: string
      nested: {
        value: number
        optional?: string
      }
    }

    it('ネストしたオブジェクトを部分的にオプショナルにする', () => {
      const partialObject: DeepPartial<TestObject> = {
        name: 'test',
        nested: {
          value: 42,
        },
      }
      
      expect(partialObject.name).toBe('test')
      expect(partialObject.nested?.value).toBe(42)
    })
  })

  describe('Nullable and Optional types', () => {
    it('Nullable型がnullを許可する', () => {
      const nullableString: Nullable<string> = null
      const notNullString: Nullable<string> = 'test'
      
      expect(nullableString).toBeNull()
      expect(notNullString).toBe('test')
    })

    it('Optional型がundefinedを許可する', () => {
      const optionalString: Optional<string> = undefined
      const definedString: Optional<string> = 'test'
      
      expect(optionalString).toBeUndefined()
      expect(definedString).toBe('test')
    })
  })

  describe('PartialBy and RequiredBy types', () => {
    interface TestInterface {
      id: string
      name: string
      email: string
      age?: number
    }

    it('PartialBy型が特定のフィールドをオプショナルにする', () => {
      const partialByEmail: PartialBy<TestInterface, 'email'> = {
        id: '1',
        name: 'test',
        // email is optional
      }
      
      expect(partialByEmail.id).toBe('1')
      expect(partialByEmail.name).toBe('test')
    })

    it('RequiredBy型が特定のフィールドを必須にする', () => {
      const requiredByAge: RequiredBy<TestInterface, 'age'> = {
        id: '1',
        name: 'test',
        email: 'test@example.com',
        age: 25, // now required
      }
      
      expect(requiredByAge.age).toBe(25)
    })
  })

  describe('LoadingState and SortDirection types', () => {
    it('LoadingState型が正しい値を持つ', () => {
      const states: LoadingState[] = ['idle', 'loading', 'success', 'error']
      
      expect(states).toContain('idle')
      expect(states).toContain('loading')
      expect(states).toContain('success')
      expect(states).toContain('error')
    })

    it('SortDirection型が正しい値を持つ', () => {
      const directions: SortDirection[] = ['asc', 'desc']
      
      expect(directions).toContain('asc')
      expect(directions).toContain('desc')
    })
  })
})

// Type-only tests (compile-time tests)
describe('compile-time type tests', () => {
  it('型が正しくコンパイルされる', () => {
    // These tests ensure that types compile correctly
    // They don't need runtime assertions, just compilation
    
    type TestResult = Result<string, number>
    type TestAsyncState = AsyncState<{ id: string }>
    type TestDeepPartial = DeepPartial<{ a: { b: { c: string } } }>
    type TestNullable = Nullable<boolean>
    type TestOptional = Optional<Date>
    
    // If this test runs, it means all types compiled successfully
    expect(true).toBe(true)
  })
})