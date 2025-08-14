import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase配置缺失');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminStatus() {
  try {
    console.log('🔍 检查admin用户的is_active状态...');
    
    // 查询admin用户的详细信息
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', 'admin');
    
    if (error) {
      console.error('❌ 查询错误:', error);
      return;
    }
    
    console.log('📊 admin用户详细信息:');
    console.log(JSON.stringify(admin, null, 2));
    
    if (admin && admin.length > 0) {
      admin.forEach((user, index) => {
        console.log(`\n👤 用户 ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  用户名: ${user.username}`);
        console.log(`  邮箱: ${user.email}`);
        console.log(`  是否激活: ${user.is_active}`);
        console.log(`  角色: ${user.role}`);
        console.log(`  创建时间: ${user.created_at}`);
      });
    }
    
    // 测试完整的登录查询
    console.log('\n🔍 测试完整的登录查询...');
    const { data: loginTest, error: loginError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', 'admin')
      .eq('is_active', true)
      .single();
    
    if (loginError) {
      console.error('❌ 登录查询错误:', loginError.message);
    } else {
      console.log('✅ 登录查询成功:', {
        id: loginTest.id,
        username: loginTest.username,
        is_active: loginTest.is_active
      });
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

checkAdminStatus();