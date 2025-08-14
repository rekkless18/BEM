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
  Divider,
  Badge,
  Tooltip,
  Transfer,
  Tabs
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  KeyOutlined,
  LockOutlined,
  UnlockOutlined,
  SettingOutlined,
  TeamOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import type { ColumnsType, TransferProps } from 'antd/es/table';
import { AdminUser, Permission, Role, ApiResponse } from '../types';
import { adminApi } from '../services/api';

const { Option } = Select;
const { TabPane } = Tabs;
const { Password } = Input;

interface AdminFormData {
  username: string;
  email: string;
  password?: string;
  role: string;
  permissions: string[];
  is_active: boolean;
}

interface PasswordFormData {
  password: string;
}

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [resetPasswordAdmin, setResetPasswordAdmin] = useState<AdminUser | null>(null);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    superAdmin: 0
  });

  // 获取管理员列表
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchText) params.search = searchText;
      if (selectedRole) params.role = selectedRole;
      if (selectedStatus !== '') params.is_active = selectedStatus === 'true';
      
      const response = await adminApi.getList(params);
      if (response.success) {
        setAdmins(response.data);
        // 更新统计数据
        setStats({
          total: response.data.length,
          active: response.data.filter(a => a.is_active).length,
          inactive: response.data.filter(a => !a.is_active).length,
          superAdmin: response.data.filter(a => a.role === 'super_admin').length
        });
      }
    } catch (error) {
      message.error('获取管理员列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取权限列表
  const fetchPermissions = async () => {
    try {
      const response = await adminApi.getPermissions();
      if (response.success) {
        setPermissions(response.data);
      }
    } catch (error) {
      console.error('获取权限列表失败:', error);
    }
  };

  // 获取角色列表
  const fetchRoles = async () => {
    try {
      const response = await adminApi.getRoles();
      if (response.success) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error('获取角色列表失败:', error);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchPermissions();
    fetchRoles();
  }, [searchText, selectedRole, selectedStatus]);

  // 处理新增/编辑管理员
  const handleSubmit = async (values: AdminFormData) => {
    try {
      if (editingAdmin) {
        const response = await adminApi.update(editingAdmin.id, values);
        if (response.success) {
          message.success('更新管理员成功');
          fetchAdmins();
        }
      } else {
        const response = await adminApi.create(values);
        if (response.success) {
          message.success('创建管理员成功');
          fetchAdmins();
        }
      }
      setModalVisible(false);
      form.resetFields();
      setEditingAdmin(null);
    } catch (error) {
      message.error(editingAdmin ? '更新管理员失败' : '创建管理员失败');
    }
  };

  // 处理重置密码
  const handleResetPassword = async (values: PasswordFormData) => {
    if (!resetPasswordAdmin) return;
    
    try {
      const response = await adminApi.resetPassword(resetPasswordAdmin.id, values);
      if (response.success) {
        message.success('重置密码成功');
        setPasswordModalVisible(false);
        passwordForm.resetFields();
        setResetPasswordAdmin(null);
      }
    } catch (error) {
      message.error('重置密码失败');
    }
  };

  // 处理删除管理员
  const handleDelete = async (id: string) => {
    try {
      const response = await adminApi.delete(id);
      if (response.success) {
        message.success('删除管理员成功');
        fetchAdmins();
      }
    } catch (error) {
      message.error('删除管理员失败');
    }
  };

  // 处理状态切换
  const handleStatusToggle = async (id: string, is_active: boolean) => {
    try {
      const response = await adminApi.update(id, { is_active });
      if (response.success) {
        message.success(`${is_active ? '启用' : '禁用'}管理员成功`);
        fetchAdmins();
      }
    } catch (error) {
      message.error('更新状态失败');
    }
  };

  // 打开编辑模态框
  const openEditModal = (admin: AdminUser) => {
    setEditingAdmin(admin);
    form.setFieldsValue({
      ...admin,
      permissions: admin.permissions || []
    });
    setModalVisible(true);
  };

  // 打开重置密码模态框
  const openPasswordModal = (admin: AdminUser) => {
    setResetPasswordAdmin(admin);
    passwordForm.resetFields();
    setPasswordModalVisible(true);
  };

  // 权限穿梭框数据源
  const getPermissionTransferData = () => {
    const data: any[] = [];
    permissions.forEach(module => {
      module.permissions.forEach(perm => {
        data.push({
          key: perm.key,
          title: `${module.name} - ${perm.name}`,
          description: module.name
        });
      });
    });
    return data;
  };

  // 表格列定义
  const columns: ColumnsType<AdminUser> = [
    {
      title: '管理员信息',
      key: 'admin_info',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: record.is_active ? '#52c41a' : '#d9d9d9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            color: 'white'
          }}>
            <UserOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {record.username}
              {record.role === 'super_admin' && (
                <Badge count="超管" style={{ backgroundColor: '#f50', marginLeft: 8 }} />
              )}
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>{record.email}</div>
          </div>
        </div>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role) => {
        const roleConfig = roles.find(r => r.key === role);
        const colors: Record<string, string> = {
          super_admin: 'red',
          admin: 'blue',
          operator: 'green',
          viewer: 'orange'
        };
        return (
          <Tag color={colors[role] || 'default'}>
            {roleConfig?.name || role}
          </Tag>
        );
      }
    },
    {
      title: '权限数量',
      dataIndex: 'permissions',
      key: 'permissions',
      width: 100,
      render: (permissions: string[]) => (
        <div style={{ textAlign: 'center' }}>
          <Badge count={permissions?.length || 0} style={{ backgroundColor: '#1890ff' }} />
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (is_active, record) => (
        <Switch
          checked={is_active}
          onChange={(checked) => handleStatusToggle(record.id, checked)}
          checkedChildren={<UnlockOutlined />}
          unCheckedChildren={<LockOutlined />}
          disabled={record.role === 'super_admin'}
        />
      )
    },
    {
      title: '最后登录',
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      width: 150,
      render: (last_login_at) => (
        <div style={{ fontSize: '12px', color: '#666' }}>
          {last_login_at ? new Date(last_login_at).toLocaleString() : '从未登录'}
        </div>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (created_at) => (
        <div style={{ fontSize: '12px', color: '#666' }}>
          {new Date(created_at).toLocaleDateString()}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="重置密码">
            <Button
              type="link"
              icon={<KeyOutlined />}
              onClick={() => openPasswordModal(record)}
              size="small"
            />
          </Tooltip>
          {record.role !== 'super_admin' && (
            <Popconfirm
              title="确定要删除这个管理员吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="删除">
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Tabs defaultActiveKey="admins">
        <TabPane tab={<span><TeamOutlined />管理员管理</span>} key="admins">
          {/* 统计卡片 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="管理员总数"
                  value={stats.total}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="活跃管理员"
                  value={stats.active}
                  prefix={<UnlockOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="禁用管理员"
                  value={stats.inactive}
                  prefix={<LockOutlined />}
                  valueStyle={{ color: '#f50' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="超级管理员"
                  value={stats.superAdmin}
                  prefix={<SafetyOutlined />}
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
                    placeholder="搜索用户名或邮箱"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 250 }}
                    allowClear
                  />
                  <Select
                    placeholder="选择角色"
                    value={selectedRole}
                    onChange={setSelectedRole}
                    style={{ width: 150 }}
                    allowClear
                  >
                    {roles.map(role => (
                      <Option key={role.key} value={role.key}>{role.name}</Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="选择状态"
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    style={{ width: 120 }}
                    allowClear
                  >
                    <Option value="true">启用</Option>
                    <Option value="false">禁用</Option>
                  </Select>
                </Space>
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingAdmin(null);
                    form.resetFields();
                    setModalVisible(true);
                  }}
                >
                  新增管理员
                </Button>
              </Col>
            </Row>
          </Card>

          {/* 管理员列表 */}
          <Card>
            <Table
              columns={columns}
              dataSource={admins}
              rowKey="id"
              loading={loading}
              pagination={{
                total: admins.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><SettingOutlined />权限管理</span>} key="permissions">
          <Card title="系统权限配置">
            <Row gutter={16}>
              {permissions.map(module => (
                <Col span={8} key={module.module} style={{ marginBottom: 16 }}>
                  <Card size="small" title={module.name}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {module.permissions.map(perm => (
                        <div key={perm.key} style={{ 
                          padding: '8px 12px', 
                          backgroundColor: '#f5f5f5', 
                          borderRadius: 4,
                          fontSize: '12px'
                        }}>
                          <div style={{ fontWeight: 'bold' }}>{perm.name}</div>
                          <div style={{ color: '#666' }}>{perm.key}</div>
                        </div>
                      ))}
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </TabPane>
      </Tabs>

      {/* 新增/编辑管理员模态框 */}
      <Modal
        title={editingAdmin ? '编辑管理员' : '新增管理员'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingAdmin(null);
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
            role: 'operator',
            permissions: []
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" disabled={!!editingAdmin} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>

          {!editingAdmin && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Password placeholder="请输入密码" />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  {roles.map(role => (
                    <Option key={role.key} value={role.key}>
                      {role.name}
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {role.description}
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="启用状态"
                valuePropName="checked"
              >
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="permissions"
            label="权限配置"
          >
            <Transfer
              dataSource={getPermissionTransferData()}
              titles={['可选权限', '已分配权限']}
              targetKeys={form.getFieldValue('permissions') || []}
              onChange={(targetKeys) => {
                form.setFieldsValue({ permissions: targetKeys });
              }}
              render={item => item.title}
              listStyle={{
                width: 250,
                height: 300,
              }}
            />
          </Form.Item>

          <Divider />
          
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingAdmin ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 重置密码模态框 */}
      <Modal
        title={`重置密码 - ${resetPasswordAdmin?.username}`}
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
          setResetPasswordAdmin(null);
        }}
        footer={null}
        width={400}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleResetPassword}
        >
          <Form.Item
            name="password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少6位' }
            ]}
          >
            <Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setPasswordModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                重置密码
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminManagement;