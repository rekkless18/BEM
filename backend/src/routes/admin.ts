import express from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { generateAccessToken } from '../utils/jwt';
import bcrypt from 'bcrypt';

const router = express.Router();

// 调试端点
router.get('/debug-login', async (req, res): Promise<any> => {
  try {
    console.log('🔍 调试登录查询...');
    
    // 测试查询
    const { data: admin, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('username', 'admin')
      .eq('is_active', true)
      .single();

    console.log('📊 调试查询结果:', { 
      found: !!admin, 
      error: error?.message,
      adminId: admin?.id,
      adminUsername: admin?.username,
      isActive: admin?.is_active,
      passwordHashLength: admin?.password_hash?.length
    });

    res.json({
      success: true,
      debug: {
        found: !!admin,
        error: error?.message,
        adminData: admin ? {
          id: admin.id,
          username: admin.username,
          is_active: admin.is_active,
          hasPassword: !!admin.password_hash
        } : null
      }
    });
  } catch (error) {
    console.error('调试失败:', error);
    res.status(500).json({
      success: false,
      error: (error as any).message
    });
  }
});

// 管理员登录
router.post('/login', async (req, res): Promise<any> => {
  try {
    const { username, password } = req.body;
    console.log('🔐 登录请求:', { username, passwordLength: password?.length });

    if (!username || !password) {
      console.log('❌ 用户名或密码为空');
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 查询管理员用户
    console.log('🔍 查询用户:', username);
    const { data: admin, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    console.log('📊 数据库查询结果:', { 
      found: !!admin, 
      error: error?.message,
      adminId: admin?.id,
      adminUsername: admin?.username,
      isActive: admin?.is_active,
      passwordHashLength: admin?.password_hash?.length
    });

    if (error || !admin) {
      console.log('❌ 用户不存在或查询失败:', error?.message);
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    console.log('🔑 验证密码:', { 
      inputPassword: password,
      storedHash: admin.password_hash
    });
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    console.log('✅ 密码验证结果:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ 密码验证失败');
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 更新最后登录时间
    await supabaseAdmin
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', admin.id);

    // 生成JWT token
    const token = generateAccessToken({
      userId: admin.id,
      username: admin.username,
      role: admin.role
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions
        }
      }
    });
  } catch (error) {
    console.error('管理员登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
});

// 获取管理员列表
router.get('/users', authenticateToken, requireAdmin, async (req, res): Promise<any> => {
  try {
    const { page = 1, limit = 10, search, role, is_active } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabaseAdmin
      .from('admin_users')
      .select('id, username, email, role, permissions, is_active, created_at, last_login_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 搜索过滤
    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // 角色过滤
    if (role) {
      query = query.eq('role', role);
    }

    // 状态过滤
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    // 分页
    query = query.range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('获取管理员列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取管理员列表失败'
    });
  }
});

// 创建管理员
router.post('/users', authenticateToken, requireAdmin, async (req, res): Promise<any> => {
  try {
    const { username, email, password, role, permissions } = req.body;

    // 验证必填字段
    if (!username || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱、密码和角色不能为空'
      });
    }

    // 检查用户名是否已存在
    const { data: existingUser } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 检查邮箱是否已存在
    const { data: existingEmail } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: '邮箱已存在'
      });
    }

    // 加密密码
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 创建管理员
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .insert({
        username,
        email,
        password_hash,
        role,
        permissions: permissions || [],
        is_active: true
      })
      .select('id, username, email, role, permissions, is_active, created_at')
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data,
      message: '创建管理员成功'
    });
  } catch (error) {
    console.error('创建管理员失败:', error);
    res.status(500).json({
      success: false,
      message: '创建管理员失败'
    });
  }
});

// 更新管理员信息
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const { username, email, role, permissions, is_active } = req.body;

    // 检查管理员是否存在
    const { data: existingAdmin } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        message: '管理员不存在'
      });
    }

    // 如果更新用户名，检查是否重复
    if (username) {
      const { data: duplicateUsername } = await supabaseAdmin
        .from('admin_users')
        .select('id')
        .eq('username', username)
        .neq('id', id)
        .single();

      if (duplicateUsername) {
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        });
      }
    }

    // 如果更新邮箱，检查是否重复
    if (email) {
      const { data: duplicateEmail } = await supabaseAdmin
        .from('admin_users')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (duplicateEmail) {
        return res.status(400).json({
          success: false,
          message: '邮箱已存在'
        });
      }
    }

    // 更新管理员信息
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .update(updateData)
      .eq('id', id)
      .select('id, username, email, role, permissions, is_active, updated_at')
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data,
      message: '更新管理员信息成功'
    });
  } catch (error) {
    console.error('更新管理员信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新管理员信息失败'
    });
  }
});

// 重置管理员密码
router.put('/users/:id/password', authenticateToken, requireAdmin, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: '新密码不能为空'
      });
    }

    // 检查管理员是否存在
    const { data: existingAdmin } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        message: '管理员不存在'
      });
    }

    // 加密新密码
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 更新密码
    const { error } = await supabaseAdmin
      .from('admin_users')
      .update({
        password_hash,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: '重置密码成功'
    });
  } catch (error) {
    console.error('重置密码失败:', error);
    res.status(500).json({
      success: false,
      message: '重置密码失败'
    });
  }
});

