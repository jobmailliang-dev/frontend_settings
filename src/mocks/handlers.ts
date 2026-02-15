import { http, HttpResponse } from 'msw'
import { mockUser } from './mockUser'
import { toolHandlers } from './handlers/toolHandlers'

export { toolHandlers }

/**
 * Auth 相关的 Mock Handlers
 */

// ========== Auth Handlers ==========

export const authHandlers = [
  // Login handler
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email?: string; password?: string }

    // 模拟任意邮箱密码登录成功
    if (body.email && body.password) {
      const token = 'mock_access_token_' + Date.now()
      return HttpResponse.json({
        success: true,
        data: {
          access_token: token,
          refresh_token: 'mock_refresh_token_' + Date.now(),
          token_type: 'Bearer'
        }
      })
    }

    return HttpResponse.json(
      { success: false, error: '邮箱和密码不能为空' },
      { status: 400 }
    )
  }),

  // Register handler
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as Record<string, any>
    return HttpResponse.json({
      success: true,
      data: {
        ...mockUser,
        id: Math.floor(Math.random() * 1000),
        username: body.username || 'new_user',
        email: body.email || 'new@example.com'
      }
    })
  }),

  // Get current user handler
  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      success: true,
      data: mockUser
    })
  }),

  // Refresh token handler
  http.post('/api/auth/refresh', async ({ request }) => {
    const body = await request.json() as Record<string, any>
    if (body.refresh_token) {
      return HttpResponse.json({
        success: true,
        data: {
          access_token: 'mock_refreshed_token_' + Date.now(),
          refresh_token: body.refresh_token,
          token_type: 'Bearer'
        }
      })
    }
    return HttpResponse.json(
      { success: false, error: 'Invalid refresh token' },
      { status: 401 }
    )
  })
]

// ========== 导出所有 handlers ==========

export const handlers = [...authHandlers, ...toolHandlers]
