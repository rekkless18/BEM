import express from 'express';
import { supabase } from '../utils/supabase';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * 获取健康档案列表
 * GET /api/health-records
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      user_id = 'all',
      record_type = 'all',
      start_date = '',
      end_date = ''
    } = req.query;

    // 构建查询条件
    let query = supabase
      .from('health_records')
      .select(`
        *,
        user:users(id, username, email, phone, avatar_url)
      `);

    // 搜索条件
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,diagnosis.ilike.%${search}%`);
    }

    // 用户过滤
    if (user_id !== 'all') {
      query = query.eq('user_id', user_id);
    }

    // 记录类型过滤
    if (record_type !== 'all') {
      query = query.eq('record_type', record_type);
    }

    // 日期范围过滤
    if (start_date) {
      query = query.gte('record_date', start_date);
    }
    if (end_date) {
      query = query.lte('record_date', end_date);
    }

    // 排序
    query = query.order('record_date', { ascending: false });

    // 分页
    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: healthRecords, error, count } = await query;

    if (error) {
      console.error('获取健康档案列表错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取健康档案列表失败',
        error: error.message
      });
    }

    // 获取总数
    const { count: totalCount } = await supabase
      .from('health_records')
      .select('*', { count: 'exact', head: true });

    res.json({
      success: true,
      data: {
        healthRecords: healthRecords || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取健康档案列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取健康档案详情
 * GET /api/health-records/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: healthRecord, error } = await supabase
      .from('health_records')
      .select(`
        *,
        user:users(id, username, email, phone, avatar_url, birth_date, gender)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取健康档案详情错误:', error);
      return res.status(404).json({
        success: false,
        message: '健康档案不存在'
      });
    }

    res.json({
      success: true,
      data: healthRecord
    });
  } catch (error) {
    console.error('获取健康档案详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 创建健康档案
 * POST /api/health-records
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      user_id,
      title,
      description,
      record_type = 'general',
      record_date,
      diagnosis,
      symptoms,
      treatment,
      medications,
      vital_signs,
      lab_results,
      attachments,
      notes
    } = req.body;

    // 验证必填字段
    if (!user_id || !title || !description || !record_date) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }

    // 验证用户是否存在
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (!user) {
      return res.status(400).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 创建健康档案
    const { data: healthRecord, error } = await supabase
      .from('health_records')
      .insert({
        user_id,
        title,
        description,
        record_type,
        record_date,
        diagnosis: diagnosis || null,
        symptoms: symptoms || null,
        treatment: treatment || null,
        medications: medications || null,
        vital_signs: vital_signs || null,
        lab_results: lab_results || null,
        attachments: attachments || null,
        notes: notes || null
      })
      .select(`
        *,
        user:users(id, username, email, phone)
      `)
      .single();

    if (error) {
      console.error('创建健康档案错误:', error);
      return res.status(500).json({
        success: false,
        message: '创建健康档案失败',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: '健康档案创建成功',
      data: healthRecord
    });
  } catch (error) {
    console.error('创建健康档案错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 更新健康档案
 * PUT /api/health-records/:id
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      record_type,
      record_date,
      diagnosis,
      symptoms,
      treatment,
      medications,
      vital_signs,
      lab_results,
      attachments,
      notes
    } = req.body;

    // 验证必填字段
    if (!title || !description || !record_date) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }

    // 检查健康档案是否存在
    const { data: existingRecord } = await supabase
      .from('health_records')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: '健康档案不存在'
      });
    }

    // 更新健康档案
    const { data: healthRecord, error } = await supabase
      .from('health_records')
      .update({
        title,
        description,
        record_type,
        record_date,
        diagnosis: diagnosis || null,
        symptoms: symptoms || null,
        treatment: treatment || null,
        medications: medications || null,
        vital_signs: vital_signs || null,
        lab_results: lab_results || null,
        attachments: attachments || null,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        user:users(id, username, email, phone)
      `)
      .single();

    if (error) {
      console.error('更新健康档案错误:', error);
      return res.status(500).json({
        success: false,
        message: '更新健康档案失败',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: '健康档案更新成功',
      data: healthRecord
    });
  } catch (error) {
    console.error('更新健康档案错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 删除健康档案
 * DELETE /api/health-records/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查健康档案是否存在
    const { data: existingRecord } = await supabase
      .from('health_records')
      .select('id, title')
      .eq('id', id)
      .single();

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: '健康档案不存在'
      });
    }

    // 删除健康档案
    const { error } = await supabase
      .from('health_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除健康档案错误:', error);
      return res.status(500).json({
        success: false,
        message: '删除健康档案失败',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: '健康档案删除成功'
    });
  } catch (error) {
    console.error('删除健康档案错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取用户的健康档案
 * GET /api/health-records/user/:user_id
 */
router.get('/user/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const {
      page = 1,
      limit = 10,
      record_type = 'all',
      start_date = '',
      end_date = ''
    } = req.query;

    // 验证用户是否存在
    const { data: user } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('id', user_id)
      .single();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 构建查询条件
    let query = supabase
      .from('health_records')
      .select('*')
      .eq('user_id', user_id);

    // 记录类型过滤
    if (record_type !== 'all') {
      query = query.eq('record_type', record_type);
    }

    // 日期范围过滤
    if (start_date) {
      query = query.gte('record_date', start_date);
    }
    if (end_date) {
      query = query.lte('record_date', end_date);
    }

    // 排序
    query = query.order('record_date', { ascending: false });

    // 分页
    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: healthRecords, error, count } = await query;

    if (error) {
      console.error('获取用户健康档案错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取用户健康档案失败',
        error: error.message
      });
    }

    // 获取总数
    const { count: totalCount } = await supabase
      .from('health_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id);

    res.json({
      success: true,
      data: {
        user,
        healthRecords: healthRecords || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取用户健康档案错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取健康档案统计信息
 * GET /api/health-records/statistics
 */
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    // 获取健康档案总数和类型统计
    const { data: healthRecords, error } = await supabase
      .from('health_records')
      .select('record_type, created_at');

    if (error) {
      console.error('获取健康档案统计错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取健康档案统计失败',
        error: error.message
      });
    }

    // 计算统计数据
    const total = healthRecords?.length || 0;
    const general = healthRecords?.filter(r => r.record_type === 'general').length || 0;
    const checkup = healthRecords?.filter(r => r.record_type === 'checkup').length || 0;
    const diagnosis = healthRecords?.filter(r => r.record_type === 'diagnosis').length || 0;
    const treatment = healthRecords?.filter(r => r.record_type === 'treatment').length || 0;
    const surgery = healthRecords?.filter(r => r.record_type === 'surgery').length || 0;
    const emergency = healthRecords?.filter(r => r.record_type === 'emergency').length || 0;

    // 今日新增档案
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = healthRecords?.filter(r => 
      r.created_at.startsWith(today)
    ).length || 0;

    // 本月新增档案
    const thisMonth = new Date().toISOString().substring(0, 7);
    const thisMonthRecords = healthRecords?.filter(r => 
      r.created_at.startsWith(thisMonth)
    ).length || 0;

    res.json({
      success: true,
      data: {
        total,
        general,
        checkup,
        diagnosis,
        treatment,
        surgery,
        emergency,
        todayRecords,
        thisMonthRecords
      }
    });
  } catch (error) {
    console.error('获取健康档案统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 批量删除健康档案
 * DELETE /api/health-records/batch
 */
router.delete('/batch', authenticateToken, async (req, res) => {
  try {
    const { record_ids } = req.body;

    if (!record_ids || !Array.isArray(record_ids) || record_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的健康档案ID列表'
      });
    }

    // 批量删除健康档案
    const { data: deletedRecords, error } = await supabase
      .from('health_records')
      .delete()
      .in('id', record_ids)
      .select('id, title');

    if (error) {
      console.error('批量删除健康档案错误:', error);
      return res.status(500).json({
        success: false,
        message: '批量删除健康档案失败',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: `成功删除 ${deletedRecords?.length || 0} 个健康档案`,
      data: deletedRecords
    });
  } catch (error) {
    console.error('批量删除健康档案错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 导出用户健康档案
 * GET /api/health-records/export/:user_id
 */
router.get('/export/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const { format = 'json' } = req.query;

    // 验证用户是否存在
    const { data: user } = await supabase
      .from('users')
      .select('id, username, email, phone, birth_date, gender')
      .eq('id', user_id)
      .single();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 获取用户所有健康档案
    const { data: healthRecords, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('user_id', user_id)
      .order('record_date', { ascending: false });

    if (error) {
      console.error('导出健康档案错误:', error);
      return res.status(500).json({
        success: false,
        message: '导出健康档案失败',
        error: error.message
      });
    }

    const exportData = {
      user,
      healthRecords: healthRecords || [],
      exportDate: new Date().toISOString(),
      totalRecords: healthRecords?.length || 0
    };

    // 根据格式返回数据
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="health-records-${user.username}-${Date.now()}.json"`);
      res.json(exportData);
    } else {
      // 默认返回JSON格式
      res.json({
        success: true,
        data: exportData
      });
    }
  } catch (error) {
    console.error('导出健康档案错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;