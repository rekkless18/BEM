import { supabase, TABLES, handleSupabaseError } from '../utils/supabase';
import type { User, Doctor, Department, Product, AdminUser, Article, CarouselImage, Device } from '../types';

// 通用分页参数接口
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: any;
}

// 通用API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  total?: number;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// 通用查询构建器
const buildQuery = (tableName: string, params?: PaginationParams) => {
  let query = supabase.from(tableName).select('*', { count: 'exact' });
  
  // 搜索字段配置
  const searchFields: Record<string, string[]> = {
    admins: ['username', 'email', 'name'],
    doctors: ['name', 'title', 'department'],
    patients: ['name', 'phone', 'id_number'],
    users: ['name', 'username', 'email', 'phone'],
    devices: ['name', 'model', 'manufacturer'],
    appointments: ['patient_name', 'doctor_name'],
    medical_records: ['diagnosis', 'symptoms'],
    prescriptions: ['medication_name'],
    products: ['name', 'brand', 'model'],
    carousel_images: ['title', 'description'],
    articles: ['title', 'content']
  };
  
  // 添加搜索条件
  if (params?.search) {
    // 根据不同表添加不同的搜索字段
    switch (tableName) {
      case TABLES.ADMIN_USERS:
        query = query.or(`username.ilike.%${params.search}%,email.ilike.%${params.search}%,name.ilike.%${params.search}%`);
        break;
      case TABLES.DOCTORS:
        query = query.or(`name.ilike.%${params.search}%,title.ilike.%${params.search}%,department.ilike.%${params.search}%`);
        break;
      case TABLES.DEPARTMENTS:
        query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
        break;
      case TABLES.PRODUCTS:
        query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%,brand.ilike.%${params.search}%`);
        break;
      case TABLES.ARTICLES:
        query = query.or(`title.ilike.%${params.search}%,content.ilike.%${params.search}%,author.ilike.%${params.search}%`);
        break;
      case TABLES.CAROUSEL_IMAGES:
        query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
        break;
      case 'users':
        query = query.or(`name.ilike.%${params.search}%,username.ilike.%${params.search}%,email.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
        break;
      case 'devices':
        query = query.or(`name.ilike.%${params.search}%,model.ilike.%${params.search}%,manufacturer.ilike.%${params.search}%`);
        break;
      default:
        // 默认搜索name字段
        query = query.ilike('name', `%${params.search}%`);
    }
  }
  
  // 添加其他筛选条件
  Object.keys(params || {}).forEach(key => {
    if (key !== 'search' && key !== 'page' && key !== 'limit' && params![key] !== undefined && params![key] !== '') {
      query = query.eq(key, params![key]);
    }
  });
  
  // 添加分页
  if (params?.page && params?.limit) {
    const from = (params.page - 1) * params.limit;
    const to = from + params.limit - 1;
    query = query.range(from, to);
  }
  
  // 添加排序
  query = query.order('created_at', { ascending: false });
  
  return query;
};

// 用户管理API
export const userApi = {
  // 获取用户列表
  getList: async (params?: PaginationParams): Promise<ApiResponse<User[]>> => {
    try {
      const { data, error, count } = await buildQuery('users', params);
      
      if (error) {
        return {
          success: false,
          data: [],
          message: handleSupabaseError(error),
          total: 0
        };
      }
      
      return {
        success: true,
        data: data || [],
        message: '获取用户列表成功',
        total: count || 0,
        pagination: {
           page: params?.page || 1,
           pageSize: params?.limit || 10,
           total: count || 0
         }
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: handleSupabaseError(error),
        total: 0
      };
    }
  },
  
  // 获取用户详情
  getById: async (id: string): Promise<ApiResponse<User>> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '获取用户详情成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 创建用户
  create: async (userData: Partial<User>): Promise<ApiResponse<User>> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '创建用户成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 更新用户
  update: async (id: string, userData: Partial<User>): Promise<ApiResponse<User>> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ ...userData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '更新用户成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 删除用户
  delete: async (id: string): Promise<ApiResponse<null>> => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data: null,
        message: '删除用户成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  }
};

