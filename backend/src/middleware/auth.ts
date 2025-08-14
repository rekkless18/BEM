import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UserRole } from '../types/index';

// 扩展Request接口，添加user属性
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        role: UserRole;
      };
    }
  }
}

/**
 * 认证中间件
 * 验证JWT token并将用户信息添加到请求对象中
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: '缺少认证token',
      });
      return;
    }

    // 检查token格式 (Bearer <token>)
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      res.status(401).json({
        success: false,
        message: '无效的token格式',
      });
      return;
    }

    // 验证token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Token已过期或无效',
      });
      return;
    }

    // 将用户信息添加到请求对象
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    res.status(401).json({
      success: false,
      message: 'Token验证失败',
    });
    return;
  }
};

/**
 * 角色权限中间件
 * 检查用户是否具有指定角色权限
 * @param allowedRoles - 允许的角色数组
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户未认证',
        });
      }

      // 超级管理员拥有所有权限
      if (user.role === 'super_admin') {
        return next();
      }

      // 检查用户角色是否在允许的角色列表中
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: '权限不足，无法访问此资源',
          data: {
            userRole: user.role,
            requiredRoles: allowedRoles,
          },
        });
      }

      next();
    } catch (error) {
      console.error('角色权限中间件错误:', error);
      return res.status(500).json({
        success: false,
        message: '权限验证失败',
      });
    }
  };
};

/**
 * 可选认证中间件
 * 如果提供了token则验证，否则继续执行（用于可选登录的接口）
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    // 如果没有提供token，直接继续
    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return next();
    }

    // 尝试验证token
    const decoded = verifyToken(token);
    
    if (decoded) {
      // token有效，添加用户信息
      req.user = {
          userId: decoded.userId,
          username: decoded.username,
          role: decoded.role,
        };
    }
    
    // 无论token是否有效都继续执行
    next();
  } catch (error) {
    console.error('可选认证中间件错误:', error);
    // 出错时也继续执行，不阻断请求
    next();
  }
};

/**
 * 管理员权限中间件
 * 只允许管理员角色访问
 */
export const requireAdmin = roleMiddleware([
  'super_admin',
  'medical_admin',
  'mall_admin',
  'marketing_admin',
  'admin'
]);

/**
 * 超级管理员权限中间件
 * 只允许超级管理员访问
 */
export const superAdminMiddleware = roleMiddleware(['super_admin']);

/**
 * 医疗管理员权限中间件
 * 允许医疗管理员和超级管理员访问
 */
export const medicalAdminMiddleware = roleMiddleware(['super_admin', 'medical_admin']);

/**
 * 商城管理员权限中间件
 * 允许商城管理员和超级管理员访问
 */
export const mallAdminMiddleware = roleMiddleware(['super_admin', 'mall_admin']);

/**
 * 营销管理员权限中间件
 * 允许营销管理员和超级管理员访问
 */
export const marketingAdminMiddleware = roleMiddleware(['super_admin', 'marketing_admin']);