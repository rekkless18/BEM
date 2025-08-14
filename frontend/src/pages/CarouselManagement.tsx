import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  message,
  Popconfirm,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Image,
  InputNumber,
  Upload,
  Divider,
  Alert,
  Badge
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  EyeOutlined,
  UpOutlined,
  DownOutlined,
  UploadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { CarouselImage, ApiResponse } from '../types';
import { carouselApi } from '../services/api';
import type { UploadProps } from 'antd';

const { Option } = Select;
const { TextArea } = Input;

interface CarouselFormData {
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  link_type: string;
  sort_order: number;
  is_active: boolean;
}

const CarouselManagement: React.FC = () => {
  const [carousels, setCarousels] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCarousel, setEditingCarousel] = useState<CarouselImage | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });

  // 链接类型选项
  const linkTypeOptions = [
    { value: 'none', label: '无链接' },
    { value: 'internal', label: '内部页面' },
    { value: 'external', label: '外部链接' },
    { value: 'product', label: '商品详情' },
    { value: 'article', label: '文章详情' }
  ];

  // 获取轮播图列表
  const fetchCarousels = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchText) params.search = searchText;
      if (selectedStatus !== '') params.is_active = selectedStatus === 'true';
      
      const response = await carouselApi.getList(params);
      if (response.success) {
        setCarousels(response.data);
        // 更新统计数据
        setStats({
          total: response.data.length,
          active: response.data.filter(c => c.is_active).length,
          inactive: response.data.filter(c => !c.is_active).length
        });
      }
    } catch (error) {
      message.error('获取轮播图列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarousels();
  }, [searchText, selectedStatus]);

  // 处理新增/编辑轮播图
  const handleSubmit = async (values: CarouselFormData) => {
    try {
      if (editingCarousel) {
        const response = await carouselApi.update(editingCarousel.id, values);
        if (response.success) {
          message.success('更新轮播图成功');
          fetchCarousels();
        }
      } else {
        const response = await carouselApi.create(values);
        if (response.success) {
          message.success('创建轮播图成功');
          fetchCarousels();
        }
      }
      setModalVisible(false);
      form.resetFields();
      setEditingCarousel(null);
    } catch (error) {
      message.error(editingCarousel ? '更新轮播图失败' : '创建轮播图失败');
    }
  };

  // 处理删除轮播图
  const handleDelete = async (id: string) => {
    try {
      const response = await carouselApi.delete(id);
      if (response.success) {
        message.success('删除轮播图成功');
        fetchCarousels();
      }
    } catch (error) {
      message.error('删除轮播图失败');
    }
  };

  // 处理状态切换
  const handleStatusToggle = async (id: string, is_active: boolean) => {
    try {
      const response = await carouselApi.updateStatus(id, { is_active });
      if (response.success) {
        message.success(`${is_active ? '启用' : '禁用'}轮播图成功`);
        fetchCarousels();
      }
    } catch (error) {
      message.error('更新状态失败');
    }
  };

  // 处理排序
  const handleSort = async (id: string, direction: 'up' | 'down') => {
    try {
      const currentIndex = carousels.findIndex(c => c.id === id);
      if (currentIndex === -1) return;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= carousels.length) return;

      const currentItem = carousels[currentIndex];
      const targetItem = carousels[targetIndex];

      // 交换排序值
      const response = await carouselApi.updateSort(id, {
        sort_order: targetItem.sort_order
      });
      
      if (response.success) {
        await carouselApi.updateSort(targetItem.id, {
          sort_order: currentItem.sort_order
        });
        message.success('排序更新成功');
        fetchCarousels();
      }
    } catch (error) {
      message.error('排序更新失败');
    }
  };

  // 打开编辑模态框
  const openEditModal = (carousel: CarouselImage) => {
    setEditingCarousel(carousel);
    form.setFieldsValue(carousel);
    setModalVisible(true);
  };

  // 文件上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/upload/image', // 修复：使用正确的后端上传接口路径
    headers: {
      authorization: `Bearer ${localStorage.getItem('token')}`, // 修复：使用正确的认证头格式
    },
    onChange(info) {
      if (info.file.status === 'done') {
        // 检查响应是否成功
        if (info.file.response?.success) {
          message.success(`${info.file.name} 文件上传成功`);
          // 设置图片URL到表单
          form.setFieldsValue({
            image_url: info.file.response.url || ''
          });
        } else {
          message.error(info.file.response?.error || '文件上传失败');
        }
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 文件上传失败`);
      }
    },
  };

  // 表格列定义
  const columns: ColumnsType<CarouselImage> = [
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      sorter: (a, b) => a.sort_order - b.sort_order,
      render: (sort_order, record, index) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{sort_order}</div>
          <Space>
            <Button
              type="text"
              size="small"
              icon={<UpOutlined />}
              disabled={index === 0}
              onClick={() => handleSort(record.id, 'up')}
            />
            <Button
              type="text"
              size="small"
              icon={<DownOutlined />}
              disabled={index === carousels.length - 1}
              onClick={() => handleSort(record.id, 'down')}
            />
          </Space>
        </div>
      )
    },
    {
      title: '轮播图',
      key: 'image',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Image
            src={record.image_url}
            width={120}
            height={60}
            style={{ marginRight: 12, borderRadius: 4, objectFit: 'cover' }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
          />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{record.title}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              {record.description?.substring(0, 30)}{record.description && record.description.length > 30 ? '...' : ''}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '链接类型',
      dataIndex: 'link_type',
      key: 'link_type',
      width: 100,
      render: (link_type) => {
        const typeConfig = linkTypeOptions.find(t => t.value === link_type);
        return (
          <Tag color={link_type === 'none' ? 'default' : 'blue'}>
            {typeConfig?.label || link_type}
          </Tag>
        );
      }
    },
    {
      title: '链接地址',
      dataIndex: 'link_url',
      key: 'link_url',
      width: 200,
      render: (link_url) => (
        <div style={{ 
          maxWidth: 180, 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          color: link_url ? '#1890ff' : '#999'
        }}>
          {link_url || '无链接'}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (is_active, record) => (
        <Switch
          checked={is_active}
          onChange={(checked) => handleStatusToggle(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (created_at) => (
        <div style={{ fontSize: '12px', color: '#666' }}>
          {new Date(created_at).toLocaleDateString()}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => openEditModal(record)}
            size="small"
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个轮播图吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="轮播图总数"
              value={stats.total}
              prefix={<PictureOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="启用中"
              value={stats.active}
              prefix={<PictureOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已禁用"
              value={stats.inactive}
              prefix={<PictureOutlined />}
              valueStyle={{ color: '#f50' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Input.Search
                placeholder="搜索轮播图标题"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
              <Select
                placeholder="选择状态"
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: 120 }}
                allowClear
              >
                <Option value="true">启用</Option>
                <Option value="false">禁用</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingCarousel(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              新增轮播图
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 轮播图列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={carousels}
          rowKey="id"
          loading={loading}
          pagination={{
            total: carousels.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 新增/编辑轮播图模态框 */}
      <Modal
        title={editingCarousel ? '编辑轮播图' : '新增轮播图'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingCarousel(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            is_active: true,
            sort_order: carousels.length + 1,
            link_type: 'none'
          }}
        >
          <Form.Item
            name="title"
            label="轮播图标题"
            rules={[{ required: true, message: '请输入轮播图标题' }]}
          >
            <Input placeholder="请输入轮播图标题" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述信息"
          >
            <TextArea rows={3} placeholder="请输入描述信息" />
          </Form.Item>

          <Form.Item
            name="image_url"
            label="轮播图片"
            rules={[{ required: true, message: '请上传轮播图片或输入图片URL' }]}
          >
            <div>
              <Input placeholder="请输入图片URL" style={{ marginBottom: 8 }} />
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>点击上传图片</Button>
              </Upload>
              <div style={{ color: '#666', fontSize: '12px', marginTop: 4 }}>
                建议尺寸：750x300px，支持 JPG、PNG 格式
              </div>
            </div>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="link_type"
                label="链接类型"
                rules={[{ required: true, message: '请选择链接类型' }]}
              >
                <Select placeholder="请选择链接类型">
                  {linkTypeOptions.map(type => (
                    <Option key={type.value} value={type.value}>{type.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sort_order"
                label="排序值"
                rules={[{ required: true, message: '请输入排序值' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入排序值"
                  min={1}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="link_url"
            label="链接地址"
            tooltip="当链接类型不为'无链接'时，请填写对应的链接地址"
          >
            <Input placeholder="请输入链接地址" />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Divider />
          
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingCarousel ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CarouselManagement;