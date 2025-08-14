import express from 'express';
import { supabase } from '../utils/supabase';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * 获取设备列表
 * GET /api/devices
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      type = 'all',
      status = 'all',
      department = 'all'
    } = req.query;

    // 构建查询条件
    let query = supabase
      .from('devices')
      .select(`
        *,
        user:users(id, username, email)
      `);

    // 根据用户角色过滤数据
    if (req.user.role === 'user') {
      query = query.eq('user_id', req.user.id);
    }

    // 搜索条件
    if (search) {
      query = query.or(`device_name.ilike.%${search}%,model.ilike.%${search}%,serial_number.ilike.%${search}%,brand.ilike.%${search}%`);
    }

    // 设备类型过滤
    if (type !== 'all') {
      query = query.eq('device_type', type);
    }

    // 连接状态过滤
    if (status !== 'all') {
      query = query.eq('connection_status', status);
    }

    // 排序
    query = query.order('created_at', { ascending: false });

    // 分页
    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: devices, error, count } = await query;

    if (error) {
      console.error('获取设备列表错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取设备列表失败',
        error: error.message
      });
    }

    // 获取总数
    const { count: totalCount } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true });

    res.json({
      success: true,
      data: {
        devices: devices || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取设备列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取设备详情
 * GET /api/devices/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: device, error } = await supabase
      .from('devices')
      .select(`
        *,
        user:users(id, username, email)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取设备详情错误:', error);
      return res.status(404).json({
        success: false,
        message: '设备不存在'
      });
    }

    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    console.error('获取设备详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 创建设备
 * POST /api/devices
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      device_name,
      device_type,
      brand,
      model,
      serial_number,
      mac_address,
      device_id,
      firmware_version,
      hardware_version,
      connection_type = 'bluetooth',
      connection_status = 'disconnected',
      sync_frequency = 60,
      auto_sync = true,
      data_retention_days = 30,
      measurement_units,
      device_settings,
      purchase_date,
      warranty_expiry_date,
      manufacturer,
      country_of_origin,
      device_location,
      sharing_enabled = false,
      backup_enabled = true,
      notes
    } = req.body;

    // 验证必填字段
    if (!device_name || !device_type || !req.user?.id) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }

    // 检查序列号是否已存在
    const { data: existingDevice } = await supabase
      .from('devices')
      .select('id')
      .eq('serial_number', serial_number)
      .single();

    if (existingDevice) {
      return res.status(400).json({
        success: false,
        message: '该序列号已存在'
      });
    }

    // 创建设备
    const { data: device, error } = await supabase
      .from('devices')
      .insert({
        user_id: req.user.id,
        device_name,
        device_type,
        brand: brand || null,
        model: model || null,
        serial_number: serial_number || null,
        mac_address: mac_address || null,
        device_id: device_id || null,
        firmware_version: firmware_version || null,
        hardware_version: hardware_version || null,
        connection_type,
        connection_status,
        sync_frequency,
        auto_sync,
        data_retention_days,
        measurement_units: measurement_units || null,
        device_settings: device_settings || null,
        purchase_date: purchase_date || null,
        warranty_expiry_date: warranty_expiry_date || null,
        manufacturer: manufacturer || null,
        country_of_origin: country_of_origin || null,
        device_location: device_location || null,
        sharing_enabled,
        backup_enabled,
        notes: notes || null
      })
      .select(`
        *,
        user:users(id, username, email)
      `)
      .single();

    if (error) {
      console.error('创建设备错误:', error);
      return res.status(500).json({
        success: false,
        message: '创建设备失败',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: '设备创建成功',
      data: device
    });
  } catch (error) {
    console.error('创建设备错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 更新设备
 * PUT /api/devices/:id
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      device_name,
      device_type,
      model,
      manufacturer,
      serial_number,
      status,
      location,
      department_id,
      purchase_date,
      warranty_expiry,
      last_maintenance,
      next_maintenance,
      maintenance_interval,
      specifications,
      notes
    } = req.body;

    // 验证必填字段
    if (!device_name || !device_type || !model || !manufacturer || !serial_number || !location || !purchase_date) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }

    // 检查设备是否存在
    const { data: existingDevice } = await supabase
      .from('devices')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingDevice) {
      return res.status(404).json({
        success: false,
        message: '设备不存在'
      });
    }

    // 检查序列号是否被其他设备使用
    const { data: duplicateDevice } = await supabase
      .from('devices')
      .select('id')
      .eq('serial_number', serial_number)
      .neq('id', id)
      .single();

    if (duplicateDevice) {
      return res.status(400).json({
        success: false,
        message: '该序列号已被其他设备使用'
      });
    }

    // 更新设备
    const { data: device, error } = await supabase
      .from('devices')
      .update({
        device_name,
        device_type,
        model,
        manufacturer,
        serial_number,
        status,
        location,
        department_id: department_id || null,
        purchase_date,
        warranty_expiry: warranty_expiry || null,
        last_maintenance: last_maintenance || null,
        next_maintenance: next_maintenance || null,
        maintenance_interval,
        specifications: specifications || null,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        department:departments(id, name)
      `)
      .single();

    if (error) {
      console.error('更新设备错误:', error);
      return res.status(500).json({
        success: false,
        message: '更新设备失败',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: '设备更新成功',
      data: device
    });
  } catch (error) {
    console.error('更新设备错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 删除设备
 * DELETE /api/devices/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查设备是否存在
    const { data: existingDevice } = await supabase
      .from('devices')
      .select('id, device_name')
      .eq('id', id)
      .single();

    if (!existingDevice) {
      return res.status(404).json({
        success: false,
        message: '设备不存在'
      });
    }

    // 删除设备
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除设备错误:', error);
      return res.status(500).json({
        success: false,
        message: '删除设备失败',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: '设备删除成功'
    });
  } catch (error) {
    console.error('删除设备错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 批量更新设备状态
 * PATCH /api/devices/batch-status
 */
router.patch('/batch-status', authenticateToken, async (req, res) => {
  try {
    const { device_ids, status } = req.body;

    if (!device_ids || !Array.isArray(device_ids) || device_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的设备ID列表'
      });
    }

    if (!status || !['active', 'inactive', 'maintenance', 'repair', 'retired'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的设备状态'
      });
    }

    // 批量更新设备状态
    const { data: devices, error } = await supabase
      .from('devices')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .in('id', device_ids)
      .select('id, device_name, status');

    if (error) {
      console.error('批量更新设备状态错误:', error);
      return res.status(500).json({
        success: false,
        message: '批量更新设备状态失败',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: `成功更新 ${devices?.length || 0} 个设备的状态`,
      data: devices
    });
  } catch (error) {
    console.error('批量更新设备状态错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取设备统计信息
 * GET /api/devices/statistics
 */
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    // 获取设备总数和状态统计
    const { data: devices, error } = await supabase
      .from('devices')
      .select('status, next_maintenance');

    if (error) {
      console.error('获取设备统计错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取设备统计失败',
        error: error.message
      });
    }

    // 计算统计数据
    const total = devices?.length || 0;
    const active = devices?.filter(d => d.status === 'active').length || 0;
    const inactive = devices?.filter(d => d.status === 'inactive').length || 0;
    const maintenance = devices?.filter(d => d.status === 'maintenance').length || 0;
    const repair = devices?.filter(d => d.status === 'repair').length || 0;
    const retired = devices?.filter(d => d.status === 'retired').length || 0;

    // 计算需要维护的设备数量（7天内）
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const needMaintenance = devices?.filter(d => {
      if (!d.next_maintenance) return false;
      const nextMaintenance = new Date(d.next_maintenance);
      return nextMaintenance <= sevenDaysLater;
    }).length || 0;

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        maintenance,
        repair,
        retired,
        needMaintenance
      }
    });
  } catch (error) {
    console.error('获取设备统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取维护提醒列表
 * GET /api/devices/maintenance-alerts
 */
router.get('/maintenance-alerts', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // 获取需要维护的设备
    const now = new Date();
    const alertDate = new Date(now.getTime() + Number(days) * 24 * 60 * 60 * 1000);

    const { data: devices, error } = await supabase
      .from('devices')
      .select(`
        id,
        device_name,
        model,
        serial_number,
        location,
        next_maintenance,
        last_maintenance,
        maintenance_interval,
        department:departments(id, name)
      `)
      .not('next_maintenance', 'is', null)
      .lte('next_maintenance', alertDate.toISOString())
      .eq('status', 'active')
      .order('next_maintenance', { ascending: true });

    if (error) {
      console.error('获取维护提醒错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取维护提醒失败',
        error: error.message
      });
    }

    // 分类设备：已过期、即将到期
    const overdue = [];
    const upcoming = [];

    devices?.forEach(device => {
      const nextMaintenance = new Date(device.next_maintenance);
      if (nextMaintenance < now) {
        overdue.push(device);
      } else {
        upcoming.push(device);
      }
    });

    res.json({
      success: true,
      data: {
        overdue,
        upcoming,
        total: devices?.length || 0
      }
    });
  } catch (error) {
    console.error('获取维护提醒错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;