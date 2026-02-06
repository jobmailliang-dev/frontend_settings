import { api } from './request'
import type { User, UserCreate, AuthTokens, ApiResponse, LoginRequest } from '@/types'

export const authApi = {
  login(data: LoginRequest) {
    return api.post<AuthTokens>('/auth/login', data)
  },
  register(data: UserCreate) {
    return api.post<User>('/auth/register', data)
  },
  refreshToken(refreshToken: string) {
    return api.post<AuthTokens>('/auth/refresh', { refresh_token: refreshToken })
  },
  getCurrentUser() {
    return api.get<User>('/auth/me')
  },
  logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    return Promise.resolve()
  }
}
