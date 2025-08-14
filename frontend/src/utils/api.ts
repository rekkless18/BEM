import axios from 'axios'
import { useAuthStore } from '../stores/authStore'
import type { ApiResponse, PaginatedResponse } from '../types'

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误和token过期
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const { logout } = useAuthStore.getState()
    
    // 处理401未授权错误
    if (error.response?.status === 401) {
      logout()
      window.location.href = '/login'
      return Promise.reject(new Error('登录已过期，请重新登录'))
    }
    
    // 处理网络错误
    if (!error.response) {
      return Promise.reject(new Error('网络连接失败，请检查网络设置'))
    }
    
    // 处理其他错误
    const message = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

// API方法封装
export const apiClient = {
  // GET请求
  get: <T = any>(url: string, params?: any): Promise<ApiResponse<T>> => {
    return api.get(url, { params })
  },
  
  // POST请求
  post: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
    return api.post(url, data)
  },
  
  // PUT请求
  put: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
    return api.put(url, data)
  },
  
  // DELETE请求
  delete: <T = any>(url: string): Promise<ApiResponse<T>> => {
    return api.delete(url)
  },
  
  // 分页请求
  getPaginated: <T = any>(
    url: string, 
    params?: { page?: number; pageSize?: number; [key: string]: any }
  ): Promise<ApiResponse<PaginatedResponse<T>>> => {
    return api.get(url, { params })
  },
}

// 文件上传
export const uploadFile = async (file: File, folder = 'uploads'): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)
  
  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return response.data.url
  } catch (error) {
    throw new Error('文件上传失败')
  }
}

// 导出默认实例
export default api