// 删除管理员
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;

    // 检查管理员是否存在
    const { data: existingAdmin } = await supabaseAdmin
      .from('admin_users')
      .select('id, role')
      .eq('id', id)
      .single();

    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        message: '管理员不存在'
      });
    }

    // 防止删除超级管理员
    if (existingAdmin.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: '不能删除超级管理员'
      });
    }

    // 软删除（设置为非活跃状态）
    const { error } = await supabaseAdmin
      .from('admin_users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: '删除管理员成功'
    });
  } catch (error) {
    console.error('删除管理员失败:', error);
    res.status(500).json({
      success: false,
      message: '删除管理员失败'
    });
  }
});

// 获取权限列表
router.get('/permissions', authenticateToken, requireAdmin, async (req, res): Promise<any> => {
  try {
    // 定义系统权限
    const permissions = [
      {
        module: 'dashboard',
        name: '仪表盘',
        permissions: [
          { key: 'dashboard.view', name: '查看仪表盘' }
        ]
      },
      {
        module: 'medical',
        name: '医疗服务管理',
        permissions: [
          { key: 'departments.view', name: '查看科室' },
          { key: 'departments.create', name: '创建科室' },
          { key: 'departments.update', name: '更新科室' },
          { key: 'departments.delete', name: '删除科室' },
          { key: 'doctors.view', name: '查看医生' },
          { key: 'doctors.create', name: '创建医生' },
          { key: 'doctors.update', name: '更新医生' },
          { key: 'doctors.delete', name: '删除医生' }
        ]
      },
      {
        module: 'mall',
        name: '商城管理',
        permissions: [
          { key: 'products.view', name: '查看商品' },
          { key: 'products.create', name: '创建商品' },
          { key: 'products.update', name: '更新商品' },
          { key: 'products.delete', name: '删除商品' },
          { key: 'orders.view', name: '查看订单' },
          { key: 'orders.update', name: '更新订单' }
        ]
      },
      {
        module: 'marketing',
        name: '营销管理',
        permissions: [
          { key: 'carousel.view', name: '查看轮播图' },
          { key: 'carousel.create', name: '创建轮播图' },
          { key: 'carousel.update', name: '更新轮播图' },
          { key: 'carousel.delete', name: '删除轮播图' },
          { key: 'articles.view', name: '查看文章' },
          { key: 'articles.create', name: '创建文章' },
          { key: 'articles.update', name: '更新文章' },
          { key: 'articles.delete', name: '删除文章' }
        ]
      },
      {
        module: 'system',
        name: '系统管理',
        permissions: [
          { key: 'admin.view', name: '查看管理员' },
          { key: 'admin.create', name: '创建管理员' },
          { key: 'admin.update', name: '更新管理员' },
          { key: 'admin.delete', name: '删除管理员' },
          { key: 'permissions.manage', name: '权限管理' }
        ]
      }
    ];

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('获取权限列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取权限列表失败'
    });
  }
});

// 获取角色列表
router.get('/roles', authenticateToken, requireAdmin, async (req, res): Promise<any> => {
  try {
    const roles = [
      {
        key: 'super_admin',
        name: '超级管理员',
        description: '拥有所有权限的超级管理员'
      },
      {
        key: 'admin',
        name: '管理员',
        description: '拥有大部分管理权限的管理员'
      },
      {
        key: 'operator',
        name: '操作员',
        description: '拥有基本操作权限的操作员'
      },
      {
        key: 'viewer',
        name: '查看员',
        description: '只能查看数据的用户'
      }
    ];

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('获取角色列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取角色列表失败'
    });
  }
});

// 获取当前用户信息
router.get('/profile', authenticateToken, async (req, res): Promise<any> => {
  try {
    const userId = (req as any).user.id;

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, username, email, role, permissions, created_at, last_login_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

// 更新当前用户信息
router.put('/profile', authenticateToken, async (req, res): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { email } = req.body;

    // 如果更新邮箱，检查是否重复
    if (email) {
      const { data: duplicateEmail } = await supabaseAdmin
        .from('admin_users')
        .select('id')
        .eq('email', email)
        .neq('id', userId)
        .single();

      if (duplicateEmail) {
        return res.status(400).json({
          success: false,
          message: '邮箱已存在'
        });
      }
    }

    // 更新用户信息
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (email !== undefined) updateData.email = email;

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .update(updateData)
      .eq('id', userId)
      .select('id, username, email, role, permissions, updated_at')
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data,
      message: '更新个人信息成功'
    });
  } catch (error) {
    console.error('更新个人信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新个人信息失败'
    });
  }
});

// 修改当前用户密码
router.put('/profile/password', authenticateToken, async (req, res): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '旧密码和新密码不能为空'
      });
    }

    // 获取当前用户信息
    const { data: user, error: userError } = await supabaseAdmin
      .from('admin_users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证旧密码
    const isValidOldPassword = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValidOldPassword) {
      return res.status(400).json({
        success: false,
        message: '旧密码错误'
      });
    }

    // 加密新密码
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // 更新密码
    const { error } = await supabaseAdmin
      .from('admin_users')
      .update({
        password_hash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: '修改密码成功'
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败'
    });
  }
});

export default router;