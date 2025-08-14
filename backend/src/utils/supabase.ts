import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

// Supabase配置
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

// 创建Supabase客户端（使用匿名密钥）
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// 创建Supabase管理客户端（使用服务角色密钥）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// 数据库表名常量
export const TABLES = {
  ADMIN_USERS: 'admin_users',
  DOCTORS: 'doctors',
  DEPARTMENTS: 'departments',
  PRODUCTS: 'products',
  BANNERS: 'banners',
  ARTICLES: 'articles',
} as const

// 错误处理函数
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  
  if (error?.code === 'PGRST116') {
    return {
      success: false,
      message: '数据不存在',
      error: 'Not found',
    }
  }
  
  if (error?.code === '23505') {
    return {
      success: false,
      message: '数据已存在',
      error: 'Duplicate entry',
    }
  }
  
  if (error?.code === '23503') {
    return {
      success: false,
      message: '关联数据不存在',
      error: 'Foreign key constraint',
    }
  }
  
  return {
    success: false,
    message: error?.message || '数据库操作失败',
    error: error?.code || 'Database error',
  }
}

// 检查Supabase连接
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection failed:', error)
      return false
    }
    
    console.log('Supabase connection successful')
    return true
  } catch (error) {
    console.error('Supabase connection error:', error)
    return false
  }
}

// 分页查询辅助函数
export const getPaginatedData = async (
  tableName: string,
  page: number = 1,
  pageSize: number = 10,
  searchColumn?: string,
  searchValue?: string,
  sortColumn?: string,
  sortOrder: 'asc' | 'desc' = 'desc'
) => {
  try {
    let query = supabase.from(tableName).select('*', { count: 'exact' })
    
    // 添加搜索条件
    if (searchColumn && searchValue) {
      query = query.ilike(searchColumn, `%${searchValue}%`)
    }
    
    // 添加排序
    if (sortColumn) {
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' })
    }
    
    // 添加分页
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) {
      return handleSupabaseError(error)
    }
    
    return {
      success: true,
      data: {
        items: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    }
  } catch (error) {
    return handleSupabaseError(error)
  }
}