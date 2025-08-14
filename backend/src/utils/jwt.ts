import * as jwt from 'jsonwebtoken';
import { UserRole } from '../types';

// JWT配置
const JWT_SECRET: string = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// JWT载荷接口
export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * 生成访问令牌
 * @param payload - JWT载荷数据
 * @returns JWT令牌字符串
 */
export const generateAccessToken = (payload: Omit<JwtPayload, 'type' | 'iat' | 'exp'>): string => {
  try {
    return (jwt.sign as any)(
      {
        ...payload,
        type: 'access',
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      }
    );
  } catch (error) {
    console.error('生成访问令牌失败:', error);
    throw new Error('生成访问令牌失败');
  }
};

/**
 * 生成刷新令牌
 * @param payload - JWT载荷数据
 * @returns JWT刷新令牌字符串
 */
export const generateRefreshToken = (payload: Omit<JwtPayload, 'type' | 'iat' | 'exp'>): string => {
  try {
    return (jwt.sign as any)(
      {
        ...payload,
        type: 'refresh',
      },
      JWT_SECRET,
      {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
      }
    );
  } catch (error) {
    console.error('生成刷新令牌失败:', error);
    throw new Error('生成刷新令牌失败');
  }
};

/**
 * 验证JWT令牌
 * @param token - JWT令牌字符串
 * @returns 解码后的载荷数据或null
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = (jwt.verify as any)(token, JWT_SECRET) as JwtPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('JWT令牌已过期');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('无效的JWT令牌');
    } else if (error instanceof jwt.NotBeforeError) {
      console.log('JWT令牌尚未生效');
    } else {
      console.error('JWT验证错误:', error);
    }
    return null;
  }
};

/**
 * 验证刷新令牌
 * @param token - 刷新令牌字符串
 * @returns 解码后的载荷数据或null
 */
export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.type !== 'refresh') {
      console.log('无效的刷新令牌类型');
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('刷新令牌验证错误:', error);
    return null;
  }
};

/**
 * 从令牌中提取载荷（不验证签名）
 * @param token - JWT令牌字符串
 * @returns 解码后的载荷数据或null
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('JWT解码错误:', error);
    return null;
  }
};

/**
 * 检查令牌是否即将过期（在指定时间内）
 * @param token - JWT令牌字符串
 * @param thresholdMinutes - 阈值时间（分钟）
 * @returns 是否即将过期
 */
export const isTokenExpiringSoon = (token: string, thresholdMinutes: number = 30): boolean => {
  try {
    const decoded = decodeToken(token);
    
    if (!decoded || !decoded.exp) {
      return true; // 无法解析或没有过期时间，认为即将过期
    }

    const now = Math.floor(Date.now() / 1000);
    const threshold = thresholdMinutes * 60;
    
    return (decoded.exp - now) <= threshold;
  } catch (error) {
    console.error('检查令牌过期时间错误:', error);
    return true;
  }
};

/**
 * 生成令牌对（访问令牌和刷新令牌）
 * @param payload - JWT载荷数据
 * @returns 包含访问令牌和刷新令牌的对象
 */
export const generateTokenPair = (payload: Omit<JwtPayload, 'type' | 'iat' | 'exp'>) => {
  try {
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN,
      refreshExpiresIn: JWT_REFRESH_EXPIRES_IN,
    };
  } catch (error) {
    console.error('生成令牌对失败:', error);
    throw new Error('生成令牌对失败');
  }
};

/**
 * 刷新访问令牌
 * @param refreshToken - 刷新令牌
 * @returns 新的访问令牌或null
 */
export const refreshAccessToken = (refreshToken: string): string | null => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      return null;
    }

    // 生成新的访问令牌
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    });

    return newAccessToken;
  } catch (error) {
    console.error('刷新访问令牌失败:', error);
    return null;
  }
};

/**
 * 获取令牌剩余有效时间（秒）
 * @param token - JWT令牌字符串
 * @returns 剩余有效时间（秒）或null
 */
export const getTokenRemainingTime = (token: string): number | null => {
  try {
    const decoded = decodeToken(token);
    
    if (!decoded || !decoded.exp) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const remaining = decoded.exp - now;
    
    return remaining > 0 ? remaining : 0;
  } catch (error) {
    console.error('获取令牌剩余时间错误:', error);
    return null;
  }
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpiringSoon,
  generateTokenPair,
  refreshAccessToken,
  getTokenRemainingTime,
};