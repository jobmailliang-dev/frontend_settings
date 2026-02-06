import type { User, Role } from '@/types'

export const mockUser: User = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  full_name: '管理员',
  is_active: true,
  is_admin: true,
  avatar_url: '',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  roles: [
    {
      id: 1,
      name: '超级管理员',
      code: 'SUPER_ADMIN',
      description: '系统超级管理员',
      is_active: true
    }
  ]
}

export const mockTokens = {
  access_token: 'mock_access_token_' + Date.now(),
  refresh_token: 'mock_refresh_token_' + Date.now(),
  token_type: 'Bearer'
}
