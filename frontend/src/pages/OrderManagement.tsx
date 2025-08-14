import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Avatar,
  Descriptions,
  Badge,
  Divider,
  Image
} from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  DollarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * 订单项接口
 */
interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  total_price: number;
  product?: {
    id: string;
    name: string;
    image_url?: string;
    price: number;
  };
}

/**
 * 订单数据接口
 */
interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: 'alipay' | 'wechat' | 'card' | 'cash';
  total_amount: number;
  shipping_fee: number;
  discount_amount: number;
  final_amount: number;
  shipping_address: string;
  shipping_phone: string;
  shipping_name: string;
  notes?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  // 关联数据
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  order_items?: OrderItem[];
}

/**
 * 订单管理页面组件
 */
const OrderManagement: React.FC = () => {
  // 状态管理
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0
  });

  const [form] = Form.useForm();

  /**
   * 获取订单列表
   */
  const fetchOrders = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search: searchText,
        status: statusFilter,
        payment_status: paymentStatusFilter,
        payment_method: paymentMethodFilter
      });

      if (dateRange) {
        params.append('start_date', dateRange[0].format('YYYY-MM-DD'));
        params.append('end_date', dateRange[1].format('YYYY-MM-DD'));
      }

      const response = await fetch(`/api/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('获取订单列表失败');
      }

      const data = await response.json();
      if (data.success) {
        setOrders(data.data.orders);
        setPagination({
          current: data.data.pagination.page,
          pageSize: data.data.pagination.limit,
          total: data.data.pagination.total
        });
        
        // 更新统计数据
        updateStatistics(data.data.orders);
      } else {
        message.error(data.message || '获取订单列表失败');
      }
    } catch (error) {
      console.error('获取订单列表错误:', error);
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 更新统计数据
   */
  const updateStatistics = (orderList: Order[]) => {
    const total = orderList.length;
    const pending = orderList.filter(o => o.status === 'pending').length;
    const paid = orderList.filter(o => o.status === 'paid').length;
    const shipped = orderList.filter(o => o.status === 'shipped').length;
    const delivered = orderList.filter(o => o.status === 'delivered').length;
    const cancelled = orderList.filter(o => o.status === 'cancelled').length;
    const totalRevenue = orderList
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + o.final_amount, 0);

    setStatistics({ 
      total, 
      pending, 
      paid, 
      shipped, 
      delivered, 
      cancelled, 
      totalRevenue 
    });
  };

  /**
   * 更新订单状态
   */
  const updateOrderStatus = async (id: string, status: string, notes?: string) => {
    try {
      const updateData: any = {
        status,
        notes
      };

      // 根据状态设置相应的时间戳
      if (status === 'shipped') {
        updateData.shipped_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('更新订单状态失败');
      }

      const data = await response.json();
      if (data.success) {
        message.success('更新订单状态成功');
        setEditModalVisible(false);
        form.resetFields();
        fetchOrders(pagination.current, pagination.pageSize);
      } else {
        message.error(data.message || '更新订单状态失败');
      }
    } catch (error) {
      console.error('更新订单状态错误:', error);
      message.error('更新订单状态失败');
    }
  };

  /**
   * 查看订单详情
   */
  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  /**
   * 编辑订单
   */
  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    form.setFieldsValue({
      status: order.status,
      payment_status: order.payment_status,
      notes: order.notes
    });
    setEditModalVisible(true);
  };

  /**
   * 搜索处理
   */
  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchOrders(1, pagination.pageSize);
  };

  /**
   * 重置搜索
   */
  const handleReset = () => {
    setSearchText('');
    setStatusFilter('all');
    setPaymentStatusFilter('all');
    setPaymentMethodFilter('all');
    setDateRange(null);
    setPagination({ ...pagination, current: 1 });
    fetchOrders(1, pagination.pageSize);
  };

  // 订单状态配置
  const statusConfig = {
    pending: { color: 'orange', text: '待支付' },
    paid: { color: 'blue', text: '已支付' },
    shipped: { color: 'purple', text: '已发货' },
    delivered: { color: 'green', text: '已送达' },
    cancelled: { color: 'red', text: '已取消' },
    refunded: { color: 'gray', text: '已退款' }
  };

  // 支付状态配置
  const paymentStatusConfig = {
    pending: { color: 'orange', text: '待支付' },
    paid: { color: 'green', text: '已支付' },
    failed: { color: 'red', text: '支付失败' },
    refunded: { color: 'gray', text: '已退款' }
  };

  // 支付方式配置
  const paymentMethodConfig = {
    alipay: { text: '支付宝' },
    wechat: { text: '微信支付' },
    card: { text: '银行卡' },
    cash: { text: '现金' }
  };

  // 表格列定义
  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'order_number',
      key: 'order_number',
      width: 150,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
          {text}
        </span>
      )
    },
    {
      title: '客户',
      key: 'user',
      width: 150,
      render: (_, record: Order) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar icon={<UserOutlined />} size="small" />
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {record.user?.name || '未知用户'}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.user?.phone || record.user?.email}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '商品数量',
      key: 'items_count',
      width: 100,
      render: (_, record: Order) => (
        <span>{record.order_items?.length || 0} 件</span>
      )
    },
    {
      title: '订单金额',
      dataIndex: 'final_amount',
      key: 'final_amount',
      width: 120,
      render: (amount: number) => (
        <span style={{ fontWeight: 'bold', color: '#f50' }}>
          ¥{amount.toFixed(2)}
        </span>
      )
    },
    {
      title: '支付方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 100,
      render: (method: string) => (
        <Tag>{paymentMethodConfig[method as keyof typeof paymentMethodConfig]?.text || method}</Tag>
      )
    },
    {
      title: '支付状态',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 100,
      render: (status: string) => {
        const config = paymentStatusConfig[status as keyof typeof paymentStatusConfig];
        return (
          <Tag color={config?.color}>
            {config?.text || status}
          </Tag>
        );
      }
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <Badge
            status={config?.color as any}
            text={config?.text || status}
          />
        );
      }
    },
    {
      title: '收货人',
      dataIndex: 'shipping_name',
      key: 'shipping_name',
      width: 120
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record: Order) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            size="small"
          >
            详情
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            处理
          </Button>
        </Space>
      )
    }
  ];

  // 组件挂载时获取数据
  useEffect(() => {
    fetchOrders();
  }, []);

  // 搜索条件变化时重新获取数据
  useEffect(() => {
    if (searchText || statusFilter !== 'all' || paymentStatusFilter !== 'all' || paymentMethodFilter !== 'all' || dateRange) {
      const timer = setTimeout(() => {
        fetchOrders(1, pagination.pageSize);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchText, statusFilter, paymentStatusFilter, paymentMethodFilter, dateRange]);

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="总订单数"
              value={statistics.total}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="待支付"
              value={statistics.pending}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已支付"
              value={statistics.paid}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已发货"
              value={statistics.shipped}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已送达"
              value={statistics.delivered}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="总收入"
              value={statistics.totalRevenue}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#f50' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选区域 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col span={5}>
            <Input
              placeholder="搜索订单号或收货人"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col span={3}>
            <Select
              placeholder="订单状态"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部状态</Option>
              <Option value="pending">待支付</Option>
              <Option value="paid">已支付</Option>
              <Option value="shipped">已发货</Option>
              <Option value="delivered">已送达</Option>
              <Option value="cancelled">已取消</Option>
              <Option value="refunded">已退款</Option>
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="支付状态"
              value={paymentStatusFilter}
              onChange={setPaymentStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部支付状态</Option>
              <Option value="pending">待支付</Option>
              <Option value="paid">已支付</Option>
              <Option value="failed">支付失败</Option>
              <Option value="refunded">已退款</Option>
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="支付方式"
              value={paymentMethodFilter}
              onChange={setPaymentMethodFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部支付方式</Option>
              <Option value="alipay">支付宝</Option>
              <Option value="wechat">微信支付</Option>
              <Option value="card">银行卡</Option>
              <Option value="cash">现金</Option>
            </Select>
          </Col>
          <Col span={4}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
          <Col span={6}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                搜索
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                重置
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={() => message.info('导出功能开发中...')}
              >
                导出
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 订单表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
              fetchOrders(page, pageSize);
            }
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 订单详情模态框 */}
      <Modal
        title="订单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={900}
      >
        {selectedOrder && (
          <div>
            {/* 基本信息 */}
            <Descriptions title="订单信息" column={2} bordered>
              <Descriptions.Item label="订单号" span={2}>
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                  {selectedOrder.order_number}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="客户姓名">
                {selectedOrder.user?.name || '未知用户'}
              </Descriptions.Item>
              <Descriptions.Item label="客户联系方式">
                {selectedOrder.user?.phone || selectedOrder.user?.email || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Badge
                  status={statusConfig[selectedOrder.status as keyof typeof statusConfig]?.color as any}
                  text={statusConfig[selectedOrder.status as keyof typeof statusConfig]?.text}
                />
              </Descriptions.Item>
              <Descriptions.Item label="支付状态">
                <Tag color={paymentStatusConfig[selectedOrder.payment_status as keyof typeof paymentStatusConfig]?.color}>
                  {paymentStatusConfig[selectedOrder.payment_status as keyof typeof paymentStatusConfig]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="支付方式">
                {paymentMethodConfig[selectedOrder.payment_method as keyof typeof paymentMethodConfig]?.text}
              </Descriptions.Item>
              <Descriptions.Item label="商品总额">
                ¥{selectedOrder.total_amount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="运费">
                ¥{selectedOrder.shipping_fee.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="优惠金额">
                ¥{selectedOrder.discount_amount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="实付金额">
                <span style={{ fontWeight: 'bold', color: '#f50', fontSize: '16px' }}>
                  ¥{selectedOrder.final_amount.toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedOrder.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              {selectedOrder.shipped_at && (
                <Descriptions.Item label="发货时间">
                  {dayjs(selectedOrder.shipped_at).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}
              {selectedOrder.delivered_at && (
                <Descriptions.Item label="送达时间">
                  {dayjs(selectedOrder.delivered_at).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            {/* 收货信息 */}
            <Descriptions title="收货信息" column={2} bordered>
              <Descriptions.Item label="收货人">
                {selectedOrder.shipping_name}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {selectedOrder.shipping_phone}
              </Descriptions.Item>
              <Descriptions.Item label="收货地址" span={2}>
                {selectedOrder.shipping_address}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            {/* 商品信息 */}
            <div>
              <h3>商品信息</h3>
              <Table
                dataSource={selectedOrder.order_items}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: '商品',
                    key: 'product',
                    render: (_, item: OrderItem) => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.product?.image_url && (
                          <Image
                            src={item.product.image_url}
                            width={40}
                            height={40}
                            style={{ objectFit: 'cover' }}
                          />
                        )}
                        <span>{item.product?.name || '未知商品'}</span>
                      </div>
                    )
                  },
                  {
                    title: '单价',
                    dataIndex: 'price',
                    render: (price: number) => `¥${price.toFixed(2)}`
                  },
                  {
                    title: '数量',
                    dataIndex: 'quantity'
                  },
                  {
                    title: '小计',
                    dataIndex: 'total_price',
                    render: (total: number) => (
                      <span style={{ fontWeight: 'bold' }}>
                        ¥{total.toFixed(2)}
                      </span>
                    )
                  }
                ]}
              />
            </div>

            {selectedOrder.notes && (
              <div>
                <Divider />
                <Descriptions title="备注信息" column={1} bordered>
                  <Descriptions.Item label="订单备注">
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedOrder.notes}
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 处理订单模态框 */}
      <Modal
        title="处理订单"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            if (selectedOrder) {
              updateOrderStatus(
                selectedOrder.id,
                values.status,
                values.notes
              );
            }
          }}
        >
          <Form.Item
            label="订单状态"
            name="status"
            rules={[{ required: true, message: '请选择订单状态' }]}
          >
            <Select placeholder="请选择订单状态">
              <Option value="pending">待支付</Option>
              <Option value="paid">已支付</Option>
              <Option value="shipped">已发货</Option>
              <Option value="delivered">已送达</Option>
              <Option value="cancelled">已取消</Option>
              <Option value="refunded">已退款</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="支付状态"
            name="payment_status"
          >
            <Select placeholder="请选择支付状态">
              <Option value="pending">待支付</Option>
              <Option value="paid">已支付</Option>
              <Option value="failed">支付失败</Option>
              <Option value="refunded">已退款</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="处理备注"
            name="notes"
          >
            <Input.TextArea
              rows={4}
              placeholder="请输入处理备注..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setEditModalVisible(false);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderManagement;