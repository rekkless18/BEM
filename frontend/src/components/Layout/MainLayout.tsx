import React, { useState } from 'react';
import {
  Layout,
  Menu,
  Button,
  Dropdown,
  Avatar,
  Space,
  Typography,
  Breadcrumb,
  theme,
  message
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  ShoppingCartOutlined,
  BulbOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, hasAnyRole } from '../../stores/authStore';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

/**
 * 主布局组件
 * 提供系统的整体布局结构，包含侧边栏导航、头部和内容区域
 */
const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false); // 侧边栏折叠状态
  const navigate = useNavigate(); // 路由导航
  const location = useLocation(); // 当前路由
  const { user, logout } = useAuthStore(); // 用户信息和登出方法
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  /**
   * 处理用户登出
   */
  const handleLogout = () => {
    logout();
    message.success('已安全退出');
    navigate('/login');
  };

  /**
   * 用户下拉菜单配置
   */
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账户设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      label: '帮助中心',
      onClick: () => window.open('/help', '_blank'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  /**
   * 侧边栏菜单配置
   * 根据用户角色显示不同的菜单项
   */
  const getMenuItems = (): MenuProps['items'] => {
    const baseItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '仪表板',
        onClick: () => navigate('/dashboard'),
      },
    ];

    // 用户管理 - 所有管理员都可以访问
    if (user) {
      baseItems.push({
        key: 'users',
        icon: <UserOutlined />,
        label: '用户管理',
        children: [
          {
            key: '/users',
            label: '用户列表',
            onClick: () => navigate('/users'),
          },
        ],
      });
    }

    // 医疗服务管理 - 医疗管理员和超级管理员
    if (hasAnyRole(['medical_admin', 'super_admin'])) {
      baseItems.push({
        key: 'medical',
        icon: <MedicineBoxOutlined />,
        label: '医疗服务',
        children: [
          {
            key: '/doctors',
            label: '医生管理',
            onClick: () => navigate('/doctors'),
          },
          {
            key: '/departments',
            label: '科室管理',
            onClick: () => navigate('/departments'),
          },
          {
            key: '/devices',
            label: '设备管理',
            onClick: () => navigate('/devices'),
          },
        ],
      });
    }

    // 商城管理 - 商城管理员和超级管理员
    if (hasAnyRole(['mall_admin', 'super_admin'])) {
      baseItems.push({
        key: 'mall',
        icon: <ShoppingCartOutlined />,
        label: '商城管理',
        children: [
          {
            key: '/products',
            label: '商品管理',
            onClick: () => navigate('/products'),
          },
          {
            key: '/orders',
            label: '订单管理',
            onClick: () => navigate('/orders'),
          },
          {
            key: '/categories',
            label: '分类管理',
            onClick: () => navigate('/categories'),
          },
        ],
      });
    }

    // 营销管理 - 营销管理员和超级管理员
    if (hasAnyRole(['marketing_admin', 'super_admin'])) {
      baseItems.push({
        key: 'marketing',
        icon: <BulbOutlined />,
        label: '营销管理',
        children: [
          {
            key: '/promotions',
            label: '促销活动',
            onClick: () => navigate('/promotions'),
          },
          {
            key: '/coupons',
            label: '优惠券',
            onClick: () => navigate('/coupons'),
          },
          {
            key: '/analytics',
            label: '数据分析',
            onClick: () => navigate('/analytics'),
          },
        ],
      });
    }

    // 社区管理 - 营销管理员和超级管理员
    if (hasAnyRole(['marketing_admin', 'super_admin'])) {
      baseItems.push({
        key: 'community',
        icon: <TeamOutlined />,
        label: '社区管理',
        children: [
          {
            key: '/community/carousel-images',
            label: '轮播图管理',
            onClick: () => navigate('/community/carousel-images'),
          },
          {
            key: '/community/articles',
            label: '文章管理',
            onClick: () => navigate('/community/articles'),
          },
        ],
      });
    }

    // 系统管理 - 仅超级管理员
    if (hasAnyRole(['super_admin'])) {
      baseItems.push({
        key: 'system',
        icon: <SettingOutlined />,
        label: '系统管理',
        children: [
          {
            key: '/admin-users',
            label: '管理员管理',
            onClick: () => navigate('/admin-users'),
          },
          {
            key: '/system-settings',
            label: '系统设置',
            onClick: () => navigate('/system-settings'),
          },
          {
            key: '/logs',
            label: '系统日志',
            onClick: () => navigate('/logs'),
          },
        ],
      });
    }

    return baseItems;
  };

  /**
   * 获取当前选中的菜单项
   */
  const getSelectedKeys = (): string[] => {
    const pathname = location.pathname;
    return [pathname];
  };

  /**
   * 获取当前展开的菜单项
   */
  const getOpenKeys = (): string[] => {
    const pathname = location.pathname;
    const openKeys: string[] = [];
    
    if (pathname.startsWith('/users')) openKeys.push('users');
    if (pathname.startsWith('/doctors') || pathname.startsWith('/departments') || 
        pathname.startsWith('/devices')) {
      openKeys.push('medical');
    }
    if (pathname.startsWith('/products') || pathname.startsWith('/orders') || 
        pathname.startsWith('/categories')) {
      openKeys.push('mall');
    }
    if (pathname.startsWith('/promotions') || pathname.startsWith('/coupons') || 
        pathname.startsWith('/analytics')) {
      openKeys.push('marketing');
    }
    if (pathname.startsWith('/community')) {
      openKeys.push('community');
    }
    if (pathname.startsWith('/admin-users') || pathname.startsWith('/system-settings') || 
        pathname.startsWith('/logs')) {
      openKeys.push('system');
    }
    
    return openKeys;
  };

  /**
   * 生成面包屑导航
   */
  const getBreadcrumbItems = () => {
    const pathname = location.pathname;
    const pathSegments = pathname.split('/').filter(Boolean);
    
    const breadcrumbItems = [
      {
        title: '首页',
        href: '/dashboard',
      },
    ];

    // 根据路径生成面包屑
    const pathMap: Record<string, string> = {
      dashboard: '仪表板',
      users: '用户管理',
      doctors: '医生管理',
      departments: '科室管理',

      devices: '设备管理',
      products: '商品管理',
      orders: '订单管理',
      categories: '分类管理',
      promotions: '促销活动',
      coupons: '优惠券',
      analytics: '数据分析',
      community: '社区管理',
      'carousel-images': '轮播图管理',
      articles: '文章管理',
      'admin-users': '管理员管理',
      'system-settings': '系统设置',
      logs: '系统日志',
      create: '新建',
      edit: '编辑',
    };

    pathSegments.forEach((segment, index) => {
      const title = pathMap[segment] || segment;
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      
      breadcrumbItems.push({
        title,
        href: index === pathSegments.length - 1 ? undefined : href,
      });
    });

    return breadcrumbItems;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: colorBgContainer,
          borderRight: '1px solid #f0f0f0',
        }}
      >
        {/* Logo区域 */}
        <div 
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 24px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {collapsed ? (
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
              B
            </div>
          ) : (
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
              BEM管理系统
            </div>
          )}
        </div>
        
        {/* 导航菜单 */}
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={getMenuItems()}
          style={{ borderRight: 0 }}
        />
      </Sider>
      
      <Layout>
        {/* 头部 */}
        <Header 
          style={{ 
            padding: '0 24px', 
            background: colorBgContainer,
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* 左侧：折叠按钮和面包屑 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 40, height: 40 }}
            />
            
            <Breadcrumb items={getBreadcrumbItems()} />
          </div>
          
          {/* 右侧：通知和用户信息 */}
          <Space size="middle">
            {/* 通知按钮 */}
            <Button 
              type="text" 
              icon={<BellOutlined />} 
              style={{ fontSize: '16px' }}
              onClick={() => message.info('暂无新通知')}
            />
            
            {/* 用户下拉菜单 */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar 
                  size="small" 
                  icon={<UserOutlined />} 
                  style={{ backgroundColor: '#1890ff' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: '14px', fontWeight: 500 }}>
                    {user?.name || user?.username}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {user?.role === 'super_admin' ? '超级管理员' :
                     user?.role === 'medical_admin' ? '医疗管理员' :
                     user?.role === 'mall_admin' ? '商城管理员' :
                     user?.role === 'marketing_admin' ? '营销管理员' : '管理员'}
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        {/* 内容区域 */}
        <Content
          style={{
            margin: 0,
            minHeight: 280,
            background: '#f5f5f5',
            overflow: 'auto'
          }}
        >
          <div
            style={{
              padding: 0,
              minHeight: '100%',
              background: colorBgContainer,
              borderRadius: collapsed ? 0 : borderRadiusLG,
              margin: '16px',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;