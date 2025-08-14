import { supabase } from './src/config/supabase.ts';
import bcrypt from 'bcrypt';

async function testBackendLogin() {
  try {
    console.log('🔍 使用后端相同的Supabase配置测试登录...');
    
    const username = 'admin';
    const password = 'admin123';
    
    console.log('🔐 登录请求:', { username, passwordLength: password.length });
    console.log('🔍 查询用户:', username);
    
    // 使用与后端完全相同的查询
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    console.log('📊 数据库查询结果:', { 
      found: !!admin, 
      error: error?.message,
      adminId: admin?.id,
      adminUsername: admin?.username,
      isActive: admin?.is_active,
      passwordHashLength: admin?.password_hash?.length
    });

    if (error || !admin) {
      console.log('❌ 用户不存在或查询失败:', error?.message);
      return;
    }

    // 验证密码
    console.log('🔑 验证密码:', { 
      inputPassword: password,
      storedHash: admin.password_hash
    });
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    console.log('✅ 密码验证结果:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ 密码验证失败');
      return;
    }
    
    console.log('🎉 登录测试成功！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testBackendLogin();