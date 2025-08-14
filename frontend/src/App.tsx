import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuthStore } from './stores/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DoctorManagement from './pages/DoctorManagement';
import DepartmentManagement from './pages/DepartmentManagement';
import ProductManagement from './pages/ProductManagement';
import CarouselManagement from './pages/CarouselManagement';
import ArticleManagement from './pages/ArticleManagement';
import CommunityCarouselManagement from './pages/Community/CarouselImageManagement';
import CommunityArticleManagement from './pages/Community/ArticleManagement';
import AdminManagement from './pages/AdminManagement';
import UserManagement from './pages/UserManagement';
import ConsultationManagement from './pages/ConsultationManagement';
import OrderManagement from './pages/OrderManagement';
import HealthRecordManagement from './pages/HealthRecordManagement';
import DeviceManagement from './pages/DeviceManagement';
import 'dayjs/locale/zh-cn';
import dayjs from 'dayjs';

// 设置dayjs为中文
dayjs.locale('zh-cn');

/**
 * 主应用组件
 * 配置路由、国际化和全局状态管理
 */
const App: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  /**
   * 应用启动时检查认证状态
   */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 应用加载中
  if (isLoading) {
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
          正在加载应用...
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider 
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <AntdApp>
        <Router>
          <Routes>
            {/* 登录页面 */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login />
                )
              } 
            />
            
            {/* 受保护的路由 */}
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* 仪表板 */}
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* 用户管理 */}
              <Route path="users" element={<UserManagement />} />
              <Route path="users/create" element={<div style={{ padding: '24px' }}>添加用户页面开发中...</div>} />
              
              {/* 医疗服务管理 */}
              <Route path="doctors" element={<DoctorManagement />} />
              <Route path="departments" element={<DepartmentManagement />} />
              <Route path="consultations" element={<ConsultationManagement />} />
              <Route path="health-records" element={<HealthRecordManagement />} />
              <Route path="devices" element={<DeviceManagement />} />
              
              {/* 商城管理 */}
              <Route path="products" element={<ProductManagement />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="categories" element={<div style={{ padding: '24px' }}>分类管理页面开发中...</div>} />
              
              {/* 营销管理 */}
              <Route path="carousel" element={<CarouselManagement />} />
              <Route path="articles" element={<ArticleManagement />} />
              <Route path="promotions" element={<div style={{ padding: '24px' }}>促销活动页面开发中...</div>} />
              <Route path="coupons" element={<div style={{ padding: '24px' }}>优惠券页面开发中...</div>} />
              <Route path="analytics" element={<div style={{ padding: '24px' }}>数据分析页面开发中...</div>} />
              
              {/* 社区管理 */}
              <Route path="community/carousel-images" element={<CommunityCarouselManagement />} />
              <Route path="community/articles" element={<CommunityArticleManagement />} />
              
              {/* 系统管理 */}
              <Route path="admin-users" element={<AdminManagement />} />
              <Route path="system-settings" element={<div style={{ padding: '24px' }}>系统设置页面开发中...</div>} />
              <Route path="logs" element={<div style={{ padding: '24px' }}>系统日志页面开发中...</div>} />
              
              {/* 个人中心 */}
              <Route path="profile" element={<div style={{ padding: '24px' }}>个人资料页面开发中...</div>} />
              <Route path="settings" element={<div style={{ padding: '24px' }}>账户设置页面开发中...</div>} />
              
              {/* 默认重定向到仪表板 */}
              <Route path="" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;