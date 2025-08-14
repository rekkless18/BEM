// 测试用户API的脚本 - 测试完整的API流程
async function testUserAPI() {
  try {
    console.log('🔍 测试完整的用户API流程...');
    
    // 首先尝试登录获取token
    console.log('1. 尝试登录...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'password'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('登录响应:', loginData);
    
    if (loginData.success) {
      const token = loginData.data.token;
      console.log('✅ 登录成功，获取到token');
      
      // 使用token获取用户列表
      console.log('2. 获取用户列表...');
      const usersResponse = await fetch('http://localhost:5000/api/users?page=1&limit=5', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const usersData = await usersResponse.json();
      
      console.log('✅ 用户列表API响应:');
      console.log('响应状态:', usersResponse.status);
      console.log('响应数据结构:', JSON.stringify(usersData, null, 2));
      
      if (usersData.success && usersData.data.users) {
        console.log('\n📊 映射后的用户数据详情:');
        usersData.data.users.forEach((user, index) => {
          console.log(`用户 ${index + 1}:`);
          console.log('  - ID:', user.id);
          console.log('  - 用户名 (username):', user.username);
          console.log('  - 姓名 (name):', user.name);
          console.log('  - 邮箱 (email):', user.email);
          console.log('  - 手机号 (phone):', user.phone);
          console.log('  - 角色 (role):', user.role);
          console.log('  - 系统类型 (system_type):', user.system_type);
          console.log('  - 状态 (is_active):', user.is_active);
          console.log('  - 头像 (avatar_url):', user.avatar_url);
          console.log('  - 最后登录 (last_login_at):', user.last_login_at);
          console.log('  - 创建时间 (created_at):', user.created_at);
          console.log('  ---');
        });
        
        console.log('\n🔍 前端字段值分析:');
        console.log('username 有值的用户数:', usersData.data.users.filter(u => u.username && u.username.trim()).length);
        console.log('name 有值的用户数:', usersData.data.users.filter(u => u.name && u.name.trim()).length);
        console.log('email 有值的用户数:', usersData.data.users.filter(u => u.email && u.email.trim()).length);
        console.log('phone 有值的用户数:', usersData.data.users.filter(u => u.phone && u.phone.trim()).length);
      }
    } else {
      console.log('❌ 登录失败:', loginData.message);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testUserAPI();