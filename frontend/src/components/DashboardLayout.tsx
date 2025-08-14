import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Space } from 'antd'
import type { MenuProps } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  ShopOutlined,
  BulbOutlined,
  SettingOutlined,
  LogoutOutlined,
  TeamOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SafetyOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import type { MenuItem } from '../types'

type MenuItemType = Required<MenuProps>['items'][number]

const { Header, Sider, Content } = Layout

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, hasPermission } = useAuthStore()

  // 菜单配置
  const menuItems: MenuItem[] = [
    {
      key: '/dashboard',
      label: '仪表板',
      icon: <DashboardOutlined />,
      path: '/dashboard',
    },
    {
      key: 'medical',
      label: '医疗服务管理',
      icon: <MedicineBoxOutlined />,
      children: [
        {
          key: '/medical/doctors',
          label: '医生配置',
          icon: <TeamOutlined />,
          path: '/medical/doctors',
          permission: 'medical_admin',
        },
        {
          key: '/medical/departments',
          label: '科室配置',
          icon: <AppstoreOutlined />,
          path: '/medical/departments',
          permission: 'medical_admin',
        },
      ],
    },
    {
      key: 'mall',
      label: '商城管理',
      icon: <ShopOutlined />,
      children: [
        {
          key: '/mall/inventory',
          label: '库存配置',
          icon: <BarChartOutlined />,
          path: '/mall/inventory',
          permission: 'mall_admin',
        },
        {
          key: '/mall/products',
          label: '商品管理',
          icon: <AppstoreOutlined />,
          path: '/mall/products',
          permission: 'mall_admin',
        },
      ],
    },
    {
      key: 'marketing',
      label: '营销管理',
      icon: <BulbOutlined />,
      children: [
        {
          key: '/marketing/miniapp',
          label: '小程序配置',
          icon: <AppstoreOutlined />,
          path: '/marketing/miniapp',
          permission: 'marketing_admin',
        },
        {
          key: '/marketing/articles',
          label: '医疗讯息配置',
          icon: <FileTextOutlined />,
          path: '/marketing/articles',
          permission: 'marketing_admin',
        },
      ],
    },
    {
      key: 'system',
      label: '系统管理',
      icon: <SettingOutlined />,
      children: [
        {
          key: '/system/permissions',
          label: '权限配置',
          icon: <SafetyOutlined />,
          path: '/system/permissions',
          permission: 'super_admin',
        },
        {
          key: '/system/accounts',
          label: '账号配置',
          icon: <UserOutlined />,
          path: '/system/accounts',
          permission: 'super_admin',
        },
      ],
    },
  ]

  // 过滤菜单项（根据权限）
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter((item) => {
        if (item.permission && !hasPermission(item.permission)) {
          return false
        }
        return true
      })
      .map((item) => ({
        ...item,
        children: item.children ? filterMenuItems(item.children) : undefined,
      }))
      .filter((item) => !item.children || item.children.length > 0)
  }

  // 转换为 Antd Menu 组件所需的格式
  const convertToAntdMenuItems = (items: MenuItem[]): MenuItemType[] => {
    return items.map((item) => ({
      key: item.key,
      label: item.label,
      icon: item.icon,
      children: item.children && item.children.length > 0 ? convertToAntdMenuItems(item.children) : undefined,
    }))
  }

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    const menuItem = findMenuItem(menuItems, key)
    if (menuItem?.path) {
      navigate(menuItem.path)
    }
  }

  // 查找菜单项
  const findMenuItem = (items: MenuItem[], key: string): MenuItem | null => {
    for (const item of items) {
      if (item.key === key) {
        return item
      }
      if (item.children) {
        const found = findMenuItem(item.children, key)
        if (found) return found
      }
    }
    return null
  }

  // 获取当前选中的菜单key
  const getSelectedKeys = () => {
    return [location.pathname]
  }

  // 获取当前展开的菜单key
  const getOpenKeys = () => {
    const path = location.pathname
    if (path.startsWith('/medical')) return ['medical']
    if (path.startsWith('/mall')) return ['mall']
    if (path.startsWith('/marketing')) return ['marketing']
    if (path.startsWith('/system')) return ['system']
    return []
  }

  // 处理登出
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      label: '个人信息',
      icon: <UserOutlined />,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ]

  return (
    <Layout className="dashboard-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="dashboard-sider"
        width={256}
      >
        <div className="dashboard-logo" style={{ padding: '16px', textAlign: 'center' }}>
          {collapsed ? 'BEM' : 'BEM后台管理'}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={convertToAntdMenuItems(filterMenuItems(menuItems))}
          onClick={handleMenuClick}
        />
      </Sider>
      
      <Layout>
        <Header className="dashboard-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          
          <div className="dashboard-user">
            <Space>
              <span>欢迎，{user?.name}</span>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Avatar
                  style={{ backgroundColor: '#1890ff', cursor: 'pointer' }}
                  icon={<UserOutlined />}
                />
              </Dropdown>
            </Space>
          </div>
        </Header>
        
        <Content className="dashboard-content">
          <div className="page-transition">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default DashboardLayout