import '@testing-library/jest-dom'

// Mock Next.js environment variables
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8000'
process.env.NEXT_PUBLIC_API_TIMEOUT = '30000'
process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS = 'true'
process.env.NEXT_PUBLIC_ENABLE_REALTIME = 'false'
process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = 'false'
process.env.NEXT_PUBLIC_DEFAULT_THEME = 'system'
process.env.NODE_ENV = 'test'

// Mock fetch globally
global.fetch = jest.fn()

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})