// 医生管理API
export const doctorApi = {
  // 获取医生列表
  getList: async (params?: PaginationParams): Promise<ApiResponse<Doctor[]>> => {
    try {
      const { data, error, count } = await buildQuery(TABLES.DOCTORS, params);
      
      if (error) {
        return {
          success: false,
          data: [],
          message: handleSupabaseError(error),
          total: 0
        };
      }
      
      return {
        success: true,
        data: data || [],
        message: '获取医生列表成功',
        total: count || 0,
        pagination: {
          page: params?.page || 1,
          pageSize: params?.limit || 10,
          total: count || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: handleSupabaseError(error),
        total: 0
      };
    }
  },
  
  // 获取医生详情
  getById: async (id: string): Promise<ApiResponse<Doctor>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.DOCTORS)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '获取医生详情成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 创建医生
  create: async (doctorData: Partial<Doctor>): Promise<ApiResponse<Doctor>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.DOCTORS)
        .insert([doctorData])
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '创建医生成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 更新医生
  update: async (id: string, doctorData: Partial<Doctor>): Promise<ApiResponse<Doctor>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.DOCTORS)
        .update({ ...doctorData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '更新医生成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 删除医生
  delete: async (id: string): Promise<ApiResponse<null>> => {
    try {
      const { error } = await supabase
        .from(TABLES.DOCTORS)
        .delete()
        .eq('id', id);
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data: null,
        message: '删除医生成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  }
};

// 科室管理API
export const departmentApi = {
  // 获取科室列表
  getList: async (params?: PaginationParams): Promise<ApiResponse<Department[]>> => {
    try {
      const { data, error, count } = await buildQuery(TABLES.DEPARTMENTS, params);
      
      if (error) {
        return {
          success: false,
          data: [],
          message: handleSupabaseError(error),
          total: 0
        };
      }
      
      return {
          success: true,
          data: data || [],
          message: '获取科室列表成功',
          total: count || 0,
          pagination: {
            page: params?.page || 1,
            pageSize: params?.limit || 10,
            total: count || 0
          }
        };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: handleSupabaseError(error),
        total: 0
      };
    }
  },
  
  // 获取科室详情
  getById: async (id: string): Promise<ApiResponse<Department>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.DEPARTMENTS)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '获取科室详情成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 创建科室
  create: async (departmentData: Partial<Department>): Promise<ApiResponse<Department>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.DEPARTMENTS)
        .insert([departmentData])
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '创建科室成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 更新科室
  update: async (id: string, departmentData: Partial<Department>): Promise<ApiResponse<Department>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.DEPARTMENTS)
        .update({ ...departmentData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '更新科室成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 删除科室
  delete: async (id: string): Promise<ApiResponse<null>> => {
    try {
      const { error } = await supabase
        .from(TABLES.DEPARTMENTS)
        .delete()
        .eq('id', id);
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data: null,
        message: '删除科室成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  }
};

// 商品管理API
export const productApi = {
  // 获取商品列表
  getList: async (params?: PaginationParams): Promise<ApiResponse<Product[]>> => {
    try {
      const { data, error, count } = await buildQuery(TABLES.PRODUCTS, params);
      
      if (error) {
        return {
          success: false,
          data: [],
          message: handleSupabaseError(error),
          total: 0
        };
      }
      
      return {
        success: true,
        data: data || [],
        message: '获取商品列表成功',
        total: count || 0
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: handleSupabaseError(error),
        total: 0
      };
    }
  },
  
  // 获取商品详情
  getById: async (id: string): Promise<ApiResponse<Product>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '获取商品详情成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 创建商品
  create: async (productData: Partial<Product>): Promise<ApiResponse<Product>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .insert([productData])
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '创建商品成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 更新商品
  update: async (id: string, productData: Partial<Product>): Promise<ApiResponse<Product>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .update({ ...productData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '更新商品成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 删除商品
  delete: async (id: string): Promise<ApiResponse<null>> => {
    try {
      const { error } = await supabase
        .from(TABLES.PRODUCTS)
        .delete()
        .eq('id', id);
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data: null,
        message: '删除商品成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  }
};

// 管理员管理API
export const adminApi = {
  // 获取管理员列表
  getList: async (params?: PaginationParams): Promise<ApiResponse<AdminUser[]>> => {
    try {
      const { data, error, count } = await buildQuery(TABLES.ADMIN_USERS, params);
      
      if (error) {
        return {
          success: false,
          data: [],
          message: handleSupabaseError(error),
          total: 0
        };
      }
      
      return {
        success: true,
        data: data || [],
        message: '获取管理员列表成功',
        total: count || 0
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: handleSupabaseError(error),
        total: 0
      };
    }
  },
  
  // 获取管理员详情
  getById: async (id: string): Promise<ApiResponse<AdminUser>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.ADMIN_USERS)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '获取管理员详情成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 创建管理员
  create: async (adminData: Partial<AdminUser>): Promise<ApiResponse<AdminUser>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.ADMIN_USERS)
        .insert([adminData])
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '创建管理员成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 更新管理员
  update: async (id: string, adminData: Partial<AdminUser>): Promise<ApiResponse<AdminUser>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.ADMIN_USERS)
        .update({ ...adminData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '更新管理员成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 删除管理员
  delete: async (id: string): Promise<ApiResponse<null>> => {
    try {
      const { error } = await supabase
        .from(TABLES.ADMIN_USERS)
        .delete()
        .eq('id', id);
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data: null,
        message: '删除管理员成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 重置密码
  resetPassword: async (id: string, newPassword: string): Promise<ApiResponse<null>> => {
    try {
      // 注意：在实际应用中，密码应该在后端进行哈希处理
      // 这里只是示例，实际应该调用后端API
      const { data, error } = await supabase
        .from(TABLES.ADMIN_USERS)
        .update({ password_hash: newPassword, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data: null,
        message: '重置密码成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 获取权限列表（模拟数据）
  getPermissions: async (): Promise<ApiResponse<any[]>> => {
    return {
      success: true,
      data: [
        { id: '1', name: 'user_management', label: '用户管理' },
        { id: '2', name: 'doctor_management', label: '医生管理' },
        { id: '3', name: 'department_management', label: '科室管理' },
        { id: '4', name: 'product_management', label: '商品管理' },
        { id: '5', name: 'article_management', label: '文章管理' },
        { id: '6', name: 'carousel_management', label: '轮播图管理' },
        { id: '7', name: 'system_management', label: '系统管理' }
      ],
      message: '获取权限列表成功'
    };
  },
  
  // 获取角色列表（模拟数据）
  getRoles: async (): Promise<ApiResponse<any[]>> => {
    return {
      success: true,
      data: [
        { id: '1', name: 'super_admin', label: '超级管理员' },
        { id: '2', name: 'medical_admin', label: '医疗管理员' },
        { id: '3', name: 'mall_admin', label: '商城管理员' },
        { id: '4', name: 'marketing_admin', label: '营销管理员' },
        { id: '5', name: 'admin', label: '普通管理员' }
      ],
      message: '获取角色列表成功'
    };
  }
};

// 文章管理API
export const articleApi = {
  // 获取文章列表
  getList: async (params?: PaginationParams): Promise<ApiResponse<Article[]>> => {
    try {
      const { data, error, count } = await buildQuery(TABLES.ARTICLES, params);
      
      if (error) {
        return {
          success: false,
          data: [],
          message: handleSupabaseError(error),
          total: 0
        };
      }
      
      return {
        success: true,
        data: data || [],
        message: '获取文章列表成功',
        total: count || 0
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: handleSupabaseError(error),
        total: 0
      };
    }
  },
  
  // 获取文章详情
  getById: async (id: string): Promise<ApiResponse<Article>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.ARTICLES)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '获取文章详情成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 创建文章
  create: async (articleData: Partial<Article>): Promise<ApiResponse<Article>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.ARTICLES)
        .insert([articleData])
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '创建文章成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 更新文章
  update: async (id: string, articleData: Partial<Article>): Promise<ApiResponse<Article>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.ARTICLES)
        .update({ ...articleData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '更新文章成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 删除文章
  delete: async (id: string): Promise<ApiResponse<null>> => {
    try {
      const { error } = await supabase
        .from(TABLES.ARTICLES)
        .delete()
        .eq('id', id);
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data: null,
        message: '删除文章成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  }
};

// 轮播图管理API
export const carouselApi = {
  // 获取轮播图列表
  getList: async (params?: PaginationParams): Promise<ApiResponse<CarouselImage[]>> => {
    try {
      const { data, error, count } = await buildQuery(TABLES.CAROUSEL_IMAGES, params);
      
      if (error) {
        return {
          success: false,
          data: [],
          message: handleSupabaseError(error),
          total: 0
        };
      }
      
      return {
        success: true,
        data: data || [],
        message: '获取轮播图列表成功',
        total: count || 0
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: handleSupabaseError(error),
        total: 0
      };
    }
  },
  
  // 获取轮播图详情
  getById: async (id: string): Promise<ApiResponse<CarouselImage>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CAROUSEL_IMAGES)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '获取轮播图详情成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 创建轮播图
  create: async (carouselData: Partial<CarouselImage>): Promise<ApiResponse<CarouselImage>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CAROUSEL_IMAGES)
        .insert([carouselData])
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '创建轮播图成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 更新轮播图
  update: async (id: string, carouselData: Partial<CarouselImage>): Promise<ApiResponse<CarouselImage>> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CAROUSEL_IMAGES)
        .update({ ...carouselData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '更新轮播图成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 删除轮播图
  delete: async (id: string): Promise<ApiResponse<null>> => {
    try {
      const { error } = await supabase
        .from(TABLES.CAROUSEL_IMAGES)
        .delete()
        .eq('id', id);
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data: null,
        message: '删除轮播图成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  }
};

// 设备管理API
export const deviceApi = {
  // 获取设备列表
  getList: async (params?: PaginationParams): Promise<ApiResponse<Device[]>> => {
    try {
      const { data, error, count } = await buildQuery('devices', params);
      
      if (error) {
        return {
          success: false,
          data: [],
          message: handleSupabaseError(error),
          total: 0
        };
      }
      
      return {
        success: true,
        data: data || [],
        message: '获取设备列表成功',
        total: count || 0
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: handleSupabaseError(error),
        total: 0
      };
    }
  },
  
  // 获取设备详情
  getById: async (id: string): Promise<ApiResponse<Device>> => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '获取设备详情成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 创建设备
  create: async (deviceData: Partial<Device>): Promise<ApiResponse<Device>> => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .insert([deviceData])
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '创建设备成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 更新设备
  update: async (id: string, deviceData: Partial<Device>): Promise<ApiResponse<Device>> => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .update({ ...deviceData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data,
        message: '更新设备成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  },
  
  // 删除设备
  delete: async (id: string): Promise<ApiResponse<null>> => {
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id);
      
      if (error) {
        return {
          success: false,
          data: null,
          message: handleSupabaseError(error)
        };
      }
      
      return {
        success: true,
        data: null,
        message: '删除设备成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: handleSupabaseError(error)
      };
    }
  }
};