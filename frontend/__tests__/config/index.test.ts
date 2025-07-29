import { config, apiConfig, storageKeys, validateConfig } from '@/config/index'

describe('config', () => {
  it('デフォルト設定値が正しく設定されている', () => {
    expect(config.apiBaseUrl).toBe('http://localhost:8000')
    expect(config.apiTimeout).toBe(30000)
    expect(config.authTokenKey).toBe('auth_token')
    expect(config.refreshTokenKey).toBe('refresh_token')
  })

  it('paginationDefaultsが正しく設定されている', () => {
    expect(config.paginationDefaults.pageSize).toBe(10)
    expect(config.paginationDefaults.maxPageSize).toBe(100)
  })

  it('dateFormatが正しく設定されている', () => {
    expect(config.dateFormat.default).toBe('yyyy-MM-dd')
    expect(config.dateFormat.short).toBe('MM/dd')
    expect(config.dateFormat.long).toBe('yyyy年MM月dd日')
    expect(config.dateFormat.time).toBe('HH:mm')
    expect(config.dateFormat.dateTime).toBe('yyyy-MM-dd HH:mm')
  })

  it('environment設定が正しく設定されている', () => {
    expect(config.environment.name).toBe('test')
    expect(config.environment.isDevelopment).toBe(false)
    expect(config.environment.isProduction).toBe(false)
    expect(config.environment.isTest).toBe(true)
  })

  it('features設定が正しく設定されている', () => {
    expect(config.features.enableNotifications).toBe(true)
    expect(config.features.enableRealTimeUpdates).toBe(false)
    expect(config.features.enableAnalytics).toBe(false)
  })

  it('ui設定が正しく設定されている', () => {
    expect(config.ui.defaultTheme).toBe('system')
    expect(config.ui.supportedLanguages).toEqual(['ja', 'en'])
    expect(config.ui.defaultLanguage).toBe('ja')
  })
})

describe('apiConfig', () => {
  it('API設定が正しく設定されている', () => {
    expect(apiConfig.baseUrl).toBe(config.apiBaseUrl)
    expect(apiConfig.timeout).toBe(config.apiTimeout)
  })

  it('authエンドポイントが正しく設定されている', () => {
    expect(apiConfig.endpoints.auth.login).toBe('/api/auth/login')
    expect(apiConfig.endpoints.auth.logout).toBe('/api/auth/logout')
    expect(apiConfig.endpoints.auth.refresh).toBe('/api/auth/refresh')
    expect(apiConfig.endpoints.auth.me).toBe('/api/auth/me')
  })

  it('usersエンドポイントが正しく設定されている', () => {
    expect(apiConfig.endpoints.users.list).toBe('/api/users')
    expect(apiConfig.endpoints.users.create).toBe('/api/users')
    expect(apiConfig.endpoints.users.get('123')).toBe('/api/users/123')
    expect(apiConfig.endpoints.users.update('123')).toBe('/api/users/123')
    expect(apiConfig.endpoints.users.delete('123')).toBe('/api/users/123')
  })

  it('schedulesエンドポイントが正しく設定されている', () => {
    expect(apiConfig.endpoints.schedules.list).toBe('/api/schedules')
    expect(apiConfig.endpoints.schedules.create).toBe('/api/schedules')
    expect(apiConfig.endpoints.schedules.get('123')).toBe('/api/schedules/123')
    expect(apiConfig.endpoints.schedules.update('123')).toBe('/api/schedules/123')
    expect(apiConfig.endpoints.schedules.delete('123')).toBe('/api/schedules/123')
  })

  it('sessionsエンドポイントが正しく設定されている', () => {
    expect(apiConfig.endpoints.sessions.list).toBe('/api/sessions')
    expect(apiConfig.endpoints.sessions.create).toBe('/api/sessions')
    expect(apiConfig.endpoints.sessions.get('123')).toBe('/api/sessions/123')
    expect(apiConfig.endpoints.sessions.update('123')).toBe('/api/sessions/123')
    expect(apiConfig.endpoints.sessions.delete('123')).toBe('/api/sessions/123')
    expect(apiConfig.endpoints.sessions.bySchedule('schedule123')).toBe('/api/schedules/schedule123/sessions')
  })
})

describe('storageKeys', () => {
  it('storageKeysが正しく設定されている', () => {
    expect(storageKeys.authToken).toBe(config.authTokenKey)
    expect(storageKeys.refreshToken).toBe(config.refreshTokenKey)
    expect(storageKeys.userPreferences).toBe('user_preferences')
    expect(storageKeys.theme).toBe('theme')
    expect(storageKeys.language).toBe('language')
  })
})

describe('validateConfig', () => {
  it('必要な環境変数が設定されている場合trueを返す', () => {
    expect(validateConfig()).toBe(true)
  })

  it('必要な環境変数が不足している場合falseを返す', () => {
    const originalValue = process.env.NEXT_PUBLIC_API_BASE_URL
    delete process.env.NEXT_PUBLIC_API_BASE_URL
    
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    
    expect(validateConfig()).toBe(false)
    expect(consoleWarnSpy).toHaveBeenCalledWith('Missing required environment variables:', ['NEXT_PUBLIC_API_BASE_URL'])
    
    // Restore
    process.env.NEXT_PUBLIC_API_BASE_URL = originalValue
    consoleWarnSpy.mockRestore()
  })
})