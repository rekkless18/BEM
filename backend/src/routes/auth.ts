import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { supabase, supabaseAdmin } from '../utils/supabase';
import { generateAccessToken, verifyToken } from '../utils/jwt';
import { authenticateToken } from '../middleware/auth';
import type { LoginResponse, User } from '../types';

const router = Router();

/**
 * 管理员登录接口
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    console.log('登录请求:', { username, password: '***' });

    // 验证请求参数
    if (!username || !password) {
      console.log('参数验证失败: 用户名或密码为空');
      res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
      });
      return;
    }

    // 查询管理员用户
    const { data: adminUser, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    console.log('数据库查询结果:', { error, userFound: !!adminUser });
    if (error) {
      console.log('数据库查询错误:', error);
    }

    if (error || !adminUser) {
      console.log('用户不存在或未激活');
      res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
      return;
    }

    // 验证密码
    console.log('开始验证密码');
    const isPasswordValid = await bcrypt.compare(password, adminUser.password_hash);
    console.log('密码验证结果:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('密码验证失败');
      res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
      return;
    }

    // 更新最后登录时间
    await supabaseAdmin
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', adminUser.id);

    // 生成JWT token
    const token = generateAccessToken({
      userId: adminUser.id,
      username: adminUser.username,
      role: adminUser.role
    });

    // 返回用户信息（不包含密码）
    const userInfo: User = {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      isActive: adminUser.is_active,
      createdAt: adminUser.created_at,
      updatedAt: adminUser.updated_at || adminUser.created_at,
    };

    const response: LoginResponse = {
      success: true,
      message: '登录成功',
      data: {
        user: userInfo,
        token,
        expiresIn: '7d',
      },
    };

    res.json(response);
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

/**
 * 验证token接口
 * GET /api/auth/verify
 */
router.get('/verify', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '无效的token',
      });
      return;
    }

    // 查询用户最新信息
    const { data: adminUser, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !adminUser) {
      res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用',
      });
      return;
    }

    // 返回用户信息（不包含密码）
    const userInfo: User = {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      isActive: adminUser.is_active,
      createdAt: adminUser.created_at,
      updatedAt: adminUser.updated_at || adminUser.created_at,
    };

    res.json({
      success: true,
      message: 'Token验证成功',
      data: {
        user: userInfo,
      },
    });
  } catch (error) {
    console.error('Token验证错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

/**
 * 用户登出接口
 * POST /api/auth/logout
 */
router.post('/logout', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    // 在实际项目中，可以在这里实现token黑名单机制
    // 目前只是简单返回成功响应，客户端负责清除token
    
    res.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

/**
 * 修改密码接口
 * POST /api/auth/change-password
 */
router.post('/change-password', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    // 验证输入参数
    if (!oldPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: '旧密码和新密码不能为空',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: '新密码长度至少6位',
      });
      return;
    }

    // 查询用户信息
    const { data: adminUser, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !adminUser) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, adminUser.password_hash);
    if (!isOldPasswordValid) {
      res.status(400).json({
        success: false,
        message: '旧密码错误',
      });
      return;
    }

    // 加密新密码
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // 更新密码
    const { error: updateError } = await supabaseAdmin
      .from('admin_users')
      .update({ 
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

export default router;