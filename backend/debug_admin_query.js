// 调试admin用户查询的脚本
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 初始化Supabase客户端
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugAdminQuery() {
  console.log('🔍 开始调试admin用户查询...');
  
  try {
    // 1. 查询所有admin_users数据
    console.log('\n1. 查询所有admin_users数据:');
    const { data: allUsers, error: allError } = await supabase
      .from('admin_users')
      .select('*');
    
    if (allError) {
      console.error('❌ 查询所有用户失败:', allError);
    } else {
      console.log('✅ 所有用户数据:', allUsers.length, '条记录');
      allUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.username} (${user.email}) - 激活状态: ${user.is_active}`);
      });
    }
    
    // 2. 查询username为admin的用户（不使用single()）
    console.log('\n2. 查询username为admin的用户:');
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', 'admin');
    
    if (adminError) {
      console.error('❌ 查询admin用户失败:', adminError);
    } else {
      console.log('✅ admin用户查询结果:', adminUsers.length, '条记录');
      adminUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}`);
        console.log(`     用户名: ${user.username}`);
        console.log(`     邮箱: ${user.email}`);
        console.log(`     密码哈希: ${user.password_hash.substring(0, 20)}...`);
        console.log(`     激活状态: ${user.is_active}`);
        console.log(`     角色: ${user.role}`);
        console.log('     ---');
      });
    }
    
    // 3. 查询激活的admin用户
    console.log('\n3. 查询激活的admin用户:');
    const { data: activeAdminUsers, error: activeError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', 'admin')
      .eq('is_active', true);
    
    if (activeError) {
      console.error('❌ 查询激活admin用户失败:', activeError);
    } else {
      console.log('✅ 激活的admin用户:', activeAdminUsers.length, '条记录');
      activeAdminUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.username} - 激活: ${user.is_active}`);
      });
    }
    
    // 4. 尝试使用single()查询
    console.log('\n4. 尝试使用single()查询:');
    try {
      const { data: singleAdmin, error: singleError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', 'admin')
        .eq('is_active', true)
        .single();
      
      if (singleError) {
        console.error('❌ single()查询失败:', singleError.message);
      } else {
        console.log('✅ single()查询成功:', singleAdmin.username);
      }
    } catch (error) {
      console.error('❌ single()查询异常:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  }
}

// 执行调试
debugAdminQuery().then(() => {
  console.log('\n🏁 调试完成');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 调试失败:', error);
  process.exit(1);
});