import { http, HttpResponse } from 'msw'

const API_BASE = 'http://localhost:8000/api/v1'

export const handlers = [
  // Auth
  http.post(`${API_BASE}/auth/signin`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'bearer',
    })
  }),

  // Users
  http.get(`${API_BASE}/users/me`, () => {
    return HttpResponse.json({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'テストユーザー',
    })
  }),

  http.get(`${API_BASE}/users/me/role`, () => {
    return HttpResponse.json({
      role_type: 'admin',
      is_visible_to_general: true,
      is_instructor: false,
    })
  }),

  // Account Setting
  http.get(`${API_BASE}/account-setting/profile/exists`, () => {
    return HttpResponse.json({ exists: true })
  }),
]
