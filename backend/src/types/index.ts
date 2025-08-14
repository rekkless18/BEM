import { Request } from 'express';

// 用户角色枚举
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  MEDICAL_ADMIN = 'medical_admin',
  MALL_ADMIN = 'mall_admin',
  MARKETING_ADMIN = 'marketing_admin',
}

// 用户信息接口
export interface User {
  id: string
  username: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 医生信息接口
export interface Doctor {
  id: string
  name: string
  title: string
  departmentId: string
  departmentName?: string
  phone: string
  email: string
  avatar?: string
  introduction?: string
  specialties: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 科室信息接口
export interface Department {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 商品信息接口
export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  categoryId: string
  categoryName?: string
  images: string[]
  specifications?: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 轮播图信息接口
export interface Banner {
  id: string
  title: string
  imageUrl: string
  linkUrl?: string
  description?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 文章信息接口
export interface Article {
  id: string
  title: string
  content: string
  summary?: string
  cover_image?: string
  author?: string
  category?: string
  tags: string[]
  view_count: number
  like_count: number
  share_count: number
  status: 'draft' | 'published' | 'archived'
  is_featured: boolean
  published_at?: string
  created_at: string
  updated_at: string
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

// 分页参数接口
export interface PaginationParams {
  page: number
  pageSize: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 分页响应接口
export interface PaginationResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// JWT载荷接口
export interface JwtPayload {
  userId: string
  username: string
  role: UserRole
  type?: 'access' | 'refresh'
  iat?: number
  exp?: number
}

// 登录请求接口
export interface LoginRequest {
  username: string
  password: string
}

// 登录响应接口
export interface LoginResponse {
  success: boolean
  message: string
  data: {
    token: string
    user: User
    expiresIn: string
  }
}

// 文件上传接口
export interface FileUpload {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  buffer: Buffer
}

// 错误响应接口
export interface ErrorResponse {
  success: false
  message: string
  error: string
  statusCode?: number
  timestamp?: string
  stack?: string
  fields?: Record<string, string[]>
}

// 统计数据接口
export interface StatisticData {
  totalUsers: number
  totalDoctors: number
  totalProducts: number
  totalOrders: number
  userGrowth: number
  doctorGrowth: number
  productGrowth: number
  orderGrowth: number
}

// Express Request扩展接口已在auth中间件中通过全局声明定义

// 导出社区管理相关类型
export * from './community'

// 数据库表名常量
export const TABLE_NAMES = {
  ADMIN_USERS: 'admin_users',
  DOCTORS: 'doctors',
  DEPARTMENTS: 'departments',
  PRODUCTS: 'products',
  BANNERS: 'banners',
  ARTICLES: 'articles',
  CAROUSEL_IMAGES: 'carousel_images',
} as const

// API路径常量
export const API_PATHS = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  DOCTORS: '/api/doctors',
  DEPARTMENTS: '/api/departments',
  PRODUCTS: '/api/products',
  BANNERS: '/api/banners',
  ARTICLES: '/api/articles',
  CAROUSEL_IMAGES: '/api/carousel-images',
  UPLOAD: '/api/upload',
} as const