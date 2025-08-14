// 基础类型定义

// 用户角色类型
export type UserRole = 'super_admin' | 'medical_admin' | 'mall_admin' | 'marketing_admin'

// 用户信息类型
export interface User {
  id: string
  openid: string
  nick_name: string
  avatar_url?: string
  phone?: string
  email?: string
  gender?: string
  birth_date?: string
  address?: string
  emergency_contact?: any
  medical_history?: any
  allergies?: string[]
  current_medications?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  last_login_at?: string
  // 兼容旧字段
  username?: string
  name?: string
  role?: UserRole | string
}

// 医生信息类型
export interface Doctor {
  id: string
  name: string
  title: string
  department_id: string
  phone?: string
  email?: string
  avatar?: string
  specialties?: string[]
  experience_years?: number
  consultation_fee?: number
  working_hours?: any
  introduction?: string
  is_active: boolean
  created_at: string
  updated_at: string
  // 兼容旧字段
  department?: string
  rating?: number
  is_online?: boolean
  work_time?: string[]
  consultation_count?: number
  hospital?: string
  isActive?: boolean
  response_time?: string
  good_rate?: number
  createdAt?: string
  updatedAt?: string
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
  isActive?: boolean
  sort_order?: number
  created_at: string
  createdAt?: string
  updated_at: string
  updatedAt?: string
}

// 商品信息类型
export interface Product {
  id: string
  name: string
  description?: string
  price: number
  original_price?: number
  category: string
  brand?: string
  model?: string
  specifications?: any
  images?: string[]
  stock_quantity: number
  min_stock_level: number
  status: string
  tags?: string[]
  weight?: string
  dimensions?: string
  manufacturer?: string
  production_date?: string
  expiry_date?: string
  usage_instructions?: string
  precautions?: string
  storage_conditions?: string
  is_active: boolean
  created_at: string
  updated_at: string
  // 兼容旧字段
  sales?: number
  categoryId?: string
  categoryName?: string
  stock?: number
  minStock?: number
  imageUrl?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

// 轮播图信息类型
export interface CarouselImage {
  id: string
  title: string
  image_url: string
  link_url?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  // 兼容旧字段
  imageUrl?: string
  linkUrl?: string
  sortOrder?: number
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

// 文章信息类型
export interface Article {
  id: string
  title: string
  content: string
  author?: string
  category?: string
  cover_image?: string
  tags?: string[]
  is_published: boolean
  published_at?: string
  is_recommended: boolean
  view_count: number
  like_count: number
  created_at: string
  updated_at: string
  // 兼容旧字段
  categoryId?: string
  categoryName?: string
  coverImage?: string
  isPublished?: boolean
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
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
export interface TableColumn<T = any> {
  title: string
  dataIndex?: string
  key: string
  width?: number
  align?: 'left' | 'center' | 'right'
  sorter?: boolean
  render?: (value: any, record: T, index: number) => React.ReactNode
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

// 管理员用户类型
export interface AdminUser {
  id: string
  username: string
  email: string
  name: string
  role: string
  is_active: boolean
  permissions?: string[]
  created_at: string
  updated_at: string
  last_login_at?: string
}

// 权限类型
export interface Permission {
  id: string
  name: string
  code: string
  description?: string
  category?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 角色类型
export interface Role {
  id: string
  name: string
  code: string
  description?: string
  permissions?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

// 设备信息类型
export interface Device {
  id: string
  name: string
  type: string
  model?: string
  manufacturer?: string
  serial_number?: string
  status: 'active' | 'inactive' | 'maintenance'
  location?: string
  user_id?: string
  settings?: any
  last_maintenance?: string
  next_maintenance?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 咨询信息类型
export interface Consultation {
  id: string
  user_id: string
  doctor_id: string
  type: 'text' | 'voice' | 'video'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  title?: string
  description?: string
  symptoms?: string[]
  diagnosis?: string
  prescription?: string
  fee: number
  started_at?: string
  ended_at?: string
  rating?: number
  review?: string
  created_at: string
  updated_at: string
}

// 订单信息类型
export interface Order {
  id: string
  user_id: string
  order_number: string
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  shipping_address?: any
  payment_method?: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  shipping_fee?: number
  discount_amount?: number
  notes?: string
  created_at: string
  updated_at: string
}

// 订单项信息类型
export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  updated_at: string
}

// 健康记录类型
export interface HealthRecord {
  id: string
  user_id: string
  doctor_id?: string
  device_id?: string
  type: string
  data: any
  notes?: string
  recorded_at: string
  created_at: string
  updated_at: string
}

// 评价信息类型
export interface Review {
  id: string
  user_id: string
  doctor_id: string
  consultation_id?: string
  rating: number
  comment?: string
  is_anonymous: boolean
  is_visible: boolean
  created_at: string
  updated_at: string
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
  totalOrders: number
  userGrowth: number
  doctorGrowth: number
  productGrowth: number
  orderGrowth: number
}