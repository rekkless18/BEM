import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Tag,
  Popconfirm,
  Image,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { supabase } from '../../utils/supabase'
import type { Doctor, Department, TableColumn, PaginationResponse } from '../../types'

const { Option } = Select

const DoctorsPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  // 加载医生列表
  const loadDoctors = async (page = 1, pageSize = 10, search = '') => {
    setLoading(true)
    try {
      // 模拟数据（实际项目中应该从Supabase获取）
      const mockDoctors: Doctor[] = [
        {
          id: '1',
          name: '张医生',
          title: '主任医师',
          departmentId: '1',
          departmentName: '内科',
          phone: '13800138001',
          email: 'zhang@hospital.com',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20doctor%20portrait&image_size=square',
          introduction: '从事内科临床工作20年，擅长心血管疾病诊治。',
          specialties: ['心血管疾病', '高血压', '糖尿病'],
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
        {
          id: '2',
          name: '李医生',
          title: '副主任医师',
          departmentId: '2',
          departmentName: '外科',
          phone: '13800138002',
          email: 'li@hospital.com',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=female%20doctor%20portrait&image_size=square',
          introduction: '外科手术专家，擅长微创手术。',
          specialties: ['微创手术', '腹腔镜', '胆囊切除'],
          isActive: true,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
        {
          id: '3',
          name: '王医生',
          title: '主治医师',
          departmentId: '3',
          departmentName: '儿科',
          phone: '13800138003',
          email: 'wang@hospital.com',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=pediatric%20doctor%20portrait&image_size=square',
          introduction: '儿科专家，对儿童常见病有丰富经验。',
          specialties: ['儿童感冒', '儿童发育', '疫苗接种'],
          isActive: false,
          createdAt: '2024-01-03T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
      ]
      
      // 过滤搜索结果
      const filteredDoctors = search
        ? mockDoctors.filter(doctor => 
            doctor.name.includes(search) || 
            doctor.departmentName.includes(search)
          )
        : mockDoctors
      
      setDoctors(filteredDoctors)
      setPagination({
        current: page,
        pageSize,
        total: filteredDoctors.length,
      })
    } catch (error) {
      console.error('Failed to load doctors:', error)
      message.error('加载医生列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载科室列表
  const loadDepartments = async () => {
    try {
      // 模拟科室数据
      const mockDepartments: Department[] = [
        { id: '1', name: '内科', description: '内科疾病诊治', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '2', name: '外科', description: '外科手术治疗', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '3', name: '儿科', description: '儿童疾病诊治', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '4', name: '妇科', description: '妇科疾病诊治', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      ]
      setDepartments(mockDepartments)
    } catch (error) {
      console.error('Failed to load departments:', error)
    }
  }

  useEffect(() => {
    loadDoctors()
    loadDepartments()
  }, [])

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value)
    loadDoctors(1, pagination.pageSize, value)
  }

  // 打开添加/编辑模态框
  const openModal = (doctor?: Doctor) => {
    setEditingDoctor(doctor || null)
    setModalVisible(true)
    if (doctor) {
      form.setFieldsValue({
        ...doctor,
        specialties: doctor.specialties.join(', '),
      })
    } else {
      form.resetFields()
    }
  }

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false)
    setEditingDoctor(null)
    form.resetFields()
  }

  // 保存医生信息
  const handleSave = async (values: any) => {
    try {
      const doctorData = {
        ...values,
        specialties: values.specialties.split(',').map((s: string) => s.trim()).filter(Boolean),
        departmentName: departments.find(d => d.id === values.departmentId)?.name || '',
      }
      
      if (editingDoctor) {
        // 更新医生
        message.success('医生信息更新成功')
      } else {
        // 添加医生
        message.success('医生添加成功')
      }
      
      closeModal()
      loadDoctors(pagination.current, pagination.pageSize, searchText)
    } catch (error) {
      console.error('Failed to save doctor:', error)
      message.error('保存失败')
    }
  }

  // 删除医生
  const handleDelete = async (id: string) => {
    try {
      // 实际项目中应该调用API删除
      message.success('医生删除成功')
      loadDoctors(pagination.current, pagination.pageSize, searchText)
    } catch (error) {
      console.error('Failed to delete doctor:', error)
      message.error('删除失败')
    }
  }

  // 表格列配置
  const columns: TableColumn<Doctor>[] = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar: string) => (
        <Image
          src={avatar}
          alt="医生头像"
          width={50}
          height={50}
          style={{ borderRadius: '50%', objectFit: 'cover' }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
        />
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: '职称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '科室',
      dataIndex: 'departmentName',
      key: 'departmentName',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '专长',
      dataIndex: 'specialties',
      key: 'specialties',
      render: (specialties: string[]) => (
        <>
          {specialties.slice(0, 2).map((specialty, index) => (
            <Tag key={index} color="blue">
              {specialty}
            </Tag>
          ))}
          {specialties.length > 2 && <Tag>+{specialties.length - 2}</Tag>}
        </>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个医生吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="doctors-page">
      <Card>
        <div className="page-header">
          <h1>医生配置</h1>
          <Space>
            <Input.Search
              placeholder="搜索医生姓名或科室"
              allowClear
              style={{ width: 300 }}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
            >
              添加医生
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={doctors}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={(paginationInfo) => {
            loadDoctors(paginationInfo.current, paginationInfo.pageSize, searchText)
          }}
        />
      </Card>

      {/* 添加/编辑医生模态框 */}
      <Modal
        title={editingDoctor ? '编辑医生' : '添加医生'}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入医生姓名' }]}
          >
            <Input placeholder="请输入医生姓名" />
          </Form.Item>

          <Form.Item
            name="title"
            label="职称"
            rules={[{ required: true, message: '请选择职称' }]}
          >
            <Select placeholder="请选择职称">
              <Option value="主任医师">主任医师</Option>
              <Option value="副主任医师">副主任医师</Option>
              <Option value="主治医师">主治医师</Option>
              <Option value="住院医师">住院医师</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="departmentId"
            label="科室"
            rules={[{ required: true, message: '请选择科室' }]}
          >
            <Select placeholder="请选择科室">
              {departments.map(dept => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="phone"
            label="联系电话"
            rules={[
              { required: true, message: '请输入联系电话' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' },
            ]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入正确的邮箱格式' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="specialties"
            label="专长"
            rules={[{ required: true, message: '请输入专长' }]}
          >
            <Input.TextArea
              placeholder="请输入专长，多个专长用逗号分隔"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="introduction"
            label="简介"
          >
            <Input.TextArea
              placeholder="请输入医生简介"
              rows={4}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="状态"
            initialValue={true}
          >
            <Select>
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={closeModal}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DoctorsPage