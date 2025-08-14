import axios from 'axios';
import { message } from 'antd';

// API基础配置
const API_BASE_URL = 'http://localhost:5000/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误和token过期
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // token过期或无效
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
          message.error('登录已过期，请重新登录');
          break;
        case 403:
          message.error('权限不足');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器内部错误');
          break;
        default:
          message.error(data?.message || '请求失败');
      }
    } else if (error.request) {
      message.error('网络连接失败，请检查网络');
    } else {
      message.error('请求配置错误');
    }
    
    return Promise.reject(error);
  }
);

// 通用API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  total?: number;
}

// 分页参数类型
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: any;
}

// 认证相关API
export const authApi = {
  // 登录
  login: (credentials: { username: string; password: string }) =>
    api.post<ApiResponse<{ token: string; user: any }>>('/auth/login', credentials),
  
  // 获取当前用户信息
  getCurrentUser: () =>
    api.get<ApiResponse<any>>('/auth/me'),
  
  // 刷新token
  refreshToken: () =>
    api.post<ApiResponse<{ token: string }>>('/auth/refresh'),
};

// 用户管理API
export const userApi = {
  // 获取用户列表
  getList: (params?: PaginationParams) =>
    api.get<ApiResponse<any[]>>('/users', { params }),
  
  // 获取用户详情
  getById: (id: string) =>
    api.get<ApiResponse<any>>(`/users/${id}`),
  
  // 创建用户
  create: (data: any) =>
    api.post<ApiResponse<any>>('/users', data),
  
  // 更新用户
  update: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/users/${id}`, data),
  
  // 删除用户
  delete: (id: string) =>
    api.delete<ApiResponse<any>>(`/users/${id}`),
  
  // 批量更新用户状态
  batchUpdateStatus: (data: { userIds: string[]; is_active: boolean }) =>
    api.patch<ApiResponse<any>>('/users/batch-status', data),
};

// 科室管理API
export const departmentApi = {
  // 获取科室列表
  getList: (params?: PaginationParams) =>
    api.get<ApiResponse<any[]>>('/departments', { params }),
  
  // 获取科室详情
  getById: (id: string) =>
    api.get<ApiResponse<any>>(`/departments/${id}`),
  
  // 创建科室
  create: (data: any) =>
    api.post<ApiResponse<any>>('/departments', data),
  
  // 更新科室
  update: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/departments/${id}`, data),
  
  // 删除科室
  delete: (id: string) =>
    api.delete<ApiResponse<any>>(`/departments/${id}`),
  
  // 更新排序
  updateSort: (data: { id: string; sort_order: number }[]) =>
    api.put<ApiResponse<any>>('/departments/sort', { departments: data }),
};

// 医生管理API
export const doctorApi = {
  // 获取医生列表
  getList: (params?: PaginationParams) =>
    api.get<ApiResponse<any[]>>('/doctors', { params }),
  
  // 获取医生详情
  getById: (id: string) =>
    api.get<ApiResponse<any>>(`/doctors/${id}`),
  
  // 创建医生
  create: (data: any) =>
    api.post<ApiResponse<any>>('/doctors', data),
  
  // 更新医生
  update: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/doctors/${id}`, data),
  
  // 删除医生
  delete: (id: string) =>
    api.delete<ApiResponse<any>>(`/doctors/${id}`),
  
  // 更新可用状态
  updateAvailability: (id: string, is_available: boolean) =>
    api.patch<ApiResponse<any>>(`/doctors/${id}/availability`, { is_available }),
  
  // 获取科室下的医生
  getByDepartment: (departmentId: string) =>
    api.get<ApiResponse<any[]>>(`/doctors/department/${departmentId}`),
};

// 商品管理API
export const productApi = {
  // 获取商品列表
  getList: (params?: PaginationParams) =>
    api.get<ApiResponse<any[]>>('/products', { params }),
  
  // 获取商品详情
  getById: (id: string) =>
    api.get<ApiResponse<any>>(`/products/${id}`),
  
  // 创建商品
  create: (data: any) =>
    api.post<ApiResponse<any>>('/products', data),
  
  // 更新商品
  update: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/products/${id}`, data),
  
  // 删除商品
  delete: (id: string) =>
    api.delete<ApiResponse<any>>(`/products/${id}`),
  
  // 更新库存
  updateStock: (id: string, stock: number) =>
    api.patch<ApiResponse<any>>(`/products/${id}/stock`, { stock }),
  
  // 获取库存预警商品
  getLowStock: () =>
    api.get<ApiResponse<any[]>>('/products/low-stock'),
  
  // 获取商品分类统计
  getCategoryStats: () =>
    api.get<ApiResponse<any[]>>('/products/category-stats'),
};

