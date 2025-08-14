import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Tag,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { supabase } from '../../utils/supabase'
import type { Department, TableColumn } from '../../types'

const DepartmentsPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  // 加载科室列表
  const loadDepartments = async (page = 1, pageSize = 10, search = '') => {
    setLoading(true)
    try {
      // 模拟数据（实际项目中应该从Supabase获取）
      const mockDepartments: Department[] = [
        {
          id: '1',
          name: '内科',
          description: '内科疾病诊治，包括心血管、呼吸、消化、内分泌等疾病的诊断和治疗',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
        {
          id: '2',
          name: '外科',
          description: '外科手术治疗，包括普通外科、骨科、泌尿外科等手术治疗',
          isActive: true,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
        {
          id: '3',
          name: '儿科',
          description: '儿童疾病诊治，专门针对0-18岁儿童的疾病预防、诊断和治疗',
          isActive: true,
          createdAt: '2024-01-03T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
        {
          id: '4',
          name: '妇科',
          description: '妇科疾病诊治，包括妇科炎症、肿瘤、内分泌疾病等的诊断和治疗',
          isActive: true,
          createdAt: '2024-01-04T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
        {
          id: '5',
          name: '眼科',
          description: '眼部疾病诊治，包括近视、白内障、青光眼等眼部疾病的诊断和治疗',
          isActive: false,
          createdAt: '2024-01-05T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
        {
          id: '6',
          name: '口腔科',
          description: '口腔疾病诊治，包括牙齿疾病、口腔外科、正畸等治疗',
          isActive: true,
          createdAt: '2024-01-06T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
      ]
      
      // 过滤搜索结果
      const filteredDepartments = search
        ? mockDepartments.filter(dept => 
            dept.name.includes(search) || 
            dept.description.includes(search)
          )
        : mockDepartments
      
      setDepartments(filteredDepartments)
      setPagination({
        current: page,
        pageSize,
        total: filteredDepartments.length,
      })
    } catch (error) {
      console.error('Failed to load departments:', error)
      message.error('加载科室列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDepartments()
  }, [])

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value)
    loadDepartments(1, pagination.pageSize, value)
  }

  // 打开添加/编辑模态框
  const openModal = (department?: Department) => {
    setEditingDepartment(department || null)
    setModalVisible(true)
    if (department) {
      form.setFieldsValue(department)
    } else {
      form.resetFields()
      form.setFieldsValue({ isActive: true }) // 默认启用
    }
  }

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false)
    setEditingDepartment(null)
    form.resetFields()
  }

  // 保存科室信息
  const handleSave = async (values: any) => {
    try {
      if (editingDepartment) {
        // 更新科室
        message.success('科室信息更新成功')
      } else {
        // 添加科室
        message.success('科室添加成功')
      }
      
      closeModal()
      loadDepartments(pagination.current, pagination.pageSize, searchText)
    } catch (error) {
      console.error('Failed to save department:', error)
      message.error('保存失败')
    }
  }

  // 删除科室
  const handleDelete = async (id: string) => {
    try {
      // 实际项目中应该调用API删除
      message.success('科室删除成功')
      loadDepartments(pagination.current, pagination.pageSize, searchText)
    } catch (error) {
      console.error('Failed to delete department:', error)
      message.error('删除失败')
    }
  }

  // 切换科室状态
  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      // 实际项目中应该调用API更新状态
      message.success(`科室已${isActive ? '启用' : '禁用'}`)
      loadDepartments(pagination.current, pagination.pageSize, searchText)
    } catch (error) {
      console.error('Failed to toggle department status:', error)
      message.error('状态更新失败')
    }
  }

  // 表格列配置
  const columns: TableColumn<Department>[] = [
    {
      title: '科室名称',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      width: 150,
    },
    {
      title: '科室描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleStatus(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
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
            title="确定要删除这个科室吗？"
            description="删除后该科室下的医生将无法关联，请谨慎操作。"
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
    <div className="departments-page">
      <Card>
        <div className="page-header">
          <h1>科室配置</h1>
          <Space>
            <Input.Search
              placeholder="搜索科室名称或描述"
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
              添加科室
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={departments}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={(paginationInfo) => {
            loadDepartments(paginationInfo.current, paginationInfo.pageSize, searchText)
          }}
        />
      </Card>

      {/* 添加/编辑科室模态框 */}
      <Modal
        title={editingDepartment ? '编辑科室' : '添加科室'}
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
            label="科室名称"
            rules={[
              { required: true, message: '请输入科室名称' },
              { min: 2, max: 20, message: '科室名称长度为2-20个字符' },
            ]}
          >
            <Input placeholder="请输入科室名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="科室描述"
            rules={[
              { required: true, message: '请输入科室描述' },
              { min: 10, max: 200, message: '科室描述长度为10-200个字符' },
            ]}
          >
            <Input.TextArea
              placeholder="请输入科室描述，包括主要诊治范围、特色服务等"
              rows={4}
              showCount
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="状态"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="启用"
              unCheckedChildren="禁用"
            />
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

export default DepartmentsPage