import express from 'express';
import { supabaseAdmin, handleSupabaseError } from '../utils/supabase';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = express.Router();

/**
 * 获取用户列表
 * GET /api/users
 * 需要管理员权限
 */
router.get('/', authenticateToken, requireAdmin, async (req, res): Promise<any> => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      is_active,
      role = 'all',
      system_type = 'all'
    } = req.query;

    console.log('🔍 用户列表API调用参数:', { page, limit, search, status, is_active, role, system_type });

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    console.log('📊 分页参数:', { pageNum, limitNum, offset });

    // 构建查询
    let query = supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' });

    // 搜索条件
    if (search) {
      query = query.or(`nick_name.ilike.%${search}%,real_name.ilike.%${search}%,phone.ilike.%${search}%`);
      console.log('🔎 添加搜索条件:', search);
    }

    // 状态筛选 - 处理前端传递的is_active参数
    if (is_active !== undefined) {
      const isActiveValue = is_active === 'true' || is_active === true;
      query = query.eq('is_verified', isActiveValue);
      console.log('📋 添加状态筛选 (is_active):', is_active, '-> is_verified:', isActiveValue);
    } else if (status !== 'all') {
      query = query.eq('is_verified', status === 'active');
      console.log('📋 添加状态筛选 (status):', status);
    }

    // 角色筛选 - 暂时忽略，因为数据库中没有role字段
    // if (role !== 'all') {
    //   query = query.eq('role', role);
    // }

    // 所属系统筛选
    if (system_type !== 'all') {
      query = query.eq('system_type', system_type);
      console.log('🏥 添加所属系统筛选:', system_type);
    }

    // 排序和分页
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    console.log('🗃️ 执行数据库查询...');
    const { data: users, error, count } = await query;
    console.log('📈 数据库查询结果:', { 
      usersCount: users?.length || 0, 
      totalCount: count, 
      error: error?.message,
      firstUser: users?.[0] ? {
        id: users[0].id,
        nick_name: users[0].nick_name,
        real_name: users[0].real_name,
        openid: users[0].openid
      } : null
    });

    if (error) {
      console.error('获取用户列表失败:', error);
      return res.status(500).json({
         success: false,
         message: '获取用户列表失败',
         error: error.message
       });
    }

    // 映射数据库字段到前端期望的字段
    console.log('🔄 开始映射用户数据...');
    const mappedUsers = (users || []).map(user => ({
      id: user.id,
      username: user.nick_name || user.openid, // 使用nick_name作为username，如果没有则使用openid
      name: user.real_name || user.nick_name || '未设置', // 使用real_name作为name
      email: user.openid + '@wechat.user', // 微信用户没有邮箱，生成一个虚拟邮箱
      phone: user.phone || '',
      role: user.role || 'user', // 使用数据库中的role字段，默认为user
      avatar_url: user.avatar_url || '', // 修正字段名为avatar_url
      is_active: user.is_verified || false, // 使用is_verified作为is_active
      level: user.level || 'VIP1',
      points: user.points || 0,
      system_type: user.system_type || 'WIP', // 所属系统字段
      last_login_at: user.updated_at, // 修正字段名为last_login_at
      created_at: user.created_at,
      updated_at: user.updated_at
    }));
    console.log('✅ 映射完成，用户数量:', mappedUsers.length);
    console.log('👤 映射后的第一个用户:', mappedUsers[0] || '无数据');

    const response: ApiResponse = {
      success: true,
      message: '获取用户列表成功',
      data: {
        users: mappedUsers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limitNum)
        }
      }
    };

    console.log('📤 返回响应数据:', {
      success: response.success,
      message: response.message,
      usersCount: response.data.users.length,
      pagination: response.data.pagination
    });

    // 禁用缓存以便调试
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json(response);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 获取用户详情
 * GET /api/users/:id
 * 需要管理员权限
 */
