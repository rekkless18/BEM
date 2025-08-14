// 调试和修复admin用户的脚本
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

// 初始化Supabase客户端
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugAdminUser() {
  try {
    console.log('🔍 检查admin用户数据...');
    
    // 查询所有admin_users
    const { data: users, error: queryError } = await supabase
      .from('admin_users')
      .select('*');
    
    if (queryError) {
      console.error('❌ 查询用户失败:', queryError);
      return;
    }
    
    console.log('📊 所有用户数据:');
    users.forEach(user => {
      console.log({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        password_hash: user.password_hash,
        created_at: user.created_at
      });
    });
    
    // 查找admin用户
    const adminUser = users.find(u => u.username === 'admin');
    
    if (!adminUser) {
      console.log('❌ 未找到admin用户，创建新的admin用户...');
      await createAdminUser();
    } else {
      console.log('✅ 找到admin用户:', adminUser.username);
      
      // 测试当前密码哈希
      const testPassword = 'admin123';
      const isValid = await bcrypt.compare(testPassword, adminUser.password_hash);
      console.log(`🔑 密码 "${testPassword}" 验证结果:`, isValid);
      
      if (!isValid) {
        console.log('🔧 密码哈希不正确，更新密码...');
        await updateAdminPassword(adminUser.id);
      }
    }
    
  } catch (error) {
    console.error('💥 脚本执行失败:', error);
  }
}

async function createAdminUser() {
  try {
    const saltRounds = 10;
    const password_hash = await bcrypt.hash('admin123', saltRounds);
    
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        username: 'admin',
        email: 'admin@bem.com',
        password_hash,
        name: '系统管理员',
        role: 'super_admin',
        is_active: true
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ 创建admin用户失败:', error);
    } else {
      console.log('✅ 成功创建admin用户:', data);
    }
  } catch (error) {
    console.error('💥 创建用户时出错:', error);
  }
}

async function updateAdminPassword(userId) {
  try {
    const saltRounds = 10;
    const password_hash = await bcrypt.hash('admin123', saltRounds);
    
    const { data, error } = await supabase
      .from('admin_users')
      .update({ password_hash })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ 更新密码失败:', error);
    } else {
      console.log('✅ 成功更新admin密码');
      
      // 再次验证
      const isValid = await bcrypt.compare('admin123', password_hash);
      console.log('🔑 新密码验证结果:', isValid);
    }
  } catch (error) {
    console.error('💥 更新密码时出错:', error);
  }
}

// 运行调试脚本
debugAdminUser();