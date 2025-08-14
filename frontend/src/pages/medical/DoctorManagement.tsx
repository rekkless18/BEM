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
  Avatar,
  Card,
  Row,
  Col,
  Divider,
  Rate
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Doctor, Department, ApiResponse } from '../../types';
import { doctorApi, departmentApi } from '../../services/supabaseApi';
import { useAuthStore } from '../../stores/authStore';

const { Option } = Select;
const { TextArea } = Input;

interface DoctorFormData {
  name: string;
  title: string;
  department: string;
  department_id?: string;
  specialties: string[];
  experience_years: number;
  avatar?: string;
  introduction?: string;
  consultation_fee: number;
  working_hours?: any;
  is_active: boolean;
  hospital?: string;
  rating?: number;
  response_time?: string;
  good_rate?: number;
  work_time?: string[];
}

const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 状态筛选：all-全部状态, active-在职, inactive-离职
  // 分页状态管理
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 统计数据获取函数已移除

  // 获取医生列表（支持分页、搜索、部门筛选、状态筛选）
  const fetchDoctors = async (page?: number, pageSize?: number) => {
    setLoading(true);
    try {
      const currentPage = page || pagination.current;
      const currentPageSize = pageSize || pagination.pageSize;
      
      // 构建请求参数
      const params: any = {
        page: currentPage,
        limit: currentPageSize
      };
      
      // 添加搜索条件
      if (searchText && searchText.trim()) {
        params.search = searchText.trim();
      }
      
      // 添加部门筛选条件
      if (selectedDepartment && selectedDepartment.trim()) {
        params.department = selectedDepartment.trim();
      }
      
      // 添加状态筛选条件
      // 重构状态筛选逻辑，确保参数传递清晰
      if (statusFilter === 'active') {
        // 只显示在职医生
        params.is_active = true;
      } else if (statusFilter === 'inactive') {
        // 只显示离职医生
        params.is_active = false;
      }
      // 当statusFilter为'all'时，不传递is_active参数，显示所有状态的医生
      

      const response = await doctorApi.getList(params);
      
      if (response.success) {
        const doctorsData = response.data || [];
        setDoctors(doctorsData);
        
        // 更新分页状态
        setPagination(prev => ({
          ...prev,
          current: currentPage,
          pageSize: currentPageSize,
          total: response.pagination?.total || 0
        }));
      } else {
        message.error(response.message || '获取医生列表失败');
        setDoctors([]);
      }
    } catch (error) {
      message.error('获取医生列表失败，请检查网络连接');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取科室列表
  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getList();
      if (response.success) {
        setDepartments(response.data || []);
      }
    } catch (error) {
      message.error('获取科室列表失败');
    }
  };

  // 初始化数据加载
  useEffect(() => {
    const initializeData = async () => {
      // 并行加载科室列表
      await fetchDepartments();
      
      // 然后加载医生列表
      await fetchDoctors();
    };
    
    initializeData();
  }, []);
  
  // 监听筛选条件变化，重新获取医生列表
  useEffect(() => {
    if (searchText !== undefined && selectedDepartment !== undefined && statusFilter !== undefined) {
      fetchDoctors(1, pagination.pageSize); // 筛选时重置到第一页
    }
  }, [searchText, selectedDepartment, statusFilter]);

  // 处理新增/编辑医生
  const handleSubmit = async (values: DoctorFormData) => {
    try {
      const doctorData = {
        ...values,
        specialties: Array.isArray(values.specialties) ? values.specialties : [values.specialties],
        // 确保数值类型字段正确转换
        experience_years: Number(values.experience_years),
        consultation_fee: Number(values.consultation_fee),
        rating: values.rating ? Number(values.rating) : 0,
        good_rate: values.good_rate ? Number(values.good_rate) : 0.95,
      };

      if (editingDoctor) {
        const response = await doctorApi.update(editingDoctor.id, doctorData);
        if (response.success) {
          message.success('更新医生信息成功');
          fetchDoctors();
        }
      } else {
        const response = await doctorApi.create(doctorData);
        if (response.success) {
          message.success('创建医生成功');
          fetchDoctors();
        }
      }
      setModalVisible(false);
      form.resetFields();
      setEditingDoctor(null);
    } catch (error) {
      message.error(editingDoctor ? '更新医生失败' : '创建医生失败');
    }
  };

  // 处理删除医生
  const handleDelete = async (id: string) => {
    try {
      const response = await doctorApi.delete(id);
      if (response.success) {
        message.success('删除医生成功');
        fetchDoctors();
      }
    } catch (error) {
      message.error('删除医生失败');
    }
  };

  // 切换医生可用状态
  const toggleAvailability = async (doctor: Doctor) => {
    try {
      const response = await doctorApi.update(doctor.id, { is_active: !doctor.is_active });
      if (response.success) {
        // 立即更新本地状态，避免等待重新获取列表
        setDoctors(prevDoctors => 
          prevDoctors.map(d => 
            d.id === doctor.id 
              ? { ...d, is_active: !d.is_active }
              : d
          )
        );
        
        message.success('更新医生状态成功');
      }
    } catch (error) {
      message.error('更新医生状态失败');
    }
  };

  // 打开编辑模态框
  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    form.setFieldsValue({
      name: doctor.name,
      title: doctor.title,
      department: doctor.department,
      experience_years: doctor.experience_years,
      specialties: doctor.specialties || [],
      consultation_fee: doctor.consultation_fee,
      is_active: doctor.is_active,
      introduction: doctor.introduction,
      avatar: doctor.avatar,
      hospital: doctor.hospital,
      rating: doctor.rating,
      response_time: doctor.response_time,
      good_rate: doctor.good_rate,
      work_time: doctor.work_time || [],
    });
    setModalVisible(true);
  };

  // 表格列定义
  const columns: ColumnsType<Doctor> = [
    {
      title: '医生信息',
      key: 'doctor_info',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={record.avatar} 
            icon={<UserOutlined />} 
            size={40}
            style={{ marginRight: 12 }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.name}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>{record.title}</div>
          </div>
        </div>
      )
    },
    {
      title: '科室',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (department) => (
        <Tag color="blue">{department}</Tag>
      )
    },
    {
      title: '专长',
      dataIndex: 'specialties',
      key: 'specialties',
      width: 200,
      render: (specialties: string[]) => (
        <div>
          {specialties?.slice(0, 2).map((specialty, index) => (
            <Tag key={index} color="green" style={{ marginBottom: 4 }}>
              {specialty}
            </Tag>
          ))}
          {specialties?.length > 2 && (
            <Tag color="default">+{specialties.length - 2}</Tag>
          )}
        </div>
      )
    },
    {
      title: '经验年限',
      dataIndex: 'experience_years',
      key: 'experience_years',
      width: 100,
      render: (years) => `${years || 0}年`
    },
    {
      title: '所属医院',
      dataIndex: 'hospital',
      key: 'hospital',
      width: 120
    },
    {
      title: '诊疗费',
      dataIndex: 'consultation_fee',
      key: 'consultation_fee',
      width: 100,
      render: (fee) => `¥${fee || 0}`
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 120,
      render: (rating) => (
        <div>
          {rating ? `${rating.toFixed(1)}分` : '暂无评分'}
        </div>
      )
    },
    {
      title: '好评率',
      dataIndex: 'good_rate',
      key: 'good_rate',
      width: 100,
      render: (rate) => rate ? `${(rate * 100).toFixed(1)}%` : '暂无'
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (is_active, record) => (
        <Switch
          checked={is_active}
          onChange={() => toggleAvailability(record)}
          checkedChildren="在职"
          unCheckedChildren="离职"
        />
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
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个医生吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
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
      {/* 统计卡片已移除 */}

      {/* 搜索和操作区域 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder="搜索医生姓名或专长"
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
              <Option value="active">在职</Option>
              <Option value="inactive">离职</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="科室筛选"
              value={selectedDepartment || 'all'}
              onChange={(value) => setSelectedDepartment(value === 'all' ? '' : value)}
              style={{ width: '100%' }}
            >
              <Option value="all">全部科室</Option>
              {departments.map(dept => (
                <Option key={dept.id} value={dept.name}>{dept.name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={10}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => {
                  setPagination(prev => ({ ...prev, current: 1 })); // 搜索时重置到第一页
                  fetchDoctors(1, pagination.pageSize);
                }}
              >
                搜索
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSearchText('');
                  setSelectedDepartment('');
                  setStatusFilter('all'); // 重置状态筛选
                  setPagination(prev => ({ ...prev, current: 1 })); // 重置到第一页
                  fetchDoctors(1, pagination.pageSize);
                }}
              >
                重置
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingDoctor(null);
                  form.resetFields();
                  setModalVisible(true);
                }}
              >
                新增医生
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 医生列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={doctors}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, pageSize) => {
              fetchDoctors(page, pageSize);
            },
            onShowSizeChange: (current, size) => {
              fetchDoctors(1, size); // 改变页面大小时回到第一页
            }
          }}
        />
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingDoctor ? '编辑医生' : '新增医生'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingDoctor(null);
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
            consultation_fee: 0,
            experience_years: 0
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="医生姓名"
                rules={[{ required: true, message: '请输入医生姓名' }]}
              >
                <Input placeholder="请输入医生姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="title"
                label="职称"
                rules={[{ required: true, message: '请输入职称' }]}
              >
                <Select placeholder="请选择职称">
                  <Option value="主任医师">主任医师</Option>
                  <Option value="副主任医师">副主任医师</Option>
                  <Option value="主治医师">主治医师</Option>
                  <Option value="住院医师">住院医师</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="department"
                label="科室"
                rules={[{ required: true, message: '请选择科室' }]}
              >
                <Select placeholder="请选择科室">
                  {departments.map(dept => (
                    <Option key={dept.id} value={dept.name}>{dept.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="experience_years"
                label="经验年限"
              >
                <Input type="number" placeholder="请输入经验年限" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="specialties"
            label="专长领域"
          >
            <Select
              mode="tags"
              placeholder="请输入专长领域，按回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="hospital"
                label="所属医院"
              >
                <Input placeholder="请输入所属医院" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="response_time"
                label="响应时间"
              >
                <Select placeholder="请选择响应时间">
                  <Option value="5分钟内">5分钟内</Option>
                  <Option value="10分钟内">10分钟内</Option>
                  <Option value="30分钟内">30分钟内</Option>
                  <Option value="1小时内">1小时内</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="consultation_fee"
                label="诊疗费（元）"
              >
                <Input type="number" placeholder="请输入诊疗费" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="rating"
                label="评分"
              >
                <Input type="number" placeholder="请输入评分" min={0} max={5} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="good_rate"
                label="好评率"
              >
                <Input type="number" placeholder="请输入好评率" min={0} max={1} step={0.01} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="is_active"
                label="是否在职"
                valuePropName="checked"
              >
                <Switch checkedChildren="在职" unCheckedChildren="离职" />
              </Form.Item>
            </Col>
          </Row>



          <Form.Item
            name="introduction"
            label="个人简介"
          >
            <TextArea rows={4} placeholder="请输入个人简介" />
          </Form.Item>

          <Form.Item
            name="work_time"
            label="工作时间"
          >
            <Select
              mode="multiple"
              placeholder="请选择工作时间"
              options={[
                { label: '周一', value: '周一' },
                { label: '周二', value: '周二' },
                { label: '周三', value: '周三' },
                { label: '周四', value: '周四' },
                { label: '周五', value: '周五' },
                { label: '周六', value: '周六' },
                { label: '周日', value: '周日' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="avatar"
            label="头像URL"
          >
            <Input placeholder="请输入头像URL" />
          </Form.Item>

          <Divider />
          
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingDoctor ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DoctorManagement;