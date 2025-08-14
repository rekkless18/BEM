import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Popconfirm,
  Tag,
  Card,
  Row,
  Col,
  Image,
  InputNumber,
  DatePicker,
  Divider,
  Badge
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Product } from '../../types';
import { productApi } from '../../services/supabaseApi';
import { uploadFile } from '../../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  category: string;
  category_name?: string;
  brand?: string;
  model?: string;
  specifications?: any;
  images?: string[];
  stock_quantity: number;
  min_stock_level: number;
  status: string;
  tags?: string[];
  weight?: string;
  dimensions?: string;
  manufacturer?: string;
  production_date?: string;
  expiry_date?: string;
  usage_instructions?: string;
  precautions?: string;
  storage_conditions?: string;
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [stockForm] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  // 移除统计相关状态
  // const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  // const [stats, setStats] = useState({ total: 0, active: 0, lowStock: 0, totalValue: 0 });

  // 商品分类选项
  const categoryOptions = [
    { value: '1', label: '医疗器械' },
    { value: '2', label: '保健品' },
    { value: '3', label: '药品' },
    { value: '4', label: '医疗耗材' },
    { value: '5', label: '康复用品' }
  ];

  // 商品状态选项
  const statusOptions = [
    { value: 'active', label: '上架', color: 'green' },
    { value: 'inactive', label: '下架', color: 'red' },
    { value: 'draft', label: '草稿', color: 'orange' },
    { value: 'out_of_stock', label: '缺货', color: 'volcano' }
  ];

  // 获取商品列表
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchText) params.search = searchText;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;
      
      const response = await productApi.getList(params);
      if (response.success) {
        const products = response.data as Product[];
        setProducts(products);
        // 移除统计数据更新逻辑
      }
    } catch (error) {
      message.error('获取商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 移除库存预警商品获取函数
  // const fetchLowStockProducts = async () => { ... };

  useEffect(() => {
    fetchProducts();
    // 移除库存预警数据获取
  }, [searchText, selectedCategory, selectedStatus]);

  // 处理新增/编辑商品
  const handleSubmit = async (values: ProductFormData) => {
    try {
      const submitData = {
        ...values,
        images: values.images || [],
        tags: values.tags || [],
        specifications: values.specifications || {},
        production_date: values.production_date ? dayjs(values.production_date).toISOString() : null,
        expiry_date: values.expiry_date ? dayjs(values.expiry_date).toISOString() : null
      };

      if (editingProduct) {
        const response = await productApi.update(editingProduct.id, submitData);
        if (response.success) {
          message.success('更新商品信息成功');
          fetchProducts();
        }
      } else {
        const response = await productApi.create(submitData);
        if (response.success) {
          message.success('创建商品成功');
          fetchProducts();
        }
      }
      setModalVisible(false);
      form.resetFields();
      setEditingProduct(null);
    } catch (error) {
      message.error(editingProduct ? '更新商品失败' : '创建商品失败');
    }
  };

  // 处理库存更新
  const handleStockUpdate = async (values: any) => {
    if (!stockProduct) return;
    
    try {
      const response = await productApi.update(stockProduct.id, { stock_quantity: values.stock_quantity });
      if (response.success) {
        message.success('更新库存成功');
        fetchProducts();
        // 移除库存预警数据刷新
        setStockModalVisible(false);
        stockForm.resetFields();
        setStockProduct(null);
      }
    } catch (error) {
      message.error('更新库存失败');
    }
  };

  // 处理删除商品
  const handleDelete = async (id: string) => {
    try {
      const response = await productApi.delete(id);
      if (response.success) {
        message.success('删除商品成功');
        fetchProducts();
      }
    } catch (error) {
      message.error('删除商品失败');
    }
  };

  // 打开编辑模态框
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      ...product,
      production_date: product.production_date ? dayjs(product.production_date) : null,
      expiry_date: product.expiry_date ? dayjs(product.expiry_date) : null,
      images: product.images || [],
      tags: product.tags || []
    });
    setModalVisible(true);
  };

  // 打开库存管理模态框
  const openStockModal = (product: Product) => {
    setStockProduct(product);
    stockForm.setFieldsValue({
      stock_quantity: product.stock_quantity,
      operation: 'set'
    });
    setStockModalVisible(true);
  };

  // 表格列定义
  const columns: ColumnsType<Product> = [
    {
      title: '商品信息',
      key: 'product_info',
      width: 250,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Image
            src={record.images?.[0] || 'https://via.placeholder.com/60x60'}
            width={60}
            height={60}
            style={{ marginRight: 12, borderRadius: 4 }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
          />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{record.name}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>{record.brand}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>{record.model}</div>
          </div>
        </div>
      )
    },
    {
      title: '分类',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 100,
      render: (category_name) => (
        <Tag color="blue">{category_name}</Tag>
      )
    },
    {
      title: '价格',
      key: 'price',
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', color: '#f50' }}>¥{record.price}</div>
          {record.original_price && record.original_price > record.price && (
            <div style={{ textDecoration: 'line-through', color: '#999', fontSize: '12px' }}>
              ¥{record.original_price}
            </div>
          )}
        </div>
      )
    },
    {
      title: '库存',
      key: 'stock',
      width: 120,
      render: (_, record) => {
        const isLowStock = record.stock_quantity <= record.min_stock_level;
        return (
          <div>
            <div style={{ 
              fontWeight: 'bold', 
              color: isLowStock ? '#f50' : '#52c41a' 
            }}>
              {record.stock_quantity}
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              预警: {record.min_stock_level}
            </div>
            {isLowStock && (
              <Badge status="error" text="库存不足" />
            )}
          </div>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusConfig = statusOptions.find(s => s.value === status);
        return (
          <Tag color={statusConfig?.color || 'default'}>
            {statusConfig?.label || status}
          </Tag>
        );
      }
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string[]) => (
        <div>
          {tags?.slice(0, 2).map((tag, index) => (
            <Tag key={index} color="green" style={{ marginBottom: 4 }}>
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
      title: '操作',
      key: 'actions',
      width: 200,
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
          <Button
            type="link"
            icon={<InboxOutlined />}
            onClick={() => openStockModal(record)}
            size="small"
          >
            库存
          </Button>
          <Popconfirm
            title="确定要删除这个商品吗？"
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
      {/* 移除库存预警Alert组件 */}

      {/* 移除统计卡片组件 */}

      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Input.Search
                placeholder="搜索商品名称、品牌或型号"
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
                setEditingProduct(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              新增商品
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 商品列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{
            total: products.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 新增/编辑商品模态框 */}
      <Modal
        title={editingProduct ? '编辑商品' : '新增商品'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingProduct(null);
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'active',
            stock_quantity: 0,
            min_stock_level: 10,
            category: 1
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="商品名称"
                rules={[{ required: true, message: '请输入商品名称' }]}
              >
                <Input placeholder="请输入商品名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="商品分类"
                rules={[{ required: true, message: '请选择商品分类' }]}
              >
                <Select placeholder="请选择商品分类">
                  {categoryOptions.map(cat => (
                    <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="商品描述"
          >
            <TextArea rows={3} placeholder="请输入商品描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="price"
                label="售价（元）"
                rules={[{ required: true, message: '请输入售价' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入售价"
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="original_price"
                label="原价（元）"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入原价"
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="商品状态"
              >
                <Select placeholder="请选择状态">
                  {statusOptions.map(status => (
                    <Option key={status.value} value={status.value}>{status.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="brand"
                label="品牌"
              >
                <Input placeholder="请输入品牌" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="model"
                label="型号"
              >
                <Input placeholder="请输入型号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="manufacturer"
                label="生产厂家"
              >
                <Input placeholder="请输入生产厂家" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="stock_quantity"
                label="库存数量"
                rules={[{ required: true, message: '请输入库存数量' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入库存数量"
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="min_stock_level"
                label="最低库存"
                rules={[{ required: true, message: '请输入最低库存' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入最低库存"
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="weight"
                label="重量"
              >
                <Input placeholder="请输入重量" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="production_date"
                label="生产日期"
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择生产日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expiry_date"
                label="有效期至"
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择有效期" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="tags"
            label="商品标签"
          >
            <Select
              mode="tags"
              placeholder="请输入商品标签，按回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="images"
            label="商品图片URL"
          >
            <Select
              mode="tags"
              placeholder="请输入图片URL，按回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="usage_instructions"
            label="使用说明"
          >
            <TextArea rows={2} placeholder="请输入使用说明" />
          </Form.Item>

          <Form.Item
            name="precautions"
            label="注意事项"
          >
            <TextArea rows={2} placeholder="请输入注意事项" />
          </Form.Item>

          <Divider />
          
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingProduct ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 库存管理模态框 */}
      <Modal
        title={`库存管理 - ${stockProduct?.name}`}
        open={stockModalVisible}
        onCancel={() => {
          setStockModalVisible(false);
          stockForm.resetFields();
          setStockProduct(null);
        }}
        footer={null}
        width={400}
      >
        <Form
          form={stockForm}
          layout="vertical"
          onFinish={handleStockUpdate}
        >
          <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
            <div>当前库存：<strong>{stockProduct?.stock_quantity}</strong></div>
            <div>最低库存：<strong>{stockProduct?.min_stock_level}</strong></div>
          </div>

          <Form.Item
            name="operation"
            label="操作类型"
            rules={[{ required: true, message: '请选择操作类型' }]}
          >
            <Select placeholder="请选择操作类型">
              <Option value="set">设置库存</Option>
              <Option value="add">增加库存</Option>
              <Option value="subtract">减少库存</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="stock_quantity"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入数量"
              min={0}
            />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setStockModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                更新库存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductManagement;