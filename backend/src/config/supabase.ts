import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// Supabase配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('缺少Supabase配置：SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 环境变量是必需的');
}

// 创建Supabase客户端（使用服务角色密钥，用于后端操作）
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 导出配置信息
export const supabaseConfig = {
  url: supabaseUrl,
  serviceKey: supabaseServiceKey,
};

// 测试数据库连接
export const testConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase连接测试失败:', error.message);
      return false;
    }
    
    console.log('Supabase连接测试成功');
    return true;
  } catch (error) {
    console.error('Supabase连接测试异常:', error);
    return false;
  }
};