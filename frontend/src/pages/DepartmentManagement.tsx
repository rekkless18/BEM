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
  TimePicker,
  InputNumber
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Department, Doctor, ApiResponse } from '../types';
import { departmentApi, doctorApi } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = TimePicker;

interface DepartmentFormData {
  name: string;
  description?: string;
  head_doctor_id?: string;
  location?: string;
  phone?: string;
  email?: string;
  working_hours?: any;
  services?: string[];
  equipment?: string[];
  specialties?: string[];
  is_active: boolean;
  sort_order?: number;
}

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false); // 医生列表加载状态
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 状态筛选：all, active, inactive
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 获取科室列表
  const fetchDepartments = async (page?: number, pageSize?: number) => {
    setLoading(true);
    try {
      const currentPage = page || pagination.current;
      const currentPageSize = pageSize || pagination.pageSize;
      
      const params: any = {
        page: currentPage,
        limit: currentPageSize
      };
      
      if (searchText) {
        params.search = searchText;
      }
      
      // 添加状态筛选条件
      if (statusFilter === 'active') {
        // 只显示启用的科室
        params.is_active = 'true';
      } else if (statusFilter === 'inactive') {
        // 只显示禁用的科室
        params.is_active = 'false';
      }
      // 当statusFilter为'all'时，不传递is_active参数，显示所有状态的科室
      
      console.log('🔍 发起科室列表请求，状态筛选:', statusFilter, '参数:', params);
      const response = await departmentApi.getList(params);
      console.log('📡 科室API响应:', response);
      
      const apiResponse = response.data;
      if (apiResponse.success) {
        console.log('✅ 科室API成功，数据:', apiResponse.data);
        const departmentsData = apiResponse.data;
        
        setDepartments(departmentsData);
        
        // 更新分页状态
        setPagination({
          current: currentPage,
          pageSize: currentPageSize,
          total: apiResponse.pagination?.total || departmentsData.length
        });
        
        console.log(`🏥 获取科室列表成功，状态筛选: ${statusFilter}, 数量: ${departmentsData.length}`);
        

      } else {
        console.error('❌ 科室API请求失败:', apiResponse.message);
        message.error(apiResponse.message || '获取科室列表失败');
      }
    } catch (error) {
      console.error('💥 科室请求异常:', error);
      message.error('获取科室列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取在职医生列表（用于选择科室负责人）
  const fetchActiveDoctors = async () => {
    try {
      setDoctorsLoading(true); // 开始加载
      
      // 只获取在职医生（is_active=true）
      const params = {
        is_active: true, // 筛选在职医生
        limit: 1000 // 获取足够多的医生数据用于选择
      };
      
      console.log('🔍 获取在职医生列表，参数:', params);
      const response = await doctorApi.getList(params);
      const apiResponse = response.data;
      
      if (apiResponse.success) {
        const activeDoctors = apiResponse.data || [];
        setDoctors(activeDoctors);
        console.log(`👨‍⚕️ 获取在职医生成功，数量: ${activeDoctors.length}`);
      } else {
        console.error('❌ 获取在职医生失败:', apiResponse.message);
        message.error('获取在职医生列表失败');
      }
    } catch (error) {
      console.error('💥 获取在职医生异常:', error);
      message.error('获取在职医生列表失败');
    } finally {
      setDoctorsLoading(false); // 结束加载
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchActiveDoctors(); // 获取在职医生列表用于选择负责人
  }, []);

  // 处理新增/编辑科室
  const handleSubmit = async (values: DepartmentFormData) => {
    try {
      const departmentData = {
        ...values,
        services: Array.isArray(values.services) ? values.services : [],
        equipment: Array.isArray(values.equipment) ? values.equipment : [],
        specialties: Array.isArray(values.specialties) ? values.specialties : [],
        sort_order: values.sort_order || 999
      };

      if (editingDepartment) {
        const response = await departmentApi.update(editingDepartment.id, departmentData);
        const apiResponse = response.data;
        if (apiResponse.success) {
          message.success('更新科室信息成功');
          fetchDepartments();
        }
      } else {
        const response = await departmentApi.create(departmentData);
        const apiResponse = response.data;
        if (apiResponse.success) {
          message.success('创建科室成功');
          fetchDepartments();
        }
      }
      setModalVisible(false);
      form.resetFields();
      setEditingDepartment(null);
    } catch (error) {
      message.error(editingDepartment ? '更新科室失败' : '创建科室失败');
    }
  };

  // 处理删除科室
  const handleDelete = async (id: string) => {
    try {
      const response = await departmentApi.delete(id);
      const apiResponse = response.data;
      if (apiResponse.success) {
        message.success('删除科室成功');
        fetchDepartments();
      }
    } catch (error) {
      message.error('删除科室失败');
    }
  };

  // 切换科室状态
  const toggleStatus = async (id: string, is_active: boolean) => {
    try {
      const response = await departmentApi.update(id, { is_active });
      const apiResponse = response.data;
      if (apiResponse.success) {
        message.success(`${is_active ? '启用' : '禁用'}科室成功`);
        fetchDepartments();
      }
    } catch (error) {
      message.error('更新科室状态失败');
    }
  };

  // 处理编辑
  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    form.setFieldsValue({
      ...department,
      services: department.services || [],
      equipment: department.equipment || [],
      specialties: department.specialties || []
    });
    setModalVisible(true);
    fetchActiveDoctors(); // 编辑时重新获取在职医生数据
  };

  // 表格列定义
  const columns: ColumnsType<Department> = [
    {
      title: '科室名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text: string, record: Department) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {record.description.length > 30 
                ? `${record.description.substring(0, 30)}...` 
                : record.description
              }
            </div>
          )}
        </div>
      )
    },
    {
      title: '科室负责人',
      dataIndex: 'head_doctor',
      key: 'head_doctor',
      width: 120,
      render: (head_doctor: any) => (
        head_doctor ? (
          <div>
            <div>{head_doctor.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{head_doctor.title}</div>
          </div>
        ) : (
          <span style={{ color: '#999' }}>未设置</span>
        )
      )
    },
    {
      title: '联系信息',
      key: 'contact',
      width: 180,
      render: (_, record: Department) => (
        <div>
          {record.phone && (
            <div style={{ fontSize: '12px', marginBottom: '2px' }}>
              <PhoneOutlined style={{ marginRight: '4px' }} />
              {record.phone}
            </div>
          )}
          {record.email && (
            <div style={{ fontSize: '12px', marginBottom: '2px' }}>
              <MailOutlined style={{ marginRight: '4px' }} />
              {record.email}
            </div>
          )}
          {record.location && (
            <div style={{ fontSize: '12px' }}>
              <EnvironmentOutlined style={{ marginRight: '4px' }} />
              {record.location}
            </div>
          )}
        </div>
      )
    },
    {
      title: '专业特长',
      dataIndex: 'specialties',
      key: 'specialties',
      width: 200,
      render: (specialties: string[]) => (
        <div>
          {specialties && specialties.length > 0 ? (
            specialties.slice(0, 3).map((specialty, index) => (
              <Tag key={index} color="blue" style={{ marginBottom: '2px' }}>
                {specialty}
              </Tag>
            ))
          ) : (
            <span style={{ color: '#999' }}>未设置</span>
          )}
          {specialties && specialties.length > 3 && (
            <Tag color="default">+{specialties.length - 3}</Tag>
          )}
        </div>
      )
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      sorter: (a, b) => (a.sort_order || 999) - (b.sort_order || 999)
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (is_active: boolean, record: Department) => (
        <Switch
          checked={is_active}
          onChange={(checked) => toggleStatus(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record: Department) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个科室吗？"
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

  return (
    <div style={{ padding: '24px' }}>


      {/* 搜索和操作区域 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder="搜索科室名称或描述"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="状态筛选"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部状态</Option>
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Col>
          <Col span={14}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => {
                  setPagination({ ...pagination, current: 1 });
                  fetchDepartments(1, pagination.pageSize);
                }}
              >
                搜索
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSearchText('');
                  setStatusFilter('all'); // 重置状态筛选
                  setPagination({ ...pagination, current: 1 });
                  fetchDepartments(1, pagination.pageSize);
                }}
              >
                重置
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingDepartment(null);
                  form.resetFields();
                  setModalVisible(true);
                  fetchActiveDoctors(); // 打开模态框时重新获取在职医生数据
                }}
              >
                新增科室
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 科室列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={departments}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
              fetchDepartments(page, pageSize);
            },
            onShowSizeChange: (current, size) => {
              setPagination({ ...pagination, current: 1, pageSize: size });
              fetchDepartments(1, size);
            }
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingDepartment ? '编辑科室' : '新增科室'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingDepartment(null);
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            is_active: true,
            sort_order: 999
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="科室名称"
                rules={[{ required: true, message: '请输入科室名称' }]}
              >
                <Input placeholder="请输入科室名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="head_doctor_id"
                label="科室负责人"
              >
                <Select 
                  placeholder="请选择科室负责人" 
                  allowClear
                  loading={doctorsLoading}
                  notFoundContent={doctorsLoading ? '加载中...' : '暂无在职医生'}
                >
                  {doctors.map(doctor => (
                    <Option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.title} ({doctor.department || '未分配科室'})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="科室描述"
            rules={[{ required: true, message: '请输入科室描述' }]}
          >
            <TextArea rows={3} placeholder="请输入科室描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="location"
                label="科室位置"
              >
                <Input placeholder="请输入科室位置" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="phone"
                label="联系电话"
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="email"
                label="邮箱地址"
              >
                <Input placeholder="请输入邮箱地址" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="services"
                label="提供服务"
              >
                <Select
                  mode="tags"
                  placeholder="请输入提供的服务，按回车添加"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="equipment"
                label="设备列表"
              >
                <Select
                  mode="tags"
                  placeholder="请输入设备名称，按回车添加"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="specialties"
                label="专业特长"
              >
                <Select
                  mode="tags"
                  placeholder="请输入专业特长，按回车添加"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="sort_order"
                label="排序"
              >
                <InputNumber
                  placeholder="排序值"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="is_active"
                label="状态"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingDepartment ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DepartmentManagement;