import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import type { ApiResponse } from '@/types'

// Mock 模式下不设置 baseURL，让请求发到当前域名由 MSW 拦截
const isMock = import.meta.env.VITE_USE_MOCK === 'true'
const baseURL = isMock ? '' : (import.meta.env.VITE_API_TARGET ? '/api' : '')

const request = axios.create({
  baseURL: import.meta.env.VITE_API_TARGET ? '/api' : '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

request.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isHandling401 = false

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => response,
  async (error) => {
    const response = error.response
    if (response) {
      const { status, data } = response
      switch (status) {
        case 401:
          if (!isHandling401) {
            isHandling401 = true
            setTimeout(() => {
              ElMessage.error('登录已过期，请重新登录')
              router.replace('/login?expired=true')
              isHandling401 = false
            }, 100)
          }
          break
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          const msg = data?.message || data?.error || `请求失败 (${status})`
          ElMessage.error(msg)
      }
    } else if (error.message.includes('timeout')) {
      ElMessage.error('请求超时')
    } else if (error.message.includes('Network Error')) {
      ElMessage.error('网络连接失败')
    }
    return Promise.reject(error)
  }
)

export const api = {
  get<T = any>(url: string, config?: AxiosRequestConfig) {
    return request.get<ApiResponse<T>>(url, config)
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return request.post<ApiResponse<T>>(url, data, config)
  },
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return request.put<ApiResponse<T>>(url, data, config)
  },
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return request.patch<ApiResponse<T>>(url, data, config)
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return request.delete<ApiResponse<T>>(url, config)
  }
}

export default request