router.get('/:id', authenticateToken, requireAdmin, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
           success: false,
           message: '用户不存在'
         });
      }
      console.error('获取用户详情失败:', error);
      return res.status(500).json({
         success: false,
         message: '获取用户详情失败',
         error: error.message
       });
    }

    // 映射数据库字段到前端期望的字段
    const mappedUser = {
      id: user.id,
      username: user.nick_name || user.openid,
      name: user.real_name || user.nick_name || '未设置',
      email: user.openid + '@wechat.user',
      phone: user.phone || '',
      role: user.role || 'user', // 使用数据库中的role字段，默认为user
      avatar_url: user.avatar_url || '', // 修正字段名为avatar_url
      is_active: user.is_verified || false,
      level: user.level || 'VIP1',
      points: user.points || 0,
      system_type: user.system_type || 'WIP', // 所属系统字段
      last_login_at: user.updated_at, // 修正字段名为last_login_at
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    const response: ApiResponse = {
      success: true,
      message: '获取用户详情成功',
      data: mappedUser
    };

    res.json(response);
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 创建用户
 * POST /api/users
 * 需要管理员权限
 */
router.post('/', authenticateToken, requireAdmin, async (req, res): Promise<any> => {
  try {
    const {
      username, // 对应nick_name
      name,     // 对应real_name
      phone,
      openid,   // 微信openid，必填
      avatar_url,
      role      // 用户角色
    } = req.body;

    // 检查openid是否已存在（仅当openid存在时检查）
    if (openid) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('openid', openid);

      if (existingUser && existingUser.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'openid已存在'
        });
      }
    }

    // 创建用户数据对象
    const userData: any = {
      nick_name: username || '',
      real_name: name || '',
      phone: phone || '',
      avatar_url: avatar_url || '',
      level: 'VIP1',
      level_progress: 0,
      points: 0,
      system_type: req.body.system_type || 'WIP', // 所属系统字段
      role: role || 'user', // 用户角色，默认为user
      is_verified: false,
      is_logged_in: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 只有当openid存在时才添加到数据中
    if (openid) {
      userData.openid = openid;
    }

    // 创建用户
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      console.error('创建用户失败:', error);
      return res.status(500).json({
        success: false,
        message: '创建用户失败',
        error: error.message
      });
    }

    // 映射数据库字段到前端期望的字段
    const mappedNewUser = {
      id: newUser.id,
      username: newUser.nick_name || newUser.openid || `user_${newUser.id}`, // 如果没有nick_name和openid，使用user_id作为用户名
      name: newUser.real_name || newUser.nick_name || '未设置',
      email: newUser.openid ? newUser.openid + '@wechat.user' : `user_${newUser.id}@system.local`, // 如果没有openid，生成系统邮箱
      phone: newUser.phone || '',
      role: newUser.role || 'user', // 使用数据库中的role字段
      avatar: newUser.avatar_url || '',
      is_active: newUser.is_verified || false,
      level: newUser.level || 'VIP1',
      points: newUser.points || 0,
      system_type: newUser.system_type || 'WIP', // 所属系统字段
      last_login: newUser.updated_at,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at
    };

    const response: ApiResponse = {
      success: true,
      message: '创建用户成功',
      data: mappedNewUser
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 更新用户
 * PUT /api/users/:id
 * 需要管理员权限
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const {
      username,  // 对应nick_name
      name,      // 对应real_name
      phone,
      avatar_url,
      system_type, // 所属系统字段
      role,      // 用户角色
      is_active  // 对应is_verified
    } = req.body;

    // 检查用户是否存在
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 更新用户
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (username !== undefined) updateData.nick_name = username;
    if (name !== undefined) updateData.real_name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (system_type !== undefined) updateData.system_type = system_type;
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_verified = is_active;

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新用户失败:', error);
      return res.status(500).json({
        success: false,
        message: '更新用户失败',
        error: error.message
      });
    }

    // 映射数据库字段到前端期望的字段
    const mappedUpdatedUser = {
      id: updatedUser.id,
      username: updatedUser.nick_name || updatedUser.openid,
      name: updatedUser.real_name || updatedUser.nick_name || '未设置',
      email: updatedUser.openid + '@wechat.user',
      phone: updatedUser.phone || '',
      role: updatedUser.role || 'user', // 使用数据库中的role字段
      avatar: updatedUser.avatar_url || '',
      is_active: updatedUser.is_verified || false,
      level: updatedUser.level || 'VIP1',
      points: updatedUser.points || 0,
      system_type: updatedUser.system_type || 'WIP', // 所属系统字段
      last_login: updatedUser.updated_at,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    };

    const response: ApiResponse = {
      success: true,
      message: '更新用户成功',
      data: mappedUpdatedUser
    };

    res.json(response);
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 删除用户（软删除）
 * DELETE /api/users/:id
 * 需要管理员权限
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;

    // 检查用户是否存在
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, is_verified')
      .eq('id', id)
      .single();

    if (checkError || !existingUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 软删除用户（设置为未验证状态）
    const { data: deletedUser, error } = await supabaseAdmin
      .from('users')
      .update({
        is_verified: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('删除用户失败:', error);
      return res.status(500).json({
        success: false,
        message: '删除用户失败',
        error: error.message
      });
    }

    // 映射数据库字段到前端期望的字段
    const mappedDeletedUser = {
      id: deletedUser.id,
      username: deletedUser.nick_name || deletedUser.openid,
      name: deletedUser.real_name || deletedUser.nick_name || '未设置',
      email: deletedUser.openid + '@wechat.user',
      phone: deletedUser.phone || '',
      role: 'user',
      avatar: deletedUser.avatar_url || '',
      is_active: deletedUser.is_verified || false,
      level: deletedUser.level || 'VIP1',
      points: deletedUser.points || 0,
      system_type: deletedUser.system_type || 'WIP', // 所属系统字段
      last_login: deletedUser.updated_at,
      created_at: deletedUser.created_at,
      updated_at: deletedUser.updated_at
    };

    const response: ApiResponse = {
      success: true,
      message: '删除用户成功',
      data: mappedDeletedUser
    };

    res.json(response);
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 批量更新用户状态
 * PATCH /api/users/batch-status
 * 需要管理员权限
 */
router.patch('/batch-status', authenticateToken, requireAdmin, async (req, res): Promise<any> => {
  try {
    const { userIds, is_active } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的用户ID列表'
      });
    }

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: '请提供有效的状态值'
      });
    }

    // 批量更新用户状态
    const { data: updatedUsers, error } = await supabaseAdmin
      .from('users')
      .update({
        is_verified: is_active, // 使用is_verified字段代替is_active
        updated_at: new Date().toISOString()
      })
      .in('id', userIds)
      .select();

    if (error) {
      console.error('批量更新用户状态失败:', error);
      return res.status(500).json({
        success: false,
        message: '批量更新用户状态失败',
        error: error.message
      });
    }

    // 映射数据库字段到前端期望的字段
    const mappedUpdatedUsers = (updatedUsers || []).map(user => ({
      id: user.id,
      username: user.nick_name || user.openid,
      name: user.real_name || user.nick_name || '未设置',
      email: user.openid + '@wechat.user',
      phone: user.phone || '',
      role: 'user',
      avatar: user.avatar_url || '',
      is_active: user.is_verified || false,
      level: user.level || 'VIP1',
      points: user.points || 0,
      system_type: user.system_type || 'WIP', // 所属系统字段
      last_login: user.updated_at,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));

    const response: ApiResponse = {
      success: true,
      message: `成功更新 ${updatedUsers?.length || 0} 个用户的状态`,
      data: mappedUpdatedUsers
    };

    res.json(response);
  } catch (error) {
    console.error('批量更新用户状态错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;