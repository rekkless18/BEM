import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Space, Button } from 'antd'
import {
  UserOutlined,
  MedicineBoxOutlined,
  ShopOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../utils/supabase'
import type { StatisticData } from '../types'

// 最近活动数据类型
interface RecentActivity {
  id: string
  type: string
  description: string
  time: string
  status: 'success' | 'warning' | 'error'
}

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState<StatisticData>({
    totalUsers: 0,
    totalDoctors: 0,
    totalProducts: 0,
    totalOrders: 0,
    userGrowth: 0,
    doctorGrowth: 0,
    productGrowth: 0,
    orderGrowth: 0,
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])

  // 加载统计数据
  const loadStatistics = async () => {
    try {
      // 模拟统计数据（实际项目中应该从数据库获取）
      const mockStats: StatisticData = {
        totalUsers: 1250,
        totalDoctors: 45,
        totalProducts: 320,
        totalOrders: 890,
        userGrowth: 12.5,
        doctorGrowth: 8.3,
        productGrowth: 15.2,
        orderGrowth: -2.1,
      }
      
      setStatistics(mockStats)
      
      // 模拟最近活动数据
      const mockActivities: RecentActivity[] = [
        {
          id: '1',
          type: '用户注册',
          description: '新用户 张三 注册成功',
          time: '2024-01-15 14:30:25',
          status: 'success',
        },
        {
          id: '2',
          type: '医生审核',
          description: '医生 李医生 资质审核通过',
          time: '2024-01-15 13:45:12',
          status: 'success',
        },
        {
          id: '3',
          type: '商品上架',
          description: '商品 维生素C片 上架成功',
          time: '2024-01-15 12:20:08',
          status: 'success',
        },
        {
          id: '4',
          type: '订单异常',
          description: '订单 #12345 支付失败',
          time: '2024-01-15 11:15:33',
          status: 'error',
        },
        {
          id: '5',
          type: '系统维护',
          description: '数据库备份完成',
          time: '2024-01-15 10:00:00',
          status: 'warning',
        },
      ]
      
      setRecentActivities(mockActivities)
      
    } catch (error) {
      console.error('Failed to load statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatistics()
  }, [])

  // 统计卡片配置
  const statisticCards = [
    {
      title: '总用户数',
      value: statistics.totalUsers,
      growth: statistics.userGrowth,
      icon: <UserOutlined style={{ color: '#1890ff' }} />,
      color: '#1890ff',
    },
    {
      title: '医生数量',
      value: statistics.totalDoctors,
      growth: statistics.doctorGrowth,
      icon: <MedicineBoxOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a',
    },
    {
      title: '商品数量',
      value: statistics.totalProducts,
      growth: statistics.productGrowth,
      icon: <ShopOutlined style={{ color: '#faad14' }} />,
      color: '#faad14',
    },
    {
      title: '订单数量',
      value: statistics.totalOrders,
      growth: statistics.orderGrowth,
      icon: <EyeOutlined style={{ color: '#f5222d' }} />,
      color: '#f5222d',
    },
  ]

  // 最近活动表格列配置
  const activityColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          success: { color: 'green', text: '成功' },
          warning: { color: 'orange', text: '警告' },
          error: { color: 'red', text: '错误' },
        }
        const config = statusConfig[status as keyof typeof statusConfig]
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
  ]

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>仪表板</h1>
        <p>欢迎回来，{user?.name}！</p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statisticCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card className="statistic-card">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ fontSize: 24, marginRight: 16 }}>
                  {card.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <Statistic
                    title={card.title}
                    value={card.value}
                    valueStyle={{ color: card.color }}
                  />
                  <div style={{ marginTop: 8 }}>
                    {card.growth >= 0 ? (
                      <span style={{ color: '#52c41a' }}>
                        <ArrowUpOutlined /> +{card.growth}%
                      </span>
                    ) : (
                      <span style={{ color: '#f5222d' }}>
                        <ArrowDownOutlined /> {card.growth}%
                      </span>
                    )}
                    <span style={{ marginLeft: 8, color: '#8c8c8c' }}>较上月</span>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 最近活动 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="最近活动"
            extra={
              <Button type="link" size="small">
                查看全部
              </Button>
            }
          >
            <Table
              columns={activityColumns}
              dataSource={recentActivities}
              rowKey="id"
              pagination={false}
              loading={loading}
              size="small"
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="快速操作">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" block>
                添加医生
              </Button>
              <Button block>
                添加商品
              </Button>
              <Button block>
                查看订单
              </Button>
              <Button block>
                系统设置
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DashboardPage