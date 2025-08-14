// 修复设备管理API问题的脚本
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://arazxebdefxtciszqnih.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyYXp4ZWJkZWZ4dGNpc3pxbmloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYzODY5OCwiZXhwIjoyMDcwMjE0Njk4fQ.OLqzEwOojR586dDGguoGfrAMTlexq9JiLk_Gm8gHYMY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDevicesAPI() {
  console.log('🔧 开始修复设备管理API...');
  
  try {
    // 1. 检查devices表是否存在数据
    console.log('📊 检查devices表数据...');
    const { data: devices, error: devicesError, count } = await supabase
      .from('devices')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (devicesError) {
      console.error('❌ devices表查询失败:', devicesError.message);
      return;
    }
    
    console.log('✅ devices表查询成功，当前设备数量:', count);
    
    if (count === 0) {
      console.log('📝 数据库中没有设备数据，开始插入测试数据...');
      
      // 获取第一个用户ID
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (usersError || !users || users.length === 0) {
        console.error('❌ 无法获取用户数据:', usersError?.message || '没有用户');
        return;
      }
      
      const userId = users[0].id;
      console.log('👤 使用用户ID:', userId);
      
      // 插入测试设备数据
      const testDevices = [
        {
          user_id: userId,
          device_name: 'CT扫描仪-001',
          device_type: 'imaging',
          brand: 'GE Healthcare',
          model: 'Revolution CT',
          serial_number: 'CT001-2024',
          manufacturer: 'GE Healthcare',
          device_location: '影像科CT室1',
          purchase_date: '2022-03-15',
          warranty_expiry_date: '2027-03-15',
          connection_type: 'ethernet',
          connection_status: 'connected',
          sync_frequency: 60,
          auto_sync: true,
          data_retention_days: 365,
          sharing_enabled: false,
          backup_enabled: true,
          notes: '高端CT设备，用于全身扫描检查',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          user_id: userId,
          device_name: 'MRI核磁共振-001',
          device_type: 'imaging',
          brand: 'Siemens',
          model: 'MAGNETOM Skyra 3T',
          serial_number: 'MRI001-2024',
          manufacturer: 'Siemens Healthineers',
          device_location: '影像科MRI室',
          purchase_date: '2021-08-20',
          warranty_expiry_date: '2026-08-20',
          connection_type: 'ethernet',
          connection_status: 'connected',
          sync_frequency: 120,
          auto_sync: true,
          data_retention_days: 365,
          sharing_enabled: false,
          backup_enabled: true,
          notes: '3.0T高场强MRI，适用于神经、骨骼等检查',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          user_id: userId,
          device_name: 'X光机-001',
          device_type: 'imaging',
          brand: 'Philips',
          model: 'DigitalDiagnost C90',
          serial_number: 'XR001-2024',
          manufacturer: 'Philips',
          device_location: '影像科X光室1',
          purchase_date: '2023-01-10',
          warranty_expiry_date: '2028-01-10',
          connection_type: 'ethernet',
          connection_status: 'connected',
          sync_frequency: 30,
          auto_sync: true,
          data_retention_days: 180,
          sharing_enabled: false,
          backup_enabled: true,
          notes: '数字化X光摄影系统，支持多种检查',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const { data: insertedDevices, error: insertError } = await supabase
        .from('devices')
        .insert(testDevices)
        .select();
      
      if (insertError) {
        console.error('❌ 插入测试设备失败:', insertError.message);
        return;
      }
      
      console.log('✅ 成功插入', insertedDevices?.length || 0, '个测试设备');
    } else {
      console.log('ℹ️ 数据库中已有设备数据，跳过插入');
    }
    
    // 2. 测试设备API查询
    console.log('🧪 测试设备API查询...');
    const { data: testDevices, error: testError } = await supabase
      .from('devices')
      .select(`
        *,
        user:users(id, nick_name, real_name, phone)
      `)
      .limit(5);
    
    if (testError) {
      console.error('❌ 设备API测试失败:', testError.message);
      return;
    }
    
    console.log('✅ 设备API测试成功，返回', testDevices?.length || 0, '个设备');
    
    if (testDevices && testDevices.length > 0) {
      console.log('📋 第一个设备信息:');
      console.log('  - ID:', testDevices[0].id);
      console.log('  - 设备名称:', testDevices[