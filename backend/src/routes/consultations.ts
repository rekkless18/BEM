import express from 'express';
import { supabase } from '../utils/supabase';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * 获取咨询列表
 * GET /api/consultations
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      type = 'all',
      doctor_id = 'all',
      start_date = '',
      end_date = ''
    } = req.query;

    // 构建查询条件
    let query = supabase
      .from('consultations')
      .select(`
        *,
        user:users(id, username, email, phone),
        doctor:doctors(id, name, title, department_id, departments(name))
      `);

    // 根据用户角色过滤数据
    if (req.user?.role === 'user') {
      query = query.eq('user_id', req.user.userId);
    } else if (req.user?.role === 'doctor') {
      query = query.eq('doctor_id', req.user.userId);
    }

    // 搜索条件
    if (search) {
      query = query.or(`symptoms.ilike.%${search}%,diagnosis.ilike.%${search}%`);
    }

    // 状态过滤
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // 咨询类型过滤
    if (type !== 'all') {
      query = query.eq('consultation_type', type);
    }

    // 医生过滤
    if (doctor_id !== 'all') {
      query = query.eq('doctor_id', doctor_id);
    }

    // 日期范围过滤
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    // 排序
    query = query.order('created_at', { ascending: false });

    // 分页
    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: consultations, error, count } = await query;

    if (error) {
      console.error('获取咨询列表错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取咨询列表失败',
        error: error.message
      });
    }

    // 获取总数
    const { count: totalCount } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true });

    res.json({
      success: true,
      data: {
        consultations: consultations || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取咨询列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取咨询详情
 * GET /api/consultations/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: consultation, error } = await supabase
      .from('consultations')
      .select(`
        *,
        user:users(id, username, email, phone, avatar_url),
        doctor:doctors(id, name, title, department_id, avatar_url, departments(name))
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取咨询详情错误:', error);
      return res.status(404).json({
        success: false,
        message: '咨询不存在'
      });
    }

    res.json({
      success: true,
      data: consultation
    });
  } catch (error) {
    console.error('获取咨询详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 创建咨询
 * POST /api/consultations
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      user_id,
      doctor_id,
      symptoms,
      consultation_type = 'online',
      appointment_time,
      diagnosis,
      prescription,
      advice,
      consultation_fee = 0,
      is_emergency = false
    } = req.body;

    // 验证必填字段
    if (!user_id || !doctor_id || !symptoms) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }

    // 验证用户和医生是否存在
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('id', doctor_id)
      .single();

    if (!user) {
      return res.status(400).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (!doctor) {
      return res.status(400).json({
        success: false,
        message: '医生不存在'
      });
    }

    // 创建咨询
    const { data: consultation, error } = await supabase
      .from('consultations')
      .insert({
        user_id,
        doctor_id,
        symptoms,
        consultation_type,
        appointment_time: appointment_time || null,
        diagnosis: diagnosis || null,
        prescription: prescription || null,
        advice: advice || null,
        consultation_fee,
        is_emergency,
        status: 'pending'
      })
      .select(`
        *,
        user:users(id, username, email, phone),
        doctor:doctors(id, name, title, department_id, departments(name))
      `)
      .single();

    if (error) {
      console.error('创建咨询错误:', error);
      return res.status(500).json({
        success: false,
        message: '创建咨询失败',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: '咨询创建成功',
      data: consultation
    });
  } catch (error) {
    console.error('创建咨询错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 更新咨询状态
 * PATCH /api/consultations/:id/status
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response, diagnosis, prescription, follow_up_date } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '请提供咨询状态'
      });
    }

    // 验证状态值
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的咨询状态'
      });
    }

    // 检查咨询是否存在
    const { data: existingConsultation } = await supabase
      .from('consultations')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingConsultation) {
      return res.status(404).json({
        success: false,
        message: '咨询不存在'
      });
    }

    // 更新咨询
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // 如果是完成状态，添加响应信息
    if (status === 'completed') {
      updateData.response = response || null;
      updateData.diagnosis = diagnosis || null;
      updateData.prescription = prescription || null;
      updateData.follow_up_date = follow_up_date || null;
      updateData.completed_at = new Date().toISOString();
    }

    const { data: consultation, error } = await supabase
      .from('consultations')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        user:users(id, username, email, phone),
        doctor:doctors(id, name, title, department_id, departments(name))
      `)
      .single();

    if (error) {
      console.error('更新咨询状态错误:', error);
      return res.status(500).json({
        success: false,
        message: '更新咨询状态失败',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: '咨询状态更新成功',
      data: consultation
    });
  } catch (error) {
    console.error('更新咨询状态错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 删除咨询
 * DELETE /api/consultations/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查咨询是否存在
    const { data: existingConsultation } = await supabase
      .from('consultations')
      .select('id, title')
      .eq('id', id)
      .single();

    if (!existingConsultation) {
      return res.status(404).json({
        success: false,
        message: '咨询不存在'
      });
    }

    // 删除咨询
    const { error } = await supabase
      .from('consultations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除咨询错误:', error);
      return res.status(500).json({
        success: false,
        message: '删除咨询失败',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: '咨询删除成功'
    });
  } catch (error) {
    console.error('删除咨询错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取咨询统计信息
 * GET /api/consultations/statistics
 */
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    // 获取咨询总数和状态统计
    const { data: consultations, error } = await supabase
      .from('consultations')
      .select('status, consultation_type, created_at');

    if (error) {
      console.error('获取咨询统计错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取咨询统计失败',
        error: error.message
      });
    }

    // 计算统计数据
    const total = consultations?.length || 0;
    const pending = consultations?.filter(c => c.status === 'pending').length || 0;
    const inProgress = consultations?.filter(c => c.status === 'in_progress').length || 0;
    const completed = consultations?.filter(c => c.status === 'completed').length || 0;
    const cancelled = consultations?.filter(c => c.status === 'cancelled').length || 0;

    // 按类型统计
    const online = consultations?.filter(c => c.consultation_type === 'online').length || 0;
    const offline = consultations?.filter(c => c.consultation_type === 'offline').length || 0;
    const emergency = consultations?.filter(c => c.consultation_type === 'emergency').length || 0;

    // 今日新增咨询
    const today = new Date().toISOString().split('T')[0];
    const todayConsultations = consultations?.filter(c => 
      c.created_at.startsWith(today)
    ).length || 0;

    res.json({
      success: true,
      data: {
        total,
        pending,
        inProgress,
        completed,
        cancelled,
        online,
        offline,
        emergency,
        todayConsultations
      }
    });
  } catch (error) {
    console.error('获取咨询统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 批量更新咨询状态
 * PATCH /api/consultations/batch-status
 */
router.patch('/batch-status', authenticateToken, async (req, res) => {
  try {
    const { consultation_ids, status } = req.body;

    if (!consultation_ids || !Array.isArray(consultation_ids) || consultation_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的咨询ID列表'
      });
    }

    if (!status || !['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的咨询状态'
      });
    }

    // 批量更新咨询状态
    const { data: consultations, error } = await supabase
      .from('consultations')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .in('id', consultation_ids)
      .select('id, title, status');

    if (error) {
      console.error('批量更新咨询状态错误:', error);
      return res.status(500).json({
        success: false,
        message: '批量更新咨询状态失败',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: `成功更新 ${consultations?.length || 0} 个咨询的状态`,
      data: consultations
    });
  } catch (error) {
    console.error('批量更新咨询状态错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;