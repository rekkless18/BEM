import { Router } from 'express';
import { supabase, supabaseAdmin } from '../utils/supabase';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { ApiResponse, Department } from '../types';

const router = Router();

// 获取所有科室列表（支持分页和筛选）
router.get('/', authenticateToken, async (req, res): Promise<any> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      is_active
    } = req.query as any;

    let query = supabase
      .from('departments')
      .select(`
        *,
        head_doctor:doctors!head_doctor_id(
          id,
          name,
          title,
          avatar
        )
      `, { count: 'exact' });

    // 添加状态筛选条件
    if (is_active !== undefined) {
      // 处理字符串形式的布尔值
      let booleanValue;
      if (is_active === 'true' || is_active === true) {
        booleanValue = true;
      } else if (is_active === 'false' || is_active === false) {
        booleanValue = false;
      }
      
      if (booleanValue !== undefined) {
        query = query.eq('is_active', booleanValue);
        console.log('🔍 添加科室状态筛选条件: is_active =', booleanValue);
      }
    }

    // 添加搜索条件
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // 分页
    const offset = (Number(page) - 1) * Number(limit);
    query = query
      .range(offset, offset + Number(limit) - 1)
      .order('sort_order', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: '获取科室列表失败',
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '获取科室列表成功',
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    } as ApiResponse<Department[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 根据ID获取科室详情
router.get('/:id', authenticateToken, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        head_doctor:doctors!head_doctor_id(
          id,
          name,
          title,
          avatar,
          specialties,
          experience_years
        ),
        doctors:doctors!department_id(
          id,
          name,
          title,
          avatar,
          specialties,
          is_available
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: '科室不存在',
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '获取科室详情成功',
      data
    } as ApiResponse<Department>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 创建新科室
router.post('/', authenticateToken, async (req, res): Promise<any> => {
  try {
    const {
      name,
      description,
      location,
      phone,
      email,
      working_hours,
      services,
      equipment,
      specialties,
      head_doctor_id,
      sort_order
    } = req.body;

    // 验证必填字段
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: '科室名称和描述为必填项'
      } as ApiResponse<null>);
    }

    const { data, error } = await supabase
      .from('departments')
      .insert({
        name,
        description,
        location,
        phone,
        email,
        working_hours,
        services,
        equipment,
        specialties,
        head_doctor_id,
        sort_order: sort_order || 999,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: '创建科室失败',
        error: error.message
      } as ApiResponse<null>);
    }

    res.status(201).json({
      success: true,
      message: '创建科室成功',
      data
    } as ApiResponse<Department>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 更新科室信息
router.put('/:id', authenticateToken, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // 添加详细的调试日志
    console.log('🔧 科室更新请求 - 新版本:', {
      id,
      originalBody: req.body,
      updateData: updateData
    });
    
    delete updateData.id; // 防止更新ID字段
    updateData.updated_at = new Date().toISOString();
    
    console.log('📝 最终更新数据:', updateData);

    // 首先检查科室是否存在
    console.log('🔍 检查科室是否存在:', id);
    const { data: existingDept, error: checkError } = await supabase
      .from('departments')
      .select('id')
      .eq('id', id)
      .single();

    console.log('🔍 检查结果:', { existingDept, checkError });

    if (checkError || !existingDept) {
      console.error('❌ 科室不存在:', { id, checkError });
      return res.status(404).json({
        success: false,
        message: '科室不存在',
        error: '找不到指定的科室记录'
      } as ApiResponse<null>);
    }

    console.log('✅ 科室存在，开始更新');
    // 执行更新操作，使用管理员客户端绕过RLS限制
    const { data, error } = await supabaseAdmin
      .from('departments')
      .update(updateData)
      .eq('id', id)
      .select();

    console.log('🔍 更新操作结果:', { data, error, dataLength: data?.length });

    if (error) {
      console.error('❌ Supabase更新错误:', {
        error: error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        id: id,
        updateData: updateData
      });
      
      return res.status(500).json({
        success: false,
        message: '更新科室失败',
        error: error.message,
        details: error.details || '无详细信息'
      } as ApiResponse<null>);
    }

    // 检查是否有数据返回
    if (!data || data.length === 0) {
      console.error('❌ 更新操作未影响任何行:', { id, updateData });
      return res.status(404).json({
        success: false,
        message: '科室更新失败',
        error: '未找到要更新的科室记录'
      } as ApiResponse<null>);
    }

    const updatedDepartment = data[0]; // 取第一个（也是唯一的）结果
    console.log('✅ 科室更新成功:', updatedDepartment);
    
    res.json({
      success: true,
      message: '更新科室成功',
      data: updatedDepartment
    } as ApiResponse<Department>);
  } catch (error) {
    console.error('💥 服务器错误:', error);
    
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 删除科室（软删除）
router.delete('/:id', authenticateToken, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('departments')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: '删除科室失败',
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '删除科室成功',
      data
    } as ApiResponse<Department>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 更新科室排序（仅管理员）
router.patch('/sort', requireAdmin, async (req, res): Promise<any> => {
  try {
    const { departments } = req.body; // [{ id, sort_order }]

    if (!Array.isArray(departments)) {
      return res.status(400).json({
        success: false,
        message: '参数格式错误'
      } as ApiResponse<null>);
    }

    // 批量更新排序
    const updatePromises = departments.map(dept => 
      supabase
        .from('departments')
        .update({ 
          sort_order: dept.sort_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', dept.id)
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: '更新排序成功'
    } as ApiResponse<null>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

export default router;