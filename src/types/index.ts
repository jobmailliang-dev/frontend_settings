export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface User {
  id: number
  username: string
  email: string
  full_name?: string
  is_active: boolean
  is_admin: boolean
  avatar_url?: string
  created_at: string
  updated_at: string
  roles?: Role[]
}

export interface Role {
  id: number
  name: string
  code: string
  description?: string
  is_active: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UserCreate {
  username: string
  email: string
  password: string
  full_name?: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}
