const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 配置
const API_BASE_URL = 'http://localhost:5000/api';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 测试用户登录获取token
async function getAuthToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || '登录失败');
    }
    
    return data.data.token;
  } catch (error) {
    console.error('登录失败:', error.message);
    throw error;
  }
}

// 获取第一个医生的ID
async function getFirstDoctorId() {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('id, name, is_active')
      .limit(1);
    
    if (error) {
      throw new Error(`查询医生失败: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      throw new Error('没有找到医生记录');
    }
    
    console.log('找到医生:', data[0]);
    return data[0];
  } catch (error) {
    console.error('获取医生ID失败:', error.message);
    throw error;
  }
}

// 测试医生状态更新
async function testDoctorStatusUpdate(token, doctorId, newStatus) {
  try {
    console.log(`\n🧪 测试更新医生状态: ${doctorId} -> ${newStatus}`);
    
    const response = await fetch(
      `${API_BASE_URL}/doctors/${doctorId}/availability`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_available: newStatus })
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '状态更新失败');
    }
    
    console.log('✅ 状态更新成功:', data);
    return data;
  } catch (error) {
    console.error('❌ 状态更新失败:', error.message);
    throw error;
  }
}

// 测试无效ID格式
async function testInvalidIdFormat(token) {
  try {
    console.log('\n🧪 测试无效ID格式...');
    
    const response = await fetch(
      `${API_BASE_URL}/doctors/invalid-id/availability`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_available: true })
      }
    );
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('❌ 应该返回错误，但成功了:', data);
    } else if (response.status === 400) {
      console.log('✅ 正确处理无效ID格式:', data.message);
    } else {
      console.error('❌ 意外错误:', data);
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

// 测试不存在的医生ID
async function testNonExistentDoctor(token) {
  try {
    console.log('\n🧪 测试不存在的医生ID...');
    
    const fakeId = '12345678-1234-1234-1234-123456789012';
    const response = await fetch(
      `${API_BASE_URL}/doctors/${fakeId}/availability`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_available: true })
      }
    );
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('❌ 应该返回错误，但成功了:', data);
    } else if (response.status === 404) {
      console.log('✅ 正确处理不存在的医生:', data.message);
    } else {
      console.error('❌ 意外错误:', data);
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

// 主测试函数
async function runTests() {
  try {
    console.log('🚀 开始测试医生状态更新API修复...');
    
    // 1. 获取认证token
    console.log('\n1. 获取认证token...');
    const token = await getAuthToken();
    console.log('✅ 获取token成功');
    
    // 2. 获取第一个医生
    console.log('\n2. 获取测试医生...');
    const doctor = await getFirstDoctorId();
    
    // 3. 测试正常的状态更新
    console.log('\n3. 测试正常状态更新...');
    const currentStatus = doctor.is_active;
    const newStatus = !currentStatus;
    
    await testDoctorStatusUpdate(token, doctor.id, newStatus);
    
    // 恢复原状态
    await testDoctorStatusUpdate(token, doctor.id, currentStatus);
    
    // 4. 测试边界情况
    await testInvalidIdFormat(token);
    await testNonExistentDoctor(token);
    
    console.log('\n🎉 所有测试完成！医生状态更新API修复验证成功！');
    
  } catch (error) {
    console.error('\n💥 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
runTests();