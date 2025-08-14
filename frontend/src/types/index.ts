// 基础类型定义

// 用户角色类型
export type UserRole = 'super_admin' | 'medical_admin' | 'mall_admin' | 'marketing_admin'

// 用户信息类型
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

// 医生信息类型
export interface Doctor {
  id: string
  name: string
  title: string
  department: string
  avatar?: string
  rating?: number
  is_online?: boolean
  work_time?: string[]
  specialties?: string[]
  experience_years: number
  consultation_count?: number
  introduction?: string
  hospital?: string
  is_active: boolean
  consultation_fee?: number
  response_time?: string
  good_rate?: number
  created_at: string
  updated_at: string
}

// 科室信息类型
export interface Department {
  id: string
  name: string
  description?: string
  head_doctor_id?: string
  head_doctor?: {
    id: string
    name: string
    title: string
    avatar?: string
  }
  location?: string
  phone?: string
  email?: string
  working_hours?: any
  services?: string[]
  equipment?: string[]
  specialties?: string[]
  is_active: boolean
  sort_order?: number
  created_at: string
  updated_at: string
}

// 商品信息类型
export interface Product {
  id: string
  name: string
  description?: string
  price: number
  original_price?: number
  imageUrl?: string
  images?: string[]
  brand?: string
  model?: string
  sales: number
  categoryId?: string
  categoryName?: string
  stock: number
  stock_quantity: number
  minStock: number
  min_stock_level: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 轮播图信息类型
export interface CarouselImage {
  id: string
  title: string
  imageUrl: string
  linkUrl?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 文章信息类型
export interface Article {
  id: string
  title: string
  content: string
  author?: string
  categoryId?: string
  categoryName?: string
  coverImage?: string
  isPublished: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 分页参数类型
export interface PaginationParams {
  page: number
  pageSize: number
  total?: number
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// 表格列配置类型
export interface TableColumn {
  title: string
  dataIndex: string
  key: string
  width?: number
  align?: 'left' | 'center' | 'right'
  sorter?: boolean
  render?: (value: any, record: any, index: number) => React.ReactNode
}

// 表单字段类型
export interface FormField {
  name: string
  label: string
  type: 'input' | 'textarea' | 'select' | 'number' | 'switch' | 'upload' | 'date'
  required?: boolean
  placeholder?: string
  options?: { label: string; value: any }[]
  rules?: any[]
}

// 菜单项类型
export interface MenuItem {
  key: string
  label: string
  icon?: React.ReactNode
  children?: MenuItem[]
  path?: string
  permission?: string
}

// 统计数据类型
export interface StatisticsData {
  totalDoctors: number
  onlineDoctors: number
  totalProducts: number
  lowStockProducts: number
  totalArticles: number
  publishedArticles: number
  totalUsers: number
  activeUsers: number
}