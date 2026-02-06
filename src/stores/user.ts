import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/auth'
import type { User, LoginRequest } from '@/types'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!localStorage.getItem('access_token'))
  const isAdmin = computed(() => user.value?.is_admin ?? false)

  const login = async (credentials: LoginRequest) => {
    try {
      isLoading.value = true
      const response = await authApi.login(credentials)
      const { access_token } = response.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', access_token)

      await getCurrentUser()
      return true
    } catch (error: any) {
      console.error('Login failed:', error)
      ElMessage.error(error.response?.data?.detail || error.message || '登录失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData: any) => {
    try {
      isLoading.value = true
      await authApi.register(userData)
      ElMessage.success('注册成功，请登录')
      return true
    } catch (error: any) {
      console.error('Register failed:', error)
      ElMessage.error(error.response?.data?.detail || error.message || '注册失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const getCurrentUser = async () => {
    const response = await authApi.getCurrentUser()
    user.value = response.data
    return user.value
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      console.error('Logout error')
    }
    user.value = null
    ElMessage.success('已退出登录')
  }

  const initializeUser = async () => {
    const token = localStorage.getItem('access_token')
    if (token && !user.value) {
      try {
        await getCurrentUser()
      } catch {
        console.log('Failed to initialize user')
      }
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    getCurrentUser,
    logout,
    initializeUser
  }
})
