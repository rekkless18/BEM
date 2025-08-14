import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

// 认证状态接口
interface AuthState {
  user: User | null; // 当前用户信息
  token: string | null; // 认证token
  isAuthenticated: boolean; // 是否已认证
  isLoading: boolean; // 是否正在加载
}

// 认证操作接口
interface AuthActions {
  login: (user: User, token: string) => void; // 登录
  logout: () => void; // 登出
  updateUser: (user: Partial<User>) => void; // 更新用户信息
  setLoading: (loading: boolean) => void; // 设置加载状态
  checkAuth: () => Promise<boolean>; // 检查认证状态
  hasPermission: (permission: string) => boolean; // 检查权限
}

// 认证store类型
type AuthStore = AuthState & AuthActions;

/**
 * 认证状态管理store
 * 使用zustand管理用户认证状态，支持持久化存储
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      /**
       * 用户登录
       * @param user - 用户信息
       * @param token - 认证token
       */
      login: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        
        // 将token存储到localStorage，用于API请求
        localStorage.setItem('auth_token', token);
      },

      /**
       * 用户登出
       * 清除所有认证信息
       */
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        
        // 清除localStorage中的token
        localStorage.removeItem('auth_token');
        localStorage.removeItem('rememberedUsername');
      },

      /**
       * 更新用户信息
       * @param userData - 部分用户信息
       */
      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...userData },
          });
        }
      },

      /**
       * 设置加载状态
       * @param loading - 加载状态
       */
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      /**
       * 检查用户权限
       * @param permission - 权限名称
       * @returns boolean - 是否有权限
       */
      hasPermission: (permission: string): boolean => {
        const { user } = get();
        if (!user) return false;
        
        // 超级管理员拥有所有权限
        if (user.role === 'super_admin') return true;
        
        // 管理员拥有大部分权限
        if (user.role === 'admin') {
          const adminPermissions = [
            'user.read', 'user.create', 'user.update', 'user.delete',
            'doctor.read', 'doctor.create', 'doctor.update', 'doctor.delete',
            'department.read', 'department.create', 'department.update', 'department.delete',
            'consultation.read', 'consultation.create', 'consultation.update', 'consultation.delete',
            'device.read', 'device.create', 'device.update', 'device.delete',
            'article.read', 'article.create', 'article.update', 'article.delete'
          ];
          return adminPermissions.includes(permission);
        }
        
        // 普通用户权限
        if (user.role === 'user') {
          const userPermissions = [
            'user.read', 'consultation.read', 'consultation.create',
            'device.read', 'article.read'
          ];
          return userPermissions.includes(permission);
        }
        
        return false;
      },

      /**
       * 检查认证状态
       * 验证当前token是否有效
       * @returns Promise<boolean> - 认证是否有效
       */
      checkAuth: async (): Promise<boolean> => {
        const { token } = get();
        
        if (!token) {
          return false;
        }

        try {
          set({ isLoading: true });
          
          // 获取API基础URL
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
          
          // 调用后端验证token接口
          const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.user) {
              // token有效，更新用户信息
              set({
                user: data.data.user,
                isAuthenticated: true,
                isLoading: false,
              });
              return true;
            }
          }
          
          // token无效，清除认证信息
          get().logout();
          return false;
        } catch (error) {
          console.error('认证检查失败:', error);
          get().logout();
          return false;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        // 只持久化必要的状态，不包括isLoading
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * 获取认证token的工具函数
 * @returns string | null - 认证token
 */
export const getAuthToken = (): string | null => {
  return useAuthStore.getState().token || localStorage.getItem('auth_token');
};

/**
 * 检查用户是否有指定角色权限
 * @param requiredRole - 需要的角色
 * @returns boolean - 是否有权限
 */
export const hasRole = (requiredRole: string): boolean => {
  const { user } = useAuthStore.getState();
  if (!user) return false;
  
  // 超级管理员拥有所有权限
  if (user.role === 'super_admin') return true;
  
  // 检查具体角色
  return user.role === requiredRole;
};

/**
 * 检查用户是否有任一指定角色权限
 * @param roles - 角色数组
 * @returns boolean - 是否有权限
 */
export const hasAnyRole = (roles: string[]): boolean => {
  const { user } = useAuthStore.getState();
  if (!user) return false;
  
  // 超级管理员拥有所有权限
  if (user.role === 'super_admin') return true;
  
  // 检查是否有任一角色
  return roles.includes(user.role);
};