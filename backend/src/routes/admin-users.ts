import express from 'express';
import { supabase, handleSupabaseError } from '../utils/supabase';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { ApiResponse } from '../types';
import bcrypt from 'bcrypt';

const router = express.Router();

/**
 * 获取管理员用户列表
 * GET /api/admin-users
 * 需要管理员权限
 */
router.get('/', authenticateToken, requireAdmin, async (req, res): Promise<any> => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      role = 'all'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // 构建查询
    let query = supabase
      .from('admin_users')
      .select('*', { count: 'exact' });

    // 搜索条件
    if (search) {
      query = query.or(`username.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // 状态筛选
    if (status !== 'all') {
      query = query.eq('is_active', status === 'active');
    }

    // 角色筛选
    if (role !== 'all') {
      query = query.eq('role', role);
    }

    // 排序和分页
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: adminUsers, error, count } = await query;

    if (error) {
      console.error('获取管理员用户列表失败:', error);
      return res.status(500).json({
         success: false,
         message: '获取管理员用户列表失败',
         error: error.message
       });
    }

    // 映射数据库字段到前端期望的字段（不返回密码哈希）
    const mappedAdminUsers = (adminUsers || []).map(user => ({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));

    const response: ApiResponse = {
      success: true,
      message: '获取管理员用户列表成功',
      data: {
        users: mappedAdminUsers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limitNum)
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('获取管理员用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 获取管理员用户详情
 * GET /api/admin-users/:id
 * 需要管理员权限
 */
router.get('/:id', authenticateToken, requireAdmin, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;

    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
           success: false,
           message: '管理员用户不存在'
         });
      }
      console.error('获取管理员用户详情失败:', error);
      return res.status(500).json({
         success: false,
         message: '获取管理员用户详情失败',
         error: error.message
       });
    }

    // 映射数据库字段到前端期望的字段（不返回密码哈希）
    const mappedAdminUser = {
      id: adminUser.id,
      username: adminUser.username,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      is_active: adminUser.is_active,
      last_login_at: adminUser.last_login_at,
      created_at: adminUser.created_at,
      updated_at: adminUser.updated_at
    };

    const response: ApiResponse = {
      success: true,
      message: '获取管理员用户详情成功',
      data: mappedAdminUser
    };

    res.json(response);
  } catch (error) {
    console.error('获取管理员用户详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 创建管理员用户
 * POST /api/admin-users
 * 需要管理员权限
 */
router.post('/', authenticateToken, requireAdmin, async (req, res): Promise<any> => {
  try {
    const {
      username,
      name,
      email,
      password,
      role = 'admin'
    } = req.body;

    // 验证必填字段
    if (!username || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名、姓名、邮箱和密码为必填项'
      });
    }

    // 验证角色
    const validRoles = ['super_admin', 'medical_admin', 'mall_admin', 'marketing_admin', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: '无效的角色类型'
      });
    }

    // 检查用户名是否已存在
    const { data: existingUsername } = await supabase
      .from('admin_users')
      .select('id')
      .eq('username', username);

    if (existingUsername && existingUsername.length > 0) {
      return res.status(409).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 检查邮箱是否已存在
    const { data: existingEmail } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email);

    if (existingEmail && existingEmail.length > 0) {
      return res.status(409).json({
        success: false,
        message: '邮箱已存在'
      });
    }

    // 加密密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 创建管理员用户
    const { data: newAdminUser, error } = await supabase
      .from('admin_users')
      .insert({
        username,
        name,
        email,
        password_hash: passwordHash,
        role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('创建管理员用户失败:', error);
      return res.status(500).json({
        success: false,
        message: '创建管理员用户失败',
        error: error.message
      });
    }

    // 映射数据库字段到前端期望的字段（不返回密码哈希）
    const mappedNewAdminUser = {
      id: newAdminUser.id,
      username: newAdminUser.username,
      name: newAdminUser.name,
      email: newAdminUser.email,
      role: newAdminUser.role,
      is_active: newAdminUser.is_active,
      last_login_at: newAdminUser.last_login_at,
      created_at: newAdminUser.created_at,
      updated_at: newAdminUser.updated_at
    };

    const response: ApiResponse = {
      success: true,
      message: '创建管理员用户成功',
      data: mappedNewAdminUser
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('创建管理员用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 更新管理员用户
 * PUT /api/admin-users/:id
 * 需要管理员权限
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const {
      username,
      name,
      email,
      password,
      role,
      is_active
    } = req.body;

    // 检查管理员用户是否存在
    const { data: existingAdminUser, error: checkError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingAdminUser) {
      return res.status(404).json({
        success: false,
        message: '管理员用户不存在'
      });
    }

    // 验证角色
    if (role) {
      const validRoles = ['super_admin', 'medical_admin', 'mall_admin', 'marketing_admin', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: '无效的角色类型'
        });
      }
    }

    // 检查用户名是否已被其他用户使用
    if (username) {
      const { data: existingUsername } = await supabase
        .from('admin_users')
        .select('id')
        .eq('username', username)
        .neq('id', id);

      if (existingUsername && existingUsername.length > 0) {
        return res.status(409).json({
          success: false,
          message: '用户名已被其他用户使用'
        });
      }
    }

    // 检查邮箱是否已被其他用户使用
    if (email) {
      const { data: existingEmail } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', email)
        .neq('id', id);

      if (existingEmail && existingEmail.length > 0) {
        return res.status(409).json({
          success: false,
          message: '邮箱已被其他用户使用'
        });
      }
    }

    // 构建更新数据
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (username !== undefined) updateData.username = username;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    // 如果提供了新密码，则加密并更新
    if (password) {
      const saltRounds = 10;
      updateData.password_hash = await bcrypt.hash(password, saltRounds);
    }

    // 更新管理员用户
    const { data: updatedAdminUser, error } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新管理员用户失败:', error);
      return res.status(500).json({
        success: false,
        message: '更新管理员用户失败',
        error: error.message
      });
    }

    // 映射数据库字段到前端期望的字段（不返回密码哈希）
    const mappedUpdatedAdminUser = {
      id: updatedAdminUser.id,
      username: updatedAdminUser.username,
      name: updatedAdminUser.name,
      email: updatedAdminUser.email,
      role: updatedAdminUser.role,
      is_active: updatedAdminUser.is_active,
      last_login_at: updatedAdminUser.last_login_at,
      created_at: updatedAdminUser.created_at,
      updated_at: updatedAdminUser.updated_at
    };

    const response: ApiResponse = {
      success: true,
      message: '更新管理员用户成功',
      data: mappedUpdatedAdminUser
    };

    res.json(response);
  } catch (error) {
    console.error('更新管理员用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 删除管理员用户（软删除）
 * DELETE /api/admin-users/:id
 * 需要管理员权限
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;

    // 检查管理员用户是否存在
    const { data: existingAdminUser, error: checkError } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('id', id)
      .single();

    if (checkError || !existingAdminUser) {
      return res.status(404).json({
        success: false,
        message: '管理员用户不存在'
      });
    }

    // 软删除管理员用户（设置为非活跃状态）
    const { data: deletedAdminUser, error } = await supabase
      .from('admin_users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('删除管理员用户失败:', error);
      return res.status(500).json({
        success: false,
        message: '删除管理员用户失败',
        error: error.message
      });
    }

    // 映射数据库字段到前端期望的字段（不返回密码哈希）
    const mappedDeletedAdminUser = {
      id: deletedAdminUser.id,
      username: deletedAdminUser.username,
      name: deletedAdminUser.name,
      email: deletedAdminUser.email,
      role: deletedAdminUser.role,
      is_active: deletedAdminUser.is_active,
      last_login_at: deletedAdminUser.last_login_at,
      created_at: deletedAdminUser.created_at,
      updated_at: deletedAdminUser.updated_at
    };

    const response: ApiResponse = {
      success: true,
      message: '删除管理员用户成功',
      data: mappedDeletedAdminUser
    };

    res.json(response);
  } catch (error) {
    console.error('删除管理员用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 批量更新管理员用户状态
 * PATCH /api/admin-users/batch-status
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

    // 批量更新管理员用户状态
    const { data: updatedAdminUsers, error } = await supabase
      .from('admin_users')
      .update({
        is_active: is_active,
        updated_at: new Date().toISOString()
      })
      .in('id', userIds)
      .select();

    if (error) {
      console.error('批量更新管理员用户状态失败:', error);
      return res.status(500).json({
        success: false,
        message: '批量更新管理员用户状态失败',
        error: error.message
      });
    }

    // 映射数据库字段到前端期望的字段（不返回密码哈希）
    const mappedUpdatedAdminUsers = (updatedAdminUsers || []).map(user => ({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));

    const response: ApiResponse = {
      success: true,
      message: `成功更新 ${updatedAdminUsers?.length || 0} 个管理员用户的状态`,
      data: mappedUpdatedAdminUsers
    };

    res.json(response);
  } catch (error) {
    console.error('批量更新管理员用户状态错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;