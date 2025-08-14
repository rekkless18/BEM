import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

// 管理员用户接口定义
interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  created_at: string;
  last_login?: string;
}

// 角色选项
const ROLE_OPTIONS = [
  { label: '超级管理员', value: 'super_admin' },
  { label: '医疗管理员', value: 'medical_admin' },
  { label: '营销管理员', value: 'marketing_admin' },
  { label: '商城管理员', value: 'mall_admin' },
];

// 状态选项
const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '禁用', value: 'inactive' },
];

const AdminManagement: React.FC = () => {
  // 状态管理
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]); // 管理员用户列表
  const [loading, setLoading] = useState(false); // 加载状态
  const [modalVisible, setModalVisible] = useState(false); // 模态框显示状态
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null); // 编辑中的用户
  const [form] = Form.useForm(); // 表单实例

  // 表格列配置
  const columns: ColumnsType<AdminUser> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => {
        const roleOption = ROLE_OPTIONS.find(option => option.value === role);
        return <Tag color="blue">{roleOption?.label || role}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '最后登录',
      dataIndex: 'last_login',
      key: 'last_login',
      width: 180,
      render: (date?: string) => date ? new Date(date).toLocaleString() : '从未登录',
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
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个管理员吗？"
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
      ),
    },
  ];

  // 组件挂载时加载数据
  useEffect(() => {
    fetchAdminUsers();
  }, []);

  // 获取管理员用户列表
  const fetchAdminUsers = async () => {
    setLoading(true);
    try {
      // TODO: 调用API获取管理员用户列表
      // const response = await adminUserService.getAdminUsers();
      // setAdminUsers(response.data);
      
      // 模拟数据
      const mockData: AdminUser[] = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'super_admin',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          last_login: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          username: 'medical_admin',
          email: 'medical@example.com',
          role: 'medical_admin',
          status: 'active',
          created_at: '2024-01-02T00:00:00Z',
          last_login: '2024-01-14T15:20:00Z',
        },
      ];
      setAdminUsers(mockData);
    } catch (error) {
      message.error('获取管理员列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理新增管理员
  const handleAdd = () => {
    setEditingUser(null);
    setModalVisible(true);
    form.resetFields();
  };

  // 处理编辑管理员
  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setModalVisible(true);
    form.setFieldsValue(user);
  };

  // 处理删除管理员
  const handleDelete = async (id: string) => {
    try {
      // TODO: 调用API删除管理员
      // await adminUserService.deleteAdminUser(id);
      
      setAdminUsers(prev => prev.filter(user => user.id !== id));
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        // 更新管理员
        // TODO: 调用API更新管理员
        // await adminUserService.updateAdminUser(editingUser.id, values);
        
        setAdminUsers(prev => 
          prev.map(user => 
            user.id === editingUser.id ? { ...user, ...values } : user
          )
        );
        message.success('更新成功');
      } else {
        // 新增管理员
        // TODO: 调用API新增管理员
        // const response = await adminUserService.createAdminUser(values);
        
        const newUser: AdminUser = {
          id: Date.now().toString(),
          ...values,
          created_at: new Date().toISOString(),
        };
        setAdminUsers(prev => [...prev, newUser]);
        message.success('新增成功');
      }
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(editingUser ? '更新失败' : '新增失败');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="管理员管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增管理员
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={adminUsers}
          rowKey="id"
          loading={loading}
          pagination={{
            total: adminUsers.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingUser ? '编辑管理员' : '新增管理员'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select
              placeholder="请选择角色"
              options={ROLE_OPTIONS}
            />
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select
              placeholder="请选择状态"
              options={STATUS_OPTIONS}
            />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? '更新' : '新增'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminManagement;