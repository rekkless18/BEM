import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Tag,
  Card,
  // DatePicker, // 暂时注释掉未使用的导入
  Avatar
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  ReloadOutlined,
  ExportOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { userApi } from '../services/api';

const { Option } = Select;
// const { RangePicker } = DatePicker; // 暂时注释掉未使用的导入

/**
 * 用户数据接口
 */
interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin' | 'doctor';
  is_active: boolean;
  avatar_url?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  system_type?: string; // 所属系统字段
}

/**
 * 用户管理页面组件
 */
const UserManagement: React.FC = () => {
  // 状态管理
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [systemFilter, setSystemFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const [form] = Form.useForm();

  /**
   * 获取用户列表
   */
  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pageSize
      };
      
      if (searchText) params.search = searchText;
      if (statusFilter !== 'all') {
        // 将前端的'active'/'inactive'转换为后端期望的布尔值
        params.is_active = statusFilter === 'active';
      }
      if (systemFilter !== 'all') params.system_type = systemFilter;

      const response = await userApi.getList(params);
      
      if (response.data.success) {
        // 后端返回的数据结构是 {data: {users: [...], pagination: {...}}}
        const userData = response.data.data;
        const userList = Array.isArray(userData) ? userData : (userData.users || []);
        
        setUsers(userList);
        setPagination({
          current: userData.pagination?.page || page,
          pageSize: userData.pagination?.limit || pageSize,
          total: userData.pagination?.total || userList.length
        });
        
        // 统计数据已移除
      } else {
        message.error(response.data.message || '获取用户列表失败');
      }
    } catch (error) {
      console.error('获取用户列表错误:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 统计数据更新函数已移除

  /**
   * 创建或更新用户
   */
  const handleSubmit = async (values: any) => {
    try {
      let response;
      
      if (editingUser) {
        response = await userApi.update(editingUser.id, values);
      } else {
        response = await userApi.create(values);
      }

      if (response.data.success) {
        message.success(editingUser ? '更新用户成功' : '创建用户成功');
        setModalVisible(false);
        setEditingUser(null);
        form.resetFields();
        fetchUsers(pagination.current, pagination.pageSize);
      } else {
        message.error(response.data.message || (editingUser ? '更新用户失败' : '创建用户失败'));
      }
    } catch (error) {
      console.error('提交用户数据错误:', error);
      message.error(editingUser ? '更新用户失败' : '创建用户失败');
    }
  };

  /**
   * 删除用户
   */
  const handleDelete = async (id: string) => {
    try {
      const response = await userApi.delete(id);
      
      if (response.data.success) {
        message.success('删除用户成功');
        fetchUsers(pagination.current, pagination.pageSize);
      } else {
        message.error(response.data.message || '删除用户失败');
      }
    } catch (error) {
      console.error('删除用户错误:', error);
      message.error('删除用户失败');
    }
  };

  /**
   * 切换用户状态
   */
  const toggleUserStatus = async (user: User) => {
    try {
      const response = await userApi.update(user.id, {
        ...user,
        is_active: !user.is_active
      });

      if (response.data.success) {
        message.success(`用户已${!user.is_active ? '启用' : '禁用'}`);
        fetchUsers(pagination.current, pagination.pageSize);
      } else {
        message.error(response.data.message || '更新用户状态失败');
      }
    } catch (error) {
      console.error('更新用户状态错误:', error);
      message.error('更新用户状态失败');
    }
  };

  /**
   * 打开编辑模态框
   */
  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      created_at: user.created_at ? dayjs(user.created_at) : null
    });
    setModalVisible(true);
  };

  /**
   * 执行搜索
   */
  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchUsers(1, pagination.pageSize);
  };

  /**
   * 重置搜索
   */
  const handleReset = () => {
    setSearchText('');
    setStatusFilter('all');
    setSystemFilter('all');
    setPagination({ ...pagination, current: 1 });
    fetchUsers(1, pagination.pageSize);
  };

  // 表格列定义
  const columns: ColumnsType<User> = [
    {
      title: '头像',
      dataIndex: 'avatar_url',
      key: 'avatar',
      width: 80,
      render: (avatar_url: string, record: User) => (
        <Avatar 
          src={avatar_url} 
          icon={<UserOutlined />}
          size={40}
        >
          {!avatar_url && record.name?.charAt(0)}
        </Avatar>
      )
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (text: string) => text || '-'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => {
        const roleColors = {
          admin: 'red',
          doctor: 'blue',
          user: 'green'
        };
        const roleNames = {
          admin: '管理员',
          doctor: '医生',
          user: '用户'
        };
        return (
          <Tag color={roleColors[role as keyof typeof roleColors]}>
            {roleNames[role as keyof typeof roleNames] || role}
          </Tag>
        );
      }
    },
    {
      title: '所属系统',
      dataIndex: 'system_type',
      key: 'system_type',
      width: 120,
      render: (system_type: string) => {
        const systemColors = {
          WIP: 'orange',
          LIS: 'green',
          HIS: 'blue'
        };
        return (
          <Tag color={systemColors[system_type as keyof typeof systemColors] || 'default'}>
            {system_type || 'WIP'}
          </Tag>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'status',
      width: 100,
      render: (is_active: boolean, record: User) => (
        <Switch
          checked={is_active}
          onChange={() => toggleUserStatus(record)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      )
    },
    {
      title: '最后登录',
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      width: 150,
      render: (text: string) => 
        text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record: User) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            description="删除后无法恢复，请谨慎操作。"
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

  // 组件挂载时获取数据
  useEffect(() => {
    fetchUsers();
  }, []);

  // 搜索条件变化时重新获取数据
  useEffect(() => {
    if (searchText || statusFilter !== 'all' || systemFilter !== 'all') {
      const timer = setTimeout(() => {
        fetchUsers(1, pagination.pageSize);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchText, statusFilter, systemFilter]);

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片已移除 */}

      {/* 搜索和操作区域 */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: '0 0 25%' }}>
            <Input
              placeholder="搜索用户名、邮箱或姓名"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </div>
          <div style={{ flex: '0 0 16.67%' }}>
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
          </div>
          <div style={{ flex: '0 0 16.67%' }}>
            <Select
              placeholder="所属系统筛选"
              value={systemFilter}
              onChange={setSystemFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部系统</Option>
              <Option value="WIP">WIP</Option>
              <Option value="LIS">LIS</Option>
              <Option value="HIS">HIS</Option>
            </Select>
          </div>
          <div style={{ flex: '1' }}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                搜索
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                重置
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingUser(null);
                  form.resetFields();
                  setModalVisible(true);
                }}
              >
                添加用户
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={() => message.info('导出功能开发中...')}
              >
                导出
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      {/* 用户表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
              fetchUsers(page, pageSize);
            }
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 添加/编辑用户模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            role: 'user',
            is_active: true,
            system_type: 'WIP'
          }}
        >
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <Form.Item
                label="用户名"
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                  { max: 20, message: '用户名最多20个字符' }
                ]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item
                label="姓名"
                name="name"
                rules={[
                  { required: true, message: '请输入姓名' },
                  { max: 50, message: '姓名最多50个字符' }
                ]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item
                label="手机号"
                name="phone"
                rules={[
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <Form.Item
                label="角色"
                name="role"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  <Option value="user">用户</Option>
                  <Option value="doctor">医生</Option>
                  <Option value="admin">管理员</Option>
                </Select>
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item
                label="所属系统"
                name="system_type"
                rules={[{ required: true, message: '请选择所属系统' }]}
              >
                <Select placeholder="请选择所属系统">
                  <Option value="WIP">WIP</Option>
                  <Option value="LIS">LIS</Option>
                  <Option value="HIS">HIS</Option>
                </Select>
              </Form.Item>
            </div>
            <div style={{ flex: 1 }}>
              <Form.Item
                label="状态"
                name="is_active"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                />
              </Form.Item>
            </div>
          </div>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingUser(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;