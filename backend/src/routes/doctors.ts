import { Router } from 'express';
import { supabase, supabaseAdmin } from '../utils/supabase';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { ApiResponse, Doctor, PaginationParams } from '../types';

const router = Router();

// 获取医生列表（支持分页和筛选）
router.get('/', authenticateToken, async (req, res): Promise<any> => {
  try {
    const {
      page = 1,
      limit = 10,
      department,
      is_available,
      is_active, // 添加is_active参数支持
      search
    } = req.query as any;
    



    let query = supabase
      .from('doctors')
      .select('*', { count: 'exact' });

    // 筛选条件
    if (department) {
      query = query.eq('department', department);
    }
    
    // 处理状态筛选参数（支持is_available和is_active两种参数名）
    // 重构is_active参数处理逻辑，确保正确处理字符串形式的布尔值
    let statusFilter = null;
    
    if (is_available !== undefined) {
      // 兼容旧的is_available参数
      statusFilter = is_available;
    } else if (is_active !== undefined) {
      // 使用新的is_active参数
      statusFilter = is_active;
    }
    
    if (statusFilter !== null) {
      // 统一处理布尔值转换
      let booleanValue;
      if (statusFilter === 'true' || statusFilter === true) {
        booleanValue = true;
      } else if (statusFilter === 'false' || statusFilter === false) {
        booleanValue = false;
      } else {
        // 如果不是明确的true/false值，则不添加筛选条件（显示所有医生）

        booleanValue = null;
      }
      
      if (booleanValue !== null) {
        query = query.eq('is_active', booleanValue);

      }
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,specialties.cs.{"${search}"}`);
    }

    // 分页
    const offset = (Number(page) - 1) * Number(limit);
    query = query
      .range(offset, offset + Number(limit) - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;
    


    if (error) {
      return res.status(500).json({
        success: false,
        message: '获取医生列表失败',
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '获取医生列表成功',
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    } as ApiResponse<Doctor[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 根据ID获取医生详情
router.get('/:id', authenticateToken, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;

    // 验证ID格式（UUID）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的医生ID格式'
      } as ApiResponse<null>);
    }

    const { data: doctors, error } = await supabaseAdmin
      .from('doctors')
      .select('*')
      .eq('id', id)
      .limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        message: '查询医生信息失败',
        error: error.message
      } as ApiResponse<null>);
    }

    if (!doctors || doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: '医生不存在'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '获取医生详情成功',
      data: doctors[0]
    } as ApiResponse<Doctor>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 创建新医生
router.post('/', authenticateToken, async (req, res): Promise<any> => {
  try {
    const {
      name,
      title,
      department,
      department_id,
      specialties,
      experience_years,
      avatar,
      introduction,
      consultation_fee,
      hospital,
      rating,
      response_time,
      good_rate,
      work_time,
      is_available
    } = req.body;

    // 验证必填字段
    if (!name || !title || !department) {
      return res.status(400).json({
        success: false,
        message: '医生姓名、职称和科室为必填项'
      } as ApiResponse<null>);
    }

    const { data, error } = await supabase
      .from('doctors')
      .insert({
        name,
        title,
        department,
        specialties: specialties || [],
        experience_years: experience_years || 0,
        avatar,
        introduction,
        consultation_fee: consultation_fee || 50,
        hospital,
        rating: rating || 0,
        response_time: response_time || '10分钟内',
        good_rate: good_rate || 0.95,
        work_time: work_time || [],
        is_active: is_available !== false
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: '创建医生失败',
        error: error.message
      } as ApiResponse<null>);
    }

    res.status(201).json({
      success: true,
      message: '创建医生成功',
      data
    } as ApiResponse<Doctor>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 更新医生信息
router.put('/:id', authenticateToken, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.id; // 防止更新ID字段
    updateData.updated_at = new Date().toISOString();

    // 验证ID格式（UUID）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的医生ID格式'
      } as ApiResponse<null>);
    }

    const { data: updatedDoctors, error } = await supabaseAdmin
      .from('doctors')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({
        success: false,
        message: '更新医生信息失败',
        error: error.message
      } as ApiResponse<null>);
    }

    if (!updatedDoctors || updatedDoctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: '更新失败，医生不存在'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '更新医生信息成功',
      data: updatedDoctors[0]
    } as ApiResponse<Doctor>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 删除医生（软删除）
router.delete('/:id', authenticateToken, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;

    // 验证ID格式（UUID）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的医生ID格式'
      } as ApiResponse<null>);
    }

    const { data: deletedDoctors, error } = await supabaseAdmin
      .from('doctors')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({
        success: false,
        message: '删除医生失败',
        error: error.message
      } as ApiResponse<null>);
    }

    if (!deletedDoctors || deletedDoctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: '删除失败，医生不存在'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '删除医生成功',
      data: deletedDoctors[0]
    } as ApiResponse<Doctor>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 更新医生可用状态
router.patch('/:id/availability', authenticateToken, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;

    // 验证参数
    if (is_available === undefined || is_available === null) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数 is_available'
      } as ApiResponse<null>);
    }

    // 验证ID格式（UUID）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的医生ID格式'
      } as ApiResponse<null>);
    }

    // 首先检查医生是否存在（使用admin客户端绕过RLS）
    const { data: existingDoctors, error: checkError } = await supabaseAdmin
      .from('doctors')
      .select('id, name')
      .eq('id', id)
      .limit(1);

    if (checkError) {
      return res.status(500).json({
        success: false,
        message: '查询医生信息失败',
        error: checkError.message
      } as ApiResponse<null>);
    }

    if (!existingDoctors || existingDoctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: '医生不存在'
      } as ApiResponse<null>);
    }

    // 更新医生状态（使用admin客户端绕过RLS）
    const { data: updatedDoctors, error: updateError } = await supabaseAdmin
      .from('doctors')
      .update({ 
        is_active: is_available,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: '更新医生状态失败',
        error: updateError.message
      } as ApiResponse<null>);
    }

    if (!updatedDoctors || updatedDoctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: '更新失败，医生不存在'
      } as ApiResponse<null>);
    }

    // 返回第一条记录（应该只有一条）
    const updatedDoctor = updatedDoctors[0];

    res.json({
      success: true,
      message: '更新医生状态成功',
      data: updatedDoctor
    } as ApiResponse<Doctor>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 获取科室下的医生列表
router.get('/department/:departmentId', authenticateToken, async (req, res): Promise<any> => {
  try {
    const { departmentId } = req.params;

    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('department', departmentId)
      .eq('is_active', true)
      .order('experience_years', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: '获取科室医生列表失败',
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '获取科室医生列表成功',
      data
    } as ApiResponse<any[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

export default router;