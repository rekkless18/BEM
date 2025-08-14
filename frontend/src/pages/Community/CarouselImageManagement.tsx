/**
 * 轮播图管理页面
 * 提供轮播图的增删改查功能
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
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  SearchOutlined,
  ReloadOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import { carouselApi } from '../../services/supabaseApi';
import { uploadFile } from '../../utils/api';
import {
  CarouselImage,
  CreateCarouselImageRequest,
  UpdateCarouselImageRequest,
  CarouselImageQueryParams,
  PaginatedResponse,
  TARGET_TYPE_OPTIONS,
  UploadResponse
} from '../../types/community';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * 轮播图管理页面组件
 */
const CarouselImageManagement: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false); // 列表加载状态
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]); // 轮播图列表
  const [total, setTotal] = useState(0); // 总数量
  const [currentPage, setCurrentPage] = useState(1); // 当前页码
  const [pageSize, setPageSize] = useState(10); // 每页数量
  const [searchParams, setSearchParams] = useState<CarouselImageQueryParams>({}); // 搜索参数
  
  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false); // 新增/编辑模态框
  const [modalLoading, setModalLoading] = useState(false); // 模态框加载状态
  const [editingItem, setEditingItem] = useState<CarouselImage | null>(null); // 编辑中的项目
  const [previewVisible, setPreviewVisible] = useState(false); // 预览模态框
  const [previewItem, setPreviewItem] = useState<CarouselImage | null>(null); // 预览项目
  
  // 表单实例
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  
  // 文件上传状态
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  /**
   * 获取轮播图列表
   */
  const fetchCarouselImages = async (params: CarouselImageQueryParams = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: currentPage,
        limit: pageSize,
        ...searchParams,
        ...params
      };
      
      const response = await carouselApi.getList(queryParams);
      
      if (response.success) {
        setCarouselImages((response.data as unknown as CarouselImage[]) || []);
        setTotal(response.total || 0);
      } else {
        message.error(response.message || '获取轮播图列表失败');
      }
    } catch (error) {
      console.error('获取轮播图列表失败:', error);
      message.error('获取轮播图列表失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理搜索
   */
  const handleSearch = (values: any) => {
    const params: CarouselImageQueryParams = {
      ...values,
      start_date: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      end_date: values.dateRange?.[1]?.format('YYYY-MM-DD')
    };
    delete params.dateRange;
    
    setSearchParams(params);
    setCurrentPage(1);
    fetchCarouselImages(params);
  };

  /**
   * 重置搜索
   */
  const handleResetSearch = () => {
    searchForm.resetFields();
    setSearchParams({});
    setCurrentPage(1);
    fetchCarouselImages({});
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
  const handleEdit = (item: CarouselImage) => {
    setEditingItem(item);
    setModalVisible(true);
    
    // 填充表单数据
    form.setFieldsValue({
      ...item,
      start_time: item.start_time ? dayjs(item.start_time) : null,
      end_time: item.end_time ? dayjs(item.end_time) : null
    });
    
    // 设置文件列表
    if (item.image_url) {
      setFileList([{
        uid: '-1',
        name: 'image.jpg',
        status: 'done',
        url: item.image_url
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
      const response = await carouselApi.delete(id);
      
      if (response.success) {
        message.success('删除成功');
        fetchCarouselImages();
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
      // 逐个删除，因为supabaseApi不支持批量删除
      for (const id of ids) {
        await carouselApi.delete(id);
      }
      message.success('批量删除成功');
      fetchCarouselImages();
    } catch (error) {
      console.error('批量删除失败:', error);
      message.error('批量删除失败');
    }
  };

  /**
   * 处理预览
   */
  const handlePreview = (item: CarouselImage) => {
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
        start_time: values.start_time?.format('YYYY-MM-DD HH:mm:ss'),
        end_time: values.end_time?.format('YYYY-MM-DD HH:mm:ss'),
        image_url: fileList[0]?.url || fileList[0]?.response?.url || ''
      };
      
      let response;
      if (editingItem) {
        // 更新
        response = await carouselApi.update(editingItem.id, formData as UpdateCarouselImageRequest);
      } else {
        // 新增
        response = await carouselApi.create(formData as CreateCarouselImageRequest);
      }
      
      if (response.success) {
        message.success(editingItem ? '更新成功' : '创建成功');
        setModalVisible(false);
        fetchCarouselImages();
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
      const url = await uploadFile(file, 'carousel-images');
      
      if (url) {
        return {
          url: url,
          status: 'done'
        };
      } else {
        throw new Error('上传失败');
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
  const columns: ColumnsType<CarouselImage> = [
    {
      title: '图片',
      dataIndex: 'image_url',
      key: 'image_url',
      width: 100,
      render: (url: string) => (
        <Image
          width={60}
          height={40}
          src={url}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
        />
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '目标类型',
      dataIndex: 'target_type',
      key: 'target_type',
      width: 100,
      render: (type: string) => {
        const option = TARGET_TYPE_OPTIONS.find(opt => opt.value === type);
        return <Tag color="blue">{option?.label || type}</Tag>;
      }
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      sorter: (a, b) => a.sort_order - b.sort_order
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '点击次数',
      dataIndex: 'click_count',
      key: 'click_count',
      width: 100,
      render: (count: number) => (
        <Tooltip title="点击统计">
          <span style={{ color: '#1890ff' }}>
            <BarChartOutlined /> {count}
          </span>
        </Tooltip>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
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
            title="确定要删除这个轮播图吗？"
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
    fetchCarouselImages();
  }, [currentPage, pageSize]);

  return (
    <div style={{ padding: '24px' }}>


      {/* 搜索表单 */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item name="search" label="搜索">
            <Input
              placeholder="请输入标题关键词"
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" allowClear style={{ width: 120 }}>
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
              <Option value="all">全部</Option>
            </Select>
          </Form.Item>
          <Form.Item name="target_type" label="目标类型">
            <Select placeholder="请选择类型" allowClear style={{ width: 120 }}>
              {TARGET_TYPE_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
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
            新增轮播图
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchCarouselImages()}
          >
            刷新
          </Button>
        </Space>
      </div>

      {/* 数据表格 */}
      <Table
        columns={columns}
        dataSource={carouselImages || []}
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
        title={editingItem ? '编辑轮播图' : '新增轮播图'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            target_type: 'home',
            sort_order: 0,
            is_active: true
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="轮播图标题"
                rules={[{ required: true, message: '请输入轮播图标题' }]}
              >
                <Input placeholder="请输入轮播图标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="target_type"
                label="目标类型"
              >
                <Select>
                  {TARGET_TYPE_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="image_url"
            label="轮播图片"
            rules={[{ required: true, message: '请上传轮播图片' }]}
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
                    image_url: newFileList[0].url || newFileList[0].response?.url
                  });
                }
              }}
              maxCount={1}
              accept="image/*"
            >
              {fileList.length < 1 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            name="link_url"
            label="跳转链接"
          >
            <Input placeholder="请输入跳转链接（可选）" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="sort_order"
                label="排序顺序"
              >
                <InputNumber
                  min={0}
                  placeholder="数字越小越靠前"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="is_active"
                label="是否启用"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start_time"
                label="开始时间"
              >
                <DatePicker
                  showTime
                  placeholder="请选择开始时间"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_time"
                label="结束时间"
              >
                <DatePicker
                  showTime
                  placeholder="请选择结束时间"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea
              rows={3}
              placeholder="请输入轮播图描述（可选）"
            />
          </Form.Item>

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
        title="轮播图预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={600}
      >
        {previewItem && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Image
                src={previewItem.image_url}
                style={{ maxWidth: '100%', maxHeight: 300 }}
              />
            </div>
            <div>
              <p><strong>标题：</strong>{previewItem.title}</p>
              <p><strong>目标类型：</strong>{TARGET_TYPE_OPTIONS.find(opt => opt.value === previewItem.target_type)?.label}</p>
              <p><strong>跳转链接：</strong>{previewItem.link_url || '无'}</p>
              <p><strong>排序：</strong>{previewItem.sort_order}</p>
              <p><strong>状态：</strong>{previewItem.is_active ? '启用' : '禁用'}</p>
              <p><strong>点击次数：</strong>{previewItem.click_count}</p>
              {previewItem.description && (
                <p><strong>描述：</strong>{previewItem.description}</p>
              )}
              <p><strong>创建时间：</strong>{dayjs(previewItem.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CarouselImageManagement;