// 轮播图管理API
export const carouselApi = {
  // 获取轮播图列表
  getList: (params?: PaginationParams) =>
    api.get<ApiResponse<any[]>>('/carousel', { params }),
  
  // 获取轮播图详情
  getById: (id: string) =>
    api.get<ApiResponse<any>>(`/carousel/${id}`),
  
  // 创建轮播图
  create: (data: any) =>
    api.post<ApiResponse<any>>('/carousel', data),
  
  // 更新轮播图
  update: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/carousel/${id}`, data),
  
  // 删除轮播图
  delete: (id: string) =>
    api.delete<ApiResponse<any>>(`/carousel/${id}`),
  
  // 更新状态
  updateStatus: (id: string, is_active: boolean) =>
    api.patch<ApiResponse<any>>(`/carousel/${id}/status`, { is_active }),
  
  // 更新排序
  updateSort: (data: { id: string; sort_order: number }[]) =>
    api.put<ApiResponse<any>>('/carousel/sort', { items: data }),
  
  // 获取有效轮播图
  getActive: () =>
    api.get<ApiResponse<any[]>>('/carousel/active'),
};

// 文章管理API
export const articleApi = {
  // 获取文章列表
  getList: (params?: PaginationParams) =>
    api.get<ApiResponse<any[]>>('/articles', { params }),
  
  // 获取文章详情
  getById: (id: string) =>
    api.get<ApiResponse<any>>(`/articles/${id}`),
  
  // 创建文章
  create: (data: any) =>
    api.post<ApiResponse<any>>('/articles', data),
  
  // 更新文章
  update: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/articles/${id}`, data),
  
  // 删除文章
  delete: (id: string) =>
    api.delete<ApiResponse<any>>(`/articles/${id}`),
  
  // 更新状态
  updateStatus: (id: string, status: string) =>
    api.patch<ApiResponse<any>>(`/articles/${id}/status`, { status }),
  
  // 更新推荐状态
  updateRecommended: (id: string, is_recommended: boolean) =>
    api.patch<ApiResponse<any>>(`/articles/${id}/recommended`, { is_recommended }),
  
  // 获取推荐文章
  getRecommended: () =>
    api.get<ApiResponse<any[]>>('/articles/recommended'),
  
  // 获取文章分类统计
  getCategoryStats: () =>
    api.get<ApiResponse<any[]>>('/articles/category-stats'),
};

// 管理员管理API
export const adminApi = {
  // 管理员登录
  login: (credentials: { username: string; password: string }) =>
    api.post<ApiResponse<{ token: string; user: any }>>('/admin/login', credentials),
  
  // 获取管理员列表
  getList: (params?: PaginationParams) =>
    api.get<ApiResponse<any[]>>('/admin-users', { params }),
  
  // 获取管理员详情
  getById: (id: string) =>
    api.get<ApiResponse<any>>(`/admin-users/${id}`),
  
  // 创建管理员
  create: (data: any) =>
    api.post<ApiResponse<any>>('/admin-users', data),
  
  // 更新管理员
  update: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/admin-users/${id}`, data),
  
  // 删除管理员
  delete: (id: string) =>
    api.delete<ApiResponse<any>>(`/admin-users/${id}`),
  
  // 重置密码
  resetPassword: (id: string, newPassword: string) =>
    api.patch<ApiResponse<any>>(`/admin-users/${id}/reset-password`, { password: newPassword }),
  
  // 获取权限列表
  getPermissions: () =>
    api.get<ApiResponse<any[]>>('/admin-users/permissions'),
  
  // 获取角色列表
  getRoles: () =>
    api.get<ApiResponse<any[]>>('/admin-users/roles'),
  
  // 获取当前用户信息
  getCurrentUser: () =>
    api.get<ApiResponse<any>>('/admin-users/me'),
  
  // 更新当前用户信息
  updateCurrentUser: (data: any) =>
    api.put<ApiResponse<any>>('/admin-users/me', data),
};

// 咨询管理API
export const consultationApi = {
  // 获取咨询列表
  getList: (params?: PaginationParams) =>
    api.get<ApiResponse<any[]>>('/consultations', { params }),
  
  // 获取咨询详情
  getById: (id: string) =>
    api.get<ApiResponse<any>>(`/consultations/${id}`),
  
  // 创建咨询
  create: (data: any) =>
    api.post<ApiResponse<any>>('/consultations', data),
  
  // 更新咨询状态
  updateStatus: (id: string, data: any) =>
    api.patch<ApiResponse<any>>(`/consultations/${id}/status`, data),
  
  // 删除咨询
  delete: (id: string) =>
    api.delete<ApiResponse<any>>(`/consultations/${id}`),
  
  // 获取统计信息
  getStatistics: () =>
    api.get<ApiResponse<any>>('/consultations/statistics'),
};

// 设备管理API
export const deviceApi = {
  // 获取设备列表
  getList: (params?: PaginationParams) =>
    api.get<ApiResponse<{ devices: any[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>>('/devices', { params }),
  
  // 获取设备详情
  getById: (id: string) =>
    api.get<ApiResponse<any>>(`/devices/${id}`),
  
  // 创建设备
  create: (data: any) =>
    api.post<ApiResponse<any>>('/devices', data),
  
  // 更新设备
  update: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/devices/${id}`, data),
  
  // 删除设备
  delete: (id: string) =>
    api.delete<ApiResponse<any>>(`/devices/${id}`),
  
  // 更新设备状态
  updateStatus: (id: string, status: string) =>
    api.patch<ApiResponse<any>>(`/devices/${id}/status`, { status }),
  
  // 获取统计信息
  getStatistics: () =>
    api.get<ApiResponse<any>>('/devices/statistics'),
};

export default api;