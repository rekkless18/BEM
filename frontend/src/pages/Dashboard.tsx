import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Tag, 
  Space, 
  Button,
  DatePicker,
  Select,
  Typography,
  Divider
} from 'antd';
import {
  UserOutlined,
  ShoppingCartOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  RiseOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// 统计数据接口
interface StatisticsData {
  totalUsers: number; // 总用户数
  totalOrders: number; // 总订单数
  totalConsultations: number; // 总咨询数
  totalRevenue: number; // 总收入
  todayUsers: number; // 今日新增用户
  todayOrders: number; // 今日订单
  todayConsultations: number; // 今日咨询
  todayRevenue: number; // 今日收入
}

// 最近活动接口
interface RecentActivity {
  id: string;
  type: 'user' | 'order' | 'consultation'; // 活动类型
  title: string; // 活动标题
  description: string; // 活动描述
  time: string; // 活动时间
  status: 'success' | 'warning' | 'error' | 'processing'; // 状态
}

/**
 * 仪表板页面组件
 * 显示系统概览数据、统计图表和最近活动
 */
const Dashboard: React.FC = () => {
  const { user } = useAuthStore(); // 当前用户信息
  const [loading, setLoading] = useState(false); // 加载状态
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalUsers: 0,
    totalOrders: 0,
    totalConsultations: 0,
    totalRevenue: 0,
    todayUsers: 0,
    todayOrders: 0,
    todayConsultations: 0,
    todayRevenue: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);

  /**
   * 获取统计数据
   */
  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // 模拟API调用获取统计数据
      // 实际项目中应该调用真实的API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatistics({
        totalUsers: 1248,
        totalOrders: 856,
        totalConsultations: 432,
        totalRevenue: 125680,
        todayUsers: 23,
        todayOrders: 15,
        todayConsultations: 8,
        todayRevenue: 3420,
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取最近活动数据
   */
  const fetchRecentActivities = async () => {
    try {
      // 模拟API调用获取最近活动
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setRecentActivities([
        {
          id: '1',
          type: 'user',
          title: '新用户注册',
          description: '用户 张三 完成注册',
          time: '2024-01-20 14:30:00',
          status: 'success'
        },
        {
          id: '2',
          type: 'order',
          title: '新订单',
          description: '订单 #ORD20240120001 已创建',
          time: '2024-01-20 14:25:00',
          status: 'processing'
        },
        {
          id: '3',
          type: 'consultation',
          title: '在线咨询',
          description: '患者 李四 发起咨询',
          time: '2024-01-20 14:20:00',
          status: 'warning'
        },
        {
          id: '4',
          type: 'order',
          title: '订单完成',
          description: '订单 #ORD20240120002 已完成',
          time: '2024-01-20 14:15:00',
          status: 'success'
        },
        {
          id: '5',
          type: 'user',
          title: '用户登录',
          description: '用户 王五 登录系统',
          time: '2024-01-20 14:10:00',
          status: 'success'
        }
      ]);
    } catch (error) {
      console.error('获取最近活动失败:', error);
    }
  };

  /**
   * 组件挂载时获取数据
   */
  useEffect(() => {
    fetchStatistics();
    fetchRecentActivities();
  }, [dateRange]);

  /**
   * 获取活动类型图标
   */
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <UserOutlined style={{ color: '#52c41a' }} />;
      case 'order':
        return <ShoppingCartOutlined style={{ color: '#1890ff' }} />;
      case 'consultation':
        return <MedicineBoxOutlined style={{ color: '#faad14' }} />;
      default:
        return <EyeOutlined />;
    }
  };

  /**
   * 最近活动表格列配置
   */
  const activityColumns: ColumnsType<RecentActivity> = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => getActivityIcon(type),
    },
    {
      title: '活动',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: RecentActivity) => (
        <div>
          <div style={{ fontWeight: 500 }}>{title}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.description}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          success: { color: 'success', text: '成功' },
          warning: { color: 'warning', text: '处理中' },
          error: { color: 'error', text: '失败' },
          processing: { color: 'processing', text: '进行中' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 150,
      render: (time: string) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {dayjs(time).format('MM-DD HH:mm')}
        </Text>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          仪表板
        </Title>
        <Text type="secondary">
          欢迎回来，{user?.name || user?.username}！
        </Text>
      </div>

      {/* 时间范围选择 */}
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Text>时间范围：</Text>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates) {
                setDateRange([dates[0]!, dates[1]!]);
              }
            }}
            format="YYYY-MM-DD"
          />
          <Button type="primary" onClick={fetchStatistics} loading={loading}>
            刷新数据
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={statistics.totalUsers}
              prefix={<UserOutlined />}
              suffix={`今日 +${statistics.todayUsers}`}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总订单数"
              value={statistics.totalOrders}
              prefix={<ShoppingCartOutlined />}
              suffix={`今日 +${statistics.todayOrders}`}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总咨询数"
              value={statistics.totalConsultations}
              prefix={<MedicineBoxOutlined />}
              suffix={`今日 +${statistics.todayConsultations}`}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总收入"
              value={statistics.totalRevenue}
              prefix={<DollarOutlined />}
              suffix={`今日 +${statistics.todayRevenue}`}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 内容区域 */}
      <Row gutter={[16, 16]}>
        {/* 最近活动 */}
        <Col xs={24} lg={12}>
          <Card 
            title="最近活动" 
            extra={
              <Button 
                type="link" 
                icon={<RiseOutlined />}
                onClick={fetchRecentActivities}
              >
                刷新
              </Button>
            }
          >
            <Table
              columns={activityColumns}
              dataSource={recentActivities}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>

        {/* 快速操作 */}
        <Col xs={24} lg={12}>
          <Card title="快速操作">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Button 
                  type="primary" 
                  block 
                  icon={<UserOutlined />}
                  onClick={() => window.location.href = '/users'}
                >
                  用户管理
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  block 
                  icon={<ShoppingCartOutlined />}
                  onClick={() => window.location.href = '/orders'}
                >
                  订单管理
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  block 
                  icon={<MedicineBoxOutlined />}
                  onClick={() => window.location.href = '/consultations'}
                >
                  咨询管理
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  block 
                  icon={<DollarOutlined />}
                  onClick={() => window.location.href = '/products'}
                >
                  商品管理
                </Button>
              </Col>
            </Row>
            
            <Divider />
            
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                当前角色：{user?.role} | 最后登录：{user?.last_login_at ? dayjs(user.last_login_at).format('YYYY-MM-DD HH:mm') : '首次登录'}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;