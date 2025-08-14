/**
 * 文章管理页面
 * 提供文章的增删改查功能
 */

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  Select,
  InputNumber,
  DatePicker,
  Upload,
  Image,
  message,
  Popconfirm,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Tooltip,
  Typography,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  SearchOutlined,
  ReloadOutlined,
  BarChartOutlined,
  LikeOutlined,
  ShareAltOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import { apiClient } from '../../utils/api';
import {
  Article,
  CreateArticleRequest,
  UpdateArticleRequest,
  ArticleQueryParams,
  PaginatedResponse,
  ARTICLE_STATUS_OPTIONS,
  ARTICLE_CATEGORY_OPTIONS,
  UploadResponse
} from '../../types/community';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Paragraph } = Typography;

/**
 * 文章管理页面组件
 */
const ArticleManagement: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false); // 列表加载状态
  const [articles, setArticles] = useState<Article[]>([]); // 文章列表
  const [total, setTotal] = useState(0); // 总数量
  const [currentPage, setCurrentPage] = useState(1); // 当前页码
  const [pageSize, setPageSize] = useState(10); // 每页数量
  const [searchParams, setSearchParams] = useState<ArticleQueryParams>({}); // 搜索参数
  
  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false); // 新增/编辑模态框
  const [modalLoading, setModalLoading] = useState(false); // 模态框加载状态
  const [editingItem, setEditingItem] = useState<Article | null>(null); // 编辑中的项目
  const [previewVisible, setPreviewVisible] = useState(false); // 预览模态框
  const [previewItem, setPreviewItem] = useState<Article | null>(null); // 预览项目
  
  // 表单实例
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  
  // 文件上传状态
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  /**
   * 获取文章列表
   */
  const fetchArticles = async (params: ArticleQueryParams = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: currentPage,
        limit: pageSize,
        ...searchParams,
        ...params
      };
      
      const response = await apiClient.get<PaginatedResponse<Article>>('/api/community/articles', queryParams);
      
      if (response.success) {
        setArticles(response.data);
        setTotal(response.total);
      } else {
        message.error(response.message || '获取文章列表失败');
      }
    } catch (error) {
      console.error('获取文章列表失败:', error);
      message.error('获取文章列表失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理搜索
   */
  const handleSearch = (values: any) => {
    const params: ArticleQueryParams = {
      ...values,
      start_date: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      end_date: values.dateRange?.[1]?.format('YYYY-MM-DD')
    };
    delete params.dateRange;
    
    setSearchParams(params);
    setCurrentPage(1);
    fetchArticles(params);
  };

  /**
   * 重置搜索
   */
  const handleResetSearch = () => {
    searchForm.resetFields();
    setSearchParams({});
    setCurrentPage(1);
    fetchArticles({});
  };

  /**
   * 处理新增
   */
  const handleAdd = () => {
    setEditingItem(null);
    setModalVisible(true);
    form.resetFields();
    setFileList([]);
  };

  /**
   * 处理编辑
   */
  const handleEdit = (item: Article) => {
    setEditingItem(item);
    setModalVisible(true);
    
    // 填充表单数据
    form.setFieldsValue({
      ...item,
      published_at: item.published_at ? dayjs(item.published_at) : null
    });
    
    // 设置文件列表
    if (item.cover_image) {
      setFileList([{
        uid: '-1',
        name: 'cover.jpg',
        status: 'done',
        url: item.cover_image
      }]);
    } else {
      setFileList([]);
    }
  };

  /**
   * 处理删除
   */
  const handleDelete = async (id: string) => {
    try {
      const response = await apiClient.delete(`/api/community/articles/${id}`);
      
      if (response.success) {
        message.success('删除成功');
        fetchArticles();
      } else {
        message.error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  /**
   * 处理批量删除
   */
  const handleBatchDelete = async (ids: string[]) => {
    try {
      const response = await apiClient.delete('/api/community/articles', { ids });
      
      if (response.success) {
        message.success('批量删除成功');
        fetchArticles();
      } else {
        message.error(response.message || '批量删除失败');
      }
    } catch (error) {
      console.error('批量删除失败:', error);
      message.error('批量删除失败');
    }
  };

  /**
   * 处理预览
   */
  const handlePreview = (item: Article) => {
    setPreviewItem(item);
    setPreviewVisible(true);
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async (values: any) => {
    setModalLoading(true);
    
    try {
      // 处理时间格式
      const formData = {
        ...values,
        published_at: values.published_at?.format('YYYY-MM-DD HH:mm:ss'),
        cover_image: fileList[0]?.url || fileList[0]?.response?.url || ''
      };
      
      let response;
      if (editingItem) {
        // 更新
        response = await apiClient.put(`/api/community/articles/${editingItem.id}`, formData as UpdateArticleRequest);
      } else {
        // 新增
        response = await apiClient.post('/api/community/articles', formData as CreateArticleRequest);
      }
      
      if (response.success) {
        message.success(editingItem ? '更新成功' : '创建成功');
        setModalVisible(false);
        fetchArticles();
      } else {
        message.error(response.message || (editingItem ? '更新失败' : '创建失败'));
      }
    } catch (error) {
      console.error('提交失败:', error);
      message.error(editingItem ? '更新失败' : '创建失败');
    } finally {
      setModalLoading(false);
    }
  };

  /**
   * 处理文件上传
   */
  const handleUpload = async (file: File) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'articles');
      
      const response = await apiClient.post<UploadResponse>('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.success && response.url) {
        return {
          url: response.url,
          status: 'done'
        };
      } else {
        throw new Error(response.error || '上传失败');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      message.error('文件上传失败');
      throw error;
    } finally {
      setUploading(false);
    }
  };

  /**
   * 表格列配置
   */
  const columns: ColumnsType<Article> = [
    {
      title: '封面',
      dataIndex: 'cover_image',
      key: 'cover_image',
      width: 100,
      render: (url: string) => (
        url ? (
          <Image
            width={60}
            height={40}
            src={url}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
          />
        ) : (
          <div style={{ width: 60, height: 40, backgroundColor: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileTextOutlined style={{ color: '#ccc' }} />
          </div>
        )
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string) => (
        <Tooltip title={title}>
          <span>{title}</span>
        </Tooltip>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => {
        const option = ARTICLE_CATEGORY_OPTIONS.find(opt => opt.value === category);
        return <Tag color="blue">{option?.label || category}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const option = ARTICLE_STATUS_OPTIONS.find(opt => opt.value === status);
        const colors = {
          draft: 'default',
          published: 'green',
          archived: 'orange'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{option?.label || status}</Tag>;
      }
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 120
    },
    {
      title: '统计',
      key: 'stats',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <div>
            <EyeOutlined style={{ color: '#1890ff' }} />
            <span style={{ marginLeft: 4 }}>{record.view_count}</span>
            <LikeOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
            <span style={{ marginLeft: 4 }}>{record.like_count}</span>
          </div>
          <div>
            <ShareAltOutlined style={{ color: '#fa8c16' }} />
            <span style={{ marginLeft: 4 }}>{record.share_count}</span>
          </div>
        </Space>
      )
    },
    {
      title: '发布时间',
      dataIndex: 'published_at',
      key: 'published_at',
      width: 150,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
          >
            预览
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
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
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 组件挂载时获取数据
  useEffect(() => {
    fetchArticles();
  }, [currentPage, pageSize]);

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题和统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总文章数"
              value={total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已发布"
              value={articles.filter(item => item.status === 'published').length}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="草稿"
              value={articles.filter(item => item.status === 'draft').length}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总浏览量"
              value={articles.reduce((sum, item) => sum + item.view_count, 0)}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索表单 */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item name="search" label="搜索">
            <Input
              placeholder="请输入标题或内容关键词"
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" allowClear style={{ width: 120 }}>
              {ARTICLE_STATUS_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select placeholder="请选择分类" allowClear style={{ width: 120 }}>
              {ARTICLE_CATEGORY_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="author" label="作者">
            <Input
              placeholder="请输入作者"
              allowClear
              style={{ width: 120 }}
            />
          </Form.Item>
          <Form.Item name="dateRange" label="发布时间">
            <RangePicker style={{ width: 240 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleResetSearch} icon={<ReloadOutlined />}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 操作按钮 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增文章
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchArticles()}
          >
            刷新
          </Button>
        </Space>
      </div>

      {/* 数据表格 */}
      <Table
        columns={columns}
        dataSource={articles}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size || 10);
          }
        }}
      />

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingItem ? '编辑文章' : '新增文章'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'draft',
            category: 'health',
            is_featured: false
          }}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="title"
                label="文章标题"
                rules={[{ required: true, message: '请输入文章标题' }]}
              >
                <Input placeholder="请输入文章标题" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="category"
                label="文章分类"
                rules={[{ required: true, message: '请选择文章分类' }]}
              >
                <Select>
                  {ARTICLE_CATEGORY_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="summary"
            label="文章摘要"
            rules={[{ required: true, message: '请输入文章摘要' }]}
          >
            <TextArea
              rows={3}
              placeholder="请输入文章摘要"
              showCount
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            name="cover_image"
            label="封面图片"
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              customRequest={async ({ file, onSuccess, onError }) => {
                try {
                  const result = await handleUpload(file as File);
                  onSuccess?.(result);
                } catch (error) {
                  onError?.(error as Error);
                }
              }}
              onChange={({ fileList: newFileList }) => {
                setFileList(newFileList);
                if (newFileList[0]?.status === 'done') {
                  form.setFieldsValue({
                    cover_image: newFileList[0].url || newFileList[0].response?.url
                  });
                }
              }}
              maxCount={1}
              accept="image/*"
            >
              {fileList.length < 1 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传封面</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            name="content"
            label="文章内容"
            rules={[{ required: true, message: '请输入文章内容' }]}
          >
            <TextArea
              rows={10}
              placeholder="请输入文章内容"
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="author"
                label="作者"
                rules={[{ required: true, message: '请输入作者' }]}
              >
                <Input placeholder="请输入作者" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="发布状态"
              >
                <Select>
                  {ARTICLE_STATUS_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="published_at"
                label="发布时间"
              >
                <DatePicker
                  showTime
                  placeholder="请选择发布时间"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tags"
                label="标签"
              >
                <Input placeholder="请输入标签，多个标签用逗号分隔" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_featured"
                label="是否推荐"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={modalLoading}
              >
                {editingItem ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 预览模态框 */}
      <Modal
        title="文章预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        {previewItem && (
          <div>
            {/* 文章头部信息 */}
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ marginBottom: 8 }}>{previewItem.title}</h2>
              <Space split={<Divider type="vertical" />}>
                <span>作者：{previewItem.author}</span>
                <span>分类：{ARTICLE_CATEGORY_OPTIONS.find(opt => opt.value === previewItem.category)?.label}</span>
                <span>状态：{ARTICLE_STATUS_OPTIONS.find(opt => opt.value === previewItem.status)?.label}</span>
                {previewItem.published_at && (
                  <span>发布时间：{dayjs(previewItem.published_at).format('YYYY-MM-DD HH:mm')}</span>
                )}
              </Space>
            </div>

            {/* 封面图片 */}
            {previewItem.cover_image && (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Image
                  src={previewItem.cover_image}
                  style={{ maxWidth: '100%', maxHeight: 300 }}
                />
              </div>
            )}

            {/* 文章摘要 */}
            <div style={{ marginBottom: 16 }}>
              <h4>摘要</h4>
              <Paragraph>{previewItem.summary}</Paragraph>
            </div>

            {/* 文章内容 */}
            <div style={{ marginBottom: 16 }}>
              <h4>内容</h4>
              <Paragraph>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {previewItem.content}
                </pre>
              </Paragraph>
            </div>

            {/* 标签 */}
            {previewItem.tags && (
              <div style={{ marginBottom: 16 }}>
                <h4>标签</h4>
                <Space>
                  {previewItem.tags.split(',').map((tag, index) => (
                    <Tag key={index}>{tag.trim()}</Tag>
                  ))}
                </Space>
              </div>
            )}

            {/* 统计信息 */}
            <div>
              <h4>统计信息</h4>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="浏览量" value={previewItem.view_count} prefix={<EyeOutlined />} />
                </Col>
                <Col span={6}>
                  <Statistic title="点赞数" value={previewItem.like_count} prefix={<LikeOutlined />} />
                </Col>
                <Col span={6}>
                  <Statistic title="分享数" value={previewItem.share_count} prefix={<ShareAltOutlined />} />
                </Col>
                <Col span={6}>
                  <Statistic title="推荐" value={previewItem.is_featured ? '是' : '否'} />
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ArticleManagement;