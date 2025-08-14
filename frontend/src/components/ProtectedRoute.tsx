import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '../stores/authStore';

// 路由保护组件属性接口
interface ProtectedRouteProps {
  children: React.ReactNode; // 子组件
  requiredRoles?: string[]; // 需要的角色权限
}

/**
 * 路由保护组件
 * 用于保护需要认证的路由，验证用户登录状态和角色权限
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const location = useLocation(); // 当前路由位置
  const { isAuthenticated, user, isLoading, checkAuth } = useAuthStore(); // 认证状态
  const [authChecked, setAuthChecked] = useState(false); // 认证检查完成状态

  /**
   * 组件挂载时检查认证状态
   */
  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated) {
        // 如果未认证，尝试验证token
        await checkAuth();
      }
      setAuthChecked(true);
    };

    verifyAuth();
  }, [isAuthenticated, checkAuth]);

  /**
   * 检查用户是否有所需角色权限
   * @returns boolean - 是否有权限
   */
  const hasRequiredRole = (): boolean => {
    if (!user) return false;
    
    // 如果没有指定角色要求，只需要登录即可
    if (requiredRoles.length === 0) return true;
    
    // 超级管理员拥有所有权限
    if (user.role === 'super_admin') return true;
    
    // 检查用户角色是否在所需角色列表中
    return requiredRoles.includes(user.role);
  };

  // 正在加载认证状态
  if (isLoading || !authChecked) {
    return (
      <div 
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <Spin size="large" />
        <div style={{ color: '#666', fontSize: '14px' }}>
          正在验证身份...
        </div>
      </div>
    );
  }

  // 未认证，重定向到登录页
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // 已认证但没有所需角色权限
  if (!hasRequiredRole()) {
    return (
      <div 
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '16px',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '48px', color: '#ff4d4f' }}>🚫</div>
        <h2 style={{ color: '#333', margin: 0 }}>访问被拒绝</h2>
        <p style={{ color: '#666', margin: 0 }}>
          您没有访问此页面的权限
        </p>
        <p style={{ color: '#999', fontSize: '12px', margin: '8px 0 0 0' }}>
          当前角色: {user?.role} | 需要角色: {requiredRoles.join(', ')}
        </p>
      </div>
    );
  }

  // 认证通过且有权限，渲染子组件
  return <>{children}</>;
};

export default ProtectedRoute;