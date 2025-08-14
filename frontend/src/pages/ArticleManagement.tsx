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
  DatePicker,
  Divider,
  Badge,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  EyeOutlined,
  StarOutlined,
  StarFilled,
  CalendarOutlined,
  UserOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Article, ApiResponse } from '../types';
import { articleApi } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface ArticleFormData {
  title: string;
  content: string;
  summary?: string;
  category: string;
  author: string;
  cover_image?: string;
  tags?: string[];
  status: string;
  is_featured: boolean;
  published_at?: string;
}

const ArticleManagement: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    featured: 0,
    totalViews: 0
  });

  // 文章分类选项
  const categoryOptions = [
    { value: '健康资讯', label: '健康资讯', color: 'blue' },
    { value: '疾病预防', label: '疾病预防', color: 'green' },
    { value: '医疗科普', label: '医疗科普', color: 'orange' },
    { value: '康复指导', label: '康复指导', color: 'purple' },
    { value: '营养保健', label: '营养保健', color: 'cyan' },
    { value: '心理健康', label: '心理健康', color: 'magenta' },
    { value: '急救知识', label: '急救知识', color: 'red' }
  ];

  // 文章状态选项
  const statusOptions = [
    { value: 'published', label: '已发布', color: 'green' },
    { value: 'draft', label: '草稿', color: 'orange' },
    { value: 'archived', label: '已归档', color: 'default' }
  ];

  // 获取文章列表
  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchText) params.search = searchText;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;
      
      const response = await articleApi.getList(params);
      if (response.success) {
        setArticles(response.data);
        // 更新统计数据
        const totalViews = response.data.reduce((sum, article) => sum + (article.view_count || 0), 0);
        setStats({
          total: response.data.length,
          published: response.data.filter(a => a.status === 'published').length,
          draft: response.data.filter(a => a.status === 'draft').length,
          featured: response.data.filter(a => a.is_featured).length,
          totalViews
        });
      }
    } catch (error) {
      message.error('获取文章列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [searchText, selectedCategory, selectedStatus]);

  // 处理新增/编辑文章
  const handleSubmit = async (values: ArticleFormData) => {
    try {
      const submitData = {
        ...values,
        tags: values.tags || [],
        published_at: values.published_at ? dayjs(values.published_at).toISOString() : null
      };

      if (editingArticle) {
        const response = await articleApi.update(editingArticle.id, submitData);
        if (response.success) {
          message.success('更新文章成功');
          fetchArticles();
        }
      } else {
        const response = await articleApi.create(submitData);
        if (response.success) {
          message.success('创建文章成功');
          fetchArticles();
        }
      }
      setModalVisible(false);
      form.resetFields();
      setEditingArticle(null);
    } catch (error) {
      message.error(editingArticle ? '更新文章失败' : '创建文章失败');
    }
  };

  // 处理删除文章
  const handleDelete = async (id: string) => {
    try {
      const response = await articleApi.delete(id);
      if (response.success) {
        message.success('删除文章成功');
        fetchArticles();
      }
    } catch (error) {
      message.error('删除文章失败');
    }
  };

  // 处理状态切换
  const handleStatusToggle = async (id: string, status: string) => {
    try {
      const response = await articleApi.updateStatus(id, { status });
      if (response.success) {
        message.success('更新状态成功');
        fetchArticles();
      }
    } catch (error) {
      message.error('更新状态失败');
    }
  };

  // 处理推荐状态切换
  const handleFeaturedToggle = async (id: string, is_featured: boolean) => {
    try {
      const response = await articleApi.updateFeatured(id, { is_featured });
      if (response.success) {
        message.success(`${is_featured ? '设为推荐' : '取消推荐'}成功`);
        fetchArticles();
      }
    } catch (error) {
      message.error('更新推荐状态失败');
    }
  };

  // 打开编辑模态框
  const openEditModal = (article: Article) => {
    setEditingArticle(article);
    form.setFieldsValue({
      ...article,
      published_at: article.published_at ? dayjs(article.published_at) : null,
      tags: article.tags || []
    });
    setModalVisible(true);
  };

  // 表格列定义
  const columns: ColumnsType<Article> = [
    {
      title: '文章信息',
      key: 'article_info',
      width: 300,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <Image
            src={record.cover_image || 'https://via.placeholder.com/80x60'}
            width={80}
            height={60}
            style={{ marginRight: 12, borderRadius: 4, objectFit: 'cover' }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: 4 }}>
              {record.title}
              {record.is_featured && (
                <StarFilled style={{ color: '#faad14', marginLeft: 8 }} />
              )}
            </div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: 4 }}>
              {record.summary?.substring(0, 50)}{record.summary && record.summary.length > 50 ? '...' : ''}
            </div>
            <div style={{ color: '#999', fontSize: '11px' }}>
              <UserOutlined style={{ marginRight: 4 }} />
              {record.author}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category) => {
        const categoryConfig = categoryOptions.find(c => c.value === category);
        return (
          <Tag color={categoryConfig?.color || 'default'}>
            {category}
          </Tag>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => {
        const statusConfig = statusOptions.find(s => s.value === status);
        return (
          <Select
            value={status}
            size="small"
            style={{ width: 80 }}
            onChange={(value) => handleStatusToggle(record.id, value)}
          >
            {statusOptions.map(option => (
              <Option key={option.value} value={option.value}>
                <Tag color={option.color} style={{ margin: 0 }}>
                  {option.label}
                </Tag>
              </Option>
            ))}
          </Select>
        );
      }
    },
    {
      title: '推荐',
      dataIndex: 'is_featured',
      key: 'is_featured',
      width: 80,
      render: (is_featured, record) => (
        <Tooltip title={is_featured ? '取消推荐' : '设为推荐'}>
          <Button
            type="text"
            icon={is_featured ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
            onClick={() => handleFeaturedToggle(record.id, !is_featured)}
          />
        </Tooltip>
      )
    },
    {
      title: '阅读量',
      dataIndex: 'view_count',
      key: 'view_count',
      width: 80,
      sorter: (a, b) => (a.view_count || 0) - (b.view_count || 0),
      render: (view_count) => (
        <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#1890ff' }}>
          {view_count || 0}
        </div>
      )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string[]) => (
        <div>
          {tags?.slice(0, 2).map((tag, index) => (
            <Tag key={index} color="geekblue" style={{ marginBottom: 4 }}>
              {tag}
            </Tag>
          ))}
          {tags?.length > 2 && (
            <Tag color="default">+{tags.length - 2}</Tag>
          )}
        </div>
      )
    },
    {
      title: '发布时间',
      dataIndex: 'published_at',
      key: 'published_at',
      width: 120,
      sorter: (a, b) => {
        const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
        return dateA - dateB;
      },
      render: (published_at) => (
        <div style={{ fontSize: '12px', color: '#666' }}>
          {published_at ? (
            <>
              <CalendarOutlined style={{ marginRight: 4 }} />
              {new Date(published_at).toLocaleDateString()}
            </>
          ) : (
            '未发布'
          )}
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
            title="确定要删除这篇文章吗？"
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
        <Col span={6}>
          <Card>
            <Statistic
              title="文章总数"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已发布"
              value={stats.published}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="推荐文章"
              value={stats.featured}
              prefix={<StarFilled />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总阅读量"
              value={stats.totalViews}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#722ed1' }}
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
                placeholder="搜索文章标题或内容"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
              <Select
                placeholder="选择分类"
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ width: 150 }}
                allowClear
              >
                {categoryOptions.map(cat => (
                  <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                ))}
              </Select>
              <Select
                placeholder="选择状态"
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: 120 }}
                allowClear
              >
                {statusOptions.map(status => (
                  <Option key={status.value} value={status.value}>{status.label}</Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingArticle(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              新增文章
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 文章列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={articles}
          rowKey="id"
          loading={loading}
          pagination={{
            total: articles.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 新增/编辑文章模态框 */}
      <Modal
        title={editingArticle ? '编辑文章' : '新增文章'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingArticle(null);
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'draft',
            is_featured: false,
            category: '健康资讯'
          }}
        >
          <Form.Item
            name="title"
            label="文章标题"
            rules={[{ required: true, message: '请输入文章标题' }]}
          >
            <Input placeholder="请输入文章标题" />
          </Form.Item>

          <Form.Item
            name="summary"
            label="文章摘要"
          >
            <TextArea rows={2} placeholder="请输入文章摘要" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="文章分类"
                rules={[{ required: true, message: '请选择文章分类' }]}
              >
                <Select placeholder="请选择文章分类">
                  {categoryOptions.map(cat => (
                    <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="author"
                label="作者"
                rules={[{ required: true, message: '请输入作者' }]}
              >
                <Input placeholder="请输入作者" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="content"
            label="文章内容"
            rules={[{ required: true, message: '请输入文章内容' }]}
          >
            <TextArea rows={8} placeholder="请输入文章内容" />
          </Form.Item>

          <Form.Item
            name="cover_image"
            label="封面图片URL"
          >
            <Input placeholder="请输入封面图片URL" />
          </Form.Item>

          <Form.Item
            name="tags"
            label="文章标签"
          >
            <Select
              mode="tags"
              placeholder="请输入文章标签，按回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="status"
                label="发布状态"
              >
                <Select placeholder="请选择状态">
                  {statusOptions.map(status => (
                    <Option key={status.value} value={status.value}>{status.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="is_featured"
                label="推荐文章"
                valuePropName="checked"
              >
                <Switch checkedChildren="推荐" unCheckedChildren="普通" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="published_at"
                label="发布时间"
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  placeholder="请选择发布时间"
                  showTime
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingArticle ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ArticleManagement;