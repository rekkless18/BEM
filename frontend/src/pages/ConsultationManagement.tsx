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
  Avatar,
  Descriptions,
  Badge
} from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { consultationApi } from '../services/api';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

/**
 * 咨询数据接口
 */
interface Consultation {
  id: string;
  user_id: string;
  doctor_id: string;
  symptoms: string;
  appointment_time?: string;
  diagnosis?: string;
  prescription?: string;
  advice?: string;
  consultation_fee?: number;
  is_emergency: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  consultation_type: 'online' | 'offline' | 'phone' | 'video';
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // 关联数据
  user?: {
    id: string;
    username: string;
    email: string;
    phone?: string;
  };
  doctor?: {
    id: string;
    name: string;
    title: string;
    department: string;
  };
}

/**
 * 咨询管理页面组件
 */
const ConsultationManagement: React.FC = () => {
  // 状态管理
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const [form] = Form.useForm();

  /**
   * 获取咨询列表
   */
  const fetchConsultations = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pageSize
      };
      
      if (searchText) params.search = searchText;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      
      if (dateRange) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await consultationApi.getList(params);
      
      if (response.data.success) {
        const consultationData = response.data.data;
        const consultationList = Array.isArray(consultationData) ? consultationData : (consultationData.consultations || []);
        setConsultations(consultationList);
        setPagination({
          current: consultationData.pagination?.page || page,
          pageSize: consultationData.pagination?.limit || pageSize,
          total: consultationData.pagination?.total || 0
        });
        

      } else {
        message.error(response.data.message || '获取咨询列表失败');
      }
    } catch (error) {
      console.error('获取咨询列表错误:', error);
      message.error('获取咨询列表失败');
    } finally {
      setLoading(false);
    }
  };



  /**
   * 更新咨询状态
   */
  const updateConsultationStatus = async (id: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`/api/consultations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status,
          notes,
          completed_at: status === 'completed' ? new Date().toISOString() : undefined
        })
      });

      if (!response.ok) {
        throw new Error('更新咨询状态失败');
      }

      const data = await response.json();
      if (data.success) {
        message.success('更新咨询状态成功');
        setEditModalVisible(false);
        form.resetFields();
        fetchConsultations(pagination.current, pagination.pageSize);
      } else {
        message.error(data.message || '更新咨询状态失败');
      }
    } catch (error) {
      console.error('更新咨询状态错误:', error);
      message.error('更新咨询状态失败');
    }
  };

  /**
   * 查看咨询详情
   */
  const handleViewDetail = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setDetailModalVisible(true);
  };

  /**
   * 编辑咨询
   */
  const handleEdit = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    form.setFieldsValue({
      status: consultation.status,
      notes: consultation.notes,
      scheduled_at: consultation.scheduled_at ? dayjs(consultation.scheduled_at) : null
    });
    setEditModalVisible(true);
  };

  /**
   * 搜索处理
   */
  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchConsultations(1, pagination.pageSize);
  };

  /**
   * 重置搜索
   */
  const handleReset = () => {
    setSearchText('');
    setStatusFilter('all');
    setTypeFilter('all');
    setPriorityFilter('all');
    setDateRange(null);
    setPagination({ ...pagination, current: 1 });
    fetchConsultations(1, pagination.pageSize);
  };

  // 状态标签配置
  const statusConfig = {
    pending: { color: 'orange', text: '待处理' },
    in_progress: { color: 'blue', text: '进行中' },
    completed: { color: 'green', text: '已完成' },
    cancelled: { color: 'red', text: '已取消' }
  };

  // 优先级标签配置
  const priorityConfig = {
    low: { color: 'default', text: '低' },
    medium: { color: 'blue', text: '中' },
    high: { color: 'orange', text: '高' },
    urgent: { color: 'red', text: '紧急' }
  };

  // 咨询类型配置
  const typeConfig = {
    online: { text: '在线咨询' },
    offline: { text: '线下咨询' },
    phone: { text: '电话咨询' },
    video: { text: '视频咨询' }
  };

  // 表格列定义
  const columns: ColumnsType<Consultation> = [
    {
      title: '咨询ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace' }}>
          {text.slice(0, 8)}...
        </span>
      )
    },
    {
      title: '患者',
      key: 'user',
      width: 150,
      render: (_, record: Consultation) => (
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
      title: '医生',
      key: 'doctor',
      width: 150,
      render: (_, record: Consultation) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar icon={<UserOutlined />} size="small" />
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {record.doctor?.name || '未分配'}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.doctor?.department}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '咨询标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'consultation_type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag>{typeConfig[type as keyof typeof typeConfig]?.text || type}</Tag>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => {
        const config = priorityConfig[priority as keyof typeof priorityConfig];
        return (
          <Tag color={config?.color}>
            {config?.text || priority}
          </Tag>
        );
      }
    },
    {
      title: '状态',
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
      title: '预约时间',
      dataIndex: 'scheduled_at',
      key: 'scheduled_at',
      width: 150,
      render: (text: string) => 
        text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-'
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
      render: (_, record: Consultation) => (
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
    fetchConsultations();
  }, []);

  // 搜索条件变化时重新获取数据
  useEffect(() => {
    if (searchText || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all' || dateRange) {
      const timer = setTimeout(() => {
        fetchConsultations(1, pagination.pageSize);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchText, statusFilter, typeFilter, priorityFilter, dateRange]);

  return (
    <div style={{ padding: '24px' }}>


      {/* 搜索和筛选区域 */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Input
            placeholder="搜索咨询标题或描述"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: '300px' }}
          />
          <Select
            placeholder="状态筛选"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: '120px' }}
          >
            <Option value="all">全部状态</Option>
            <Option value="pending">待处理</Option>
            <Option value="in_progress">进行中</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
          <Select
            placeholder="类型筛选"
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: '120px' }}
          >
            <Option value="all">全部类型</Option>
            <Option value="online">在线咨询</Option>
            <Option value="offline">线下咨询</Option>
            <Option value="phone">电话咨询</Option>
            <Option value="video">视频咨询</Option>
          </Select>
          <Select
            placeholder="优先级筛选"
            value={priorityFilter}
            onChange={setPriorityFilter}
            style={{ width: '120px' }}
          >
            <Option value="all">全部优先级</Option>
            <Option value="low">低</Option>
            <Option value="medium">中</Option>
            <Option value="high">高</Option>
            <Option value="urgent">紧急</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder={['开始日期', '结束日期']}
          />
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
          </Space>
        </div>
      </Card>

      {/* 咨询表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={consultations}
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
              fetchConsultations(page, pageSize);
            }
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 咨询详情模态框 */}
      <Modal
        title="咨询详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedConsultation && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="咨询ID" span={2}>
              {selectedConsultation.id}
            </Descriptions.Item>
            <Descriptions.Item label="患者姓名">
              {selectedConsultation.user?.name || '未知用户'}
            </Descriptions.Item>
            <Descriptions.Item label="患者联系方式">
              {selectedConsultation.user?.phone || selectedConsultation.user?.email || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="医生姓名">
              {selectedConsultation.doctor?.name || '未分配'}
            </Descriptions.Item>
            <Descriptions.Item label="医生科室">
              {selectedConsultation.doctor?.department || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="咨询标题" span={2}>
              {selectedConsultation.title}
            </Descriptions.Item>
            <Descriptions.Item label="咨询描述" span={2}>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {selectedConsultation.description}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="咨询类型">
              {typeConfig[selectedConsultation.consultation_type as keyof typeof typeConfig]?.text}
            </Descriptions.Item>
            <Descriptions.Item label="优先级">
              <Tag color={priorityConfig[selectedConsultation.priority as keyof typeof priorityConfig]?.color}>
                {priorityConfig[selectedConsultation.priority as keyof typeof priorityConfig]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge
                status={statusConfig[selectedConsultation.status as keyof typeof statusConfig]?.color as any}
                text={statusConfig[selectedConsultation.status as keyof typeof statusConfig]?.text}
              />
            </Descriptions.Item>
            <Descriptions.Item label="预约时间">
              {selectedConsultation.scheduled_at ? 
                dayjs(selectedConsultation.scheduled_at).format('YYYY-MM-DD HH:mm') : '-'
              }
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(selectedConsultation.created_at).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="完成时间">
              {selectedConsultation.completed_at ? 
                dayjs(selectedConsultation.completed_at).format('YYYY-MM-DD HH:mm') : '-'
              }
            </Descriptions.Item>
            {selectedConsultation.notes && (
              <Descriptions.Item label="处理备注" span={2}>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedConsultation.notes}
                </div>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* 处理咨询模态框 */}
      <Modal
        title="处理咨询"
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
            if (selectedConsultation) {
              updateConsultationStatus(
                selectedConsultation.id,
                values.status,
                values.notes
              );
            }
          }}
        >
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="pending">待处理</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="预约时间"
            name="scheduled_at"
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              placeholder="选择预约时间"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="处理备注"
            name="notes"
          >
            <TextArea
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

export default ConsultationManagement;