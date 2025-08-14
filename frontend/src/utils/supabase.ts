import { createClient } from '@supabase/supabase-js'

// Supabase配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// 数据库表名常量
export const TABLES = {
  ADMIN_USERS: 'admin_users',
  DOCTORS: 'doctors',
  DEPARTMENTS: 'departments',
  PRODUCTS: 'products',
  CAROUSEL_IMAGES: 'carousel_images',
  ARTICLES: 'articles',
  USERS: 'users',
  DEVICES: 'devices',
  CONSULTATIONS: 'consultations',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  HEALTH_RECORDS: 'health_records',
  REVIEWS: 'reviews',
} as const

// Supabase错误处理
export const handleSupabaseError = (error: any) => {
  console.error('Supabase Error:', error)
  
  if (error?.message) {
    return error.message
  }
  
  return '操作失败，请稍后重试'
}

// 检查Supabase连接状态
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase
      .from(TABLES.ADMIN_USERS)
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection failed:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Supabase connection error:', error)
    return false
  }
}