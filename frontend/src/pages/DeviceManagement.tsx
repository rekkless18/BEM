import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Tag,
  Card,
  Descriptions,
  Badge,
  Progress,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { deviceApi } from '../services/api';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

/**
 * 设备数据接口
 */
interface Device {
  id: string;
  user_id: string;
  device_name: string;
  device_type: 'blood_pressure' | 'glucose' | 'heart_rate' | 'weight' | 'temperature' | 'oximeter' | 'ecg' | 'other';
  brand?: string;
  model?: string;
  serial_number?: string;
  mac_address?: string;
  device_id?: string;
  firmware_version?: string;
  hardware_version?: string;
  connection_type: 'bluetooth' | 'wifi' | 'usb' | 'nfc';
  connection_status: 'connected' | 'disconnected' | 'syncing' | 'error';
  sync_frequency: number; // 同步频率（分钟）
  auto_sync: boolean;
  data_retention_days: number;
  measurement_units?: string;
  device_settings?: any;
  purchase_date?: string;
  warranty_expiry_date?: string;
  manufacturer?: string;
  country_of_origin?: string;
  device_location?: string;
  sharing_enabled: boolean;
  backup_enabled: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // 关联数据
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

/**
 * 设备管理页面组件
 */
const DeviceManagement: React.FC = () => {
  // 状态管理
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const [form] = Form.useForm();

  /**
   * 获取设备列表
   */
  const fetchDevices = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pageSize
      };
      
      if (searchText) params.search = searchText;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (departmentFilter !== 'all') params.department = departmentFilter;

      const response = await deviceApi.getList(params);
      
      if (response.data.success) {
         const deviceData = response.data.data;
         const deviceList = Array.isArray(deviceData) ? deviceData : (deviceData.devices || []);
         setDevices(deviceList);
         setPagination({
           current: deviceData.pagination?.page || page,
           pageSize: deviceData.pagination?.limit || pageSize,
           total: deviceData.pagination?.total || 0
         });
         

       } else {
         message.error(response.data.message || '获取设备列表失败');
       }
    } catch (error) {
      console.error('获取设备列表错误:', error);
      message.error('获取设备列表失败');
    } finally {
      setLoading(false);
    }
  };



  /**
   * 创建或更新设备
   */
  const handleSubmit = async (values: any) => {
    try {
      const deviceData = {
        ...values,
        purchase_date: values.purchase_date?.toISOString(),
        warranty_expiry_date: values.warranty_expiry_date?.toISOString()
      };

      const url = editingDevice ? `/api/devices/${editingDevice.id}` : '/api/devices';
      const method = editingDevice ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(deviceData)
      });

      if (!response.ok) {
        throw new Error(editingDevice ? '更新设备失败' : '创建设备失败');
      }

      const data = await response.json();
      if (data.success) {
        message.success(editingDevice ? '更新设备成功' : '创建设备成功');
        setModalVisible(false);
        setEditingDevice(null);
        form.resetFields();
        fetchDevices(pagination.current, pagination.pageSize);
      } else {
        message.error(data.message || (editingDevice ? '更新设备失败' : '创建设备失败'));
      }
    } catch (error) {
      console.error('提交设备数据错误:', error);
      message.error(editingDevice ? '更新设备失败' : '创建设备失败');
    }
  };

  /**
   * 删除设备
   */
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/devices/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('删除设备失败');
      }

      const data = await response.json();
      if (data.success) {
        message.success('删除设备成功');
        fetchDevices(pagination.current, pagination.pageSize);
      } else {
        message.error(data.message || '删除设备失败');
      }
    } catch (error) {
      console.error('删除设备错误:', error);
      message.error('删除设备失败');
    }
  };

  /**
   * 查看详情
   */
  const handleViewDetail = (device: Device) => {
    setSelectedDevice(device);
    setDetailModalVisible(true);
  };

  /**
   * 编辑设备
   */
  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    form.setFieldsValue({
      ...device,
      purchase_date: device.purchase_date ? dayjs(device.purchase_date) : null,
      warranty_expiry: device.warranty_expiry ? dayjs(device.warranty_expiry) : null,
      last_maintenance: device.last_maintenance ? dayjs(device.last_maintenance) : null,
      next_maintenance: device.next_maintenance ? dayjs(device.next_maintenance) : null
    });
    setModalVisible(true);
  };

  /**
   * 搜索处理
   */
  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchDevices(1, pagination.pageSize);
  };

  /**
   * 重置搜索
   */
  const handleReset = () => {
    setSearchText('');
    setTypeFilter('all');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setPagination({ ...pagination, current: 1 });
    fetchDevices(1, pagination.pageSize);
  };

  /**
   * 计算维护进度
   */
  const getMaintenanceProgress = (device: Device) => {
    if (!device.last_maintenance || !device.next_maintenance) return 0;
    
    const lastMaintenance = dayjs(device.last_maintenance);
    const nextMaintenance = dayjs(device.next_maintenance);
    const now = dayjs();
    
    const totalDays = nextMaintenance.diff(lastMaintenance, 'day');
    const passedDays = now.diff(lastMaintenance, 'day');
    
    return Math.min(Math.max((passedDays / totalDays) * 100, 0), 100);
  };

  // 设备类型配置
  const typeConfig = {
    medical: { color: 'blue', text: '医疗设备' },
    diagnostic: { color: 'green', text: '诊断设备' },
    monitoring: { color: 'orange', text: '监护设备' },
    therapeutic: { color: 'purple', text: '治疗设备' },
    surgical: { color: 'red', text: '手术设备' },
    laboratory: { color: 'cyan', text: '实验设备' }
  };

  // 设备状态配置
  const statusConfig = {
    active: { color: 'success', text: '正常使用', icon: <CheckCircleOutlined /> },
    inactive: { color: 'default', text: '停用', icon: <CloseCircleOutlined /> },
    maintenance: { color: 'processing', text: '维护中', icon: <SyncOutlined spin /> },
    repair: { color: 'warning', text: '维修中', icon: <ExclamationCircleOutlined /> },
    retired: { color: 'error', text: '已报废', icon: <CloseCircleOutlined /> }
  };

  // 表格列定义
  const columns: ColumnsType<Device> = [
    {
      title: '设备名称',
      dataIndex: 'device_name',
      key: 'device_name',
      width: 150,
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      key: 'device_type',
      width: 120,
      render: (type: string) => {
        const config = typeConfig[type as keyof typeof typeConfig];
        return (
          <Tag color={config?.color}>
            {config?.text || type}
          </Tag>
        );
      }
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      width: 120,
      ellipsis: true
    },
    {
      title: '制造商',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      width: 120,
      ellipsis: true
    },
    {
      title: '序列号',
      dataIndex: 'serial_number',
      key: 'serial_number',
      width: 150,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace' }}>{text}</span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <Badge
            status={config?.color as any}
            text={config?.text || status}
          />
        );
      }
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      ellipsis: true
    },
    {
      title: '科室',
      key: 'department',
      width: 100,
      render: (_, record: Device) => (
        <span>{record.department?.name || '未分配'}</span>
      )
    },
    {
      title: '维护进度',
      key: 'maintenance_progress',
      width: 120,
      render: (_, record: Device) => {
        const progress = getMaintenanceProgress(record);
        const isOverdue = record.next_maintenance && dayjs(record.next_maintenance).isBefore(dayjs());
        
        return (
          <Progress
            percent={progress}
            size="small"
            status={isOverdue ? 'exception' : progress > 80 ? 'active' : 'normal'}
            showInfo={false}
          />
        );
      }
    },
    {
      title: '下次维护',
      dataIndex: 'next_maintenance',
      key: 'next_maintenance',
      width: 120,
      render: (text: string) => {
        if (!text) return '-';
        const date = dayjs(text);
        const isOverdue = date.isBefore(dayjs());
        const isNear = date.isBefore(dayjs().add(7, 'day'));
        
        return (
          <span style={{ 
            color: isOverdue ? '#f5222d' : isNear ? '#fa8c16' : undefined 
          }}>
            {date.format('YYYY-MM-DD')}
          </span>
        );
      }
    },
    {
      title: '购买日期',
      dataIndex: 'purchase_date',
      key: 'purchase_date',
      width: 120,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD')
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record: Device) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            size="small"
          >
            详情
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个设备吗？"
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
    fetchDevices();
  }, []);

  // 搜索条件变化时重新获取数据
  useEffect(() => {
    if (searchText || typeFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all') {
      const timer = setTimeout(() => {
        fetchDevices(1, pagination.pageSize);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchText, typeFilter, statusFilter, departmentFilter]);

  return (
    <div style={{ padding: '24px' }}>


      {/* 搜索和操作区域 */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', minWidth: '200px' }}>
            <Input
              placeholder="搜索设备名称、型号或序列号"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </div>
          <div style={{ flex: '0 0 150px' }}>
            <Select
              placeholder="设备类型"
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部类型</Option>
              <Option value="medical">医疗设备</Option>
              <Option value="diagnostic">诊断设备</Option>
              <Option value="monitoring">监护设备</Option>
              <Option value="therapeutic">治疗设备</Option>
              <Option value="surgical">手术设备</Option>
              <Option value="laboratory">实验设备</Option>
            </Select>
          </div>
          <div style={{ flex: '0 0 150px' }}>
            <Select
              placeholder="设备状态"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部状态</Option>
              <Option value="active">正常使用</Option>
              <Option value="inactive">停用</Option>
              <Option value="maintenance">维护中</Option>
              <Option value="repair">维修中</Option>
              <Option value="retired">已报废</Option>
            </Select>
          </div>
          <div style={{ flex: '0 0 150px' }}>
            <Select
              placeholder="所属科室"
              value={departmentFilter}
              onChange={setDepartmentFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部科室</Option>
              {/* 这里应该从API获取科室列表 */}
            </Select>
          </div>
          <div style={{ flex: '0 0 auto' }}>
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
                  setEditingDevice(null);
                  form.resetFields();
                  setModalVisible(true);
                }}
              >
                添加设备
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

      {/* 设备表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={devices}
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
              fetchDevices(page, pageSize);
            }
          }}
          scroll={{ x: 1600 }}
        />
      </Card>

      {/* 添加/编辑设备模态框 */}
      <Modal
        title={editingDevice ? '编辑设备' : '添加设备'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingDevice(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            device_type: 'medical',
            status: 'active',
            maintenance_interval: 90
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              label="设备名称"
              name="device_name"
              rules={[
                { required: true, message: '请输入设备名称' },
                { max: 100, message: '设备名称最多100个字符' }
              ]}
            >
              <Input placeholder="请输入设备名称" />
            </Form.Item>
            <Form.Item
              label="设备类型"
              name="device_type"
              rules={[{ required: true, message: '请选择设备类型' }]}
            >
              <Select placeholder="请选择设备类型">
                <Option value="medical">医疗设备</Option>
                <Option value="diagnostic">诊断设备</Option>
                <Option value="monitoring">监护设备</Option>
                <Option value="therapeutic">治疗设备</Option>
                <Option value="surgical">手术设备</Option>
                <Option value="laboratory">实验设备</Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              label="型号"
              name="model"
              rules={[
                { required: true, message: '请输入设备型号' },
                { max: 50, message: '型号最多50个字符' }
              ]}
            >
              <Input placeholder="请输入设备型号" />
            </Form.Item>
            <Form.Item
              label="制造商"
              name="manufacturer"
              rules={[
                { required: true, message: '请输入制造商' },
                { max: 100, message: '制造商最多100个字符' }
              ]}
            >
              <Input placeholder="请输入制造商" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              label="序列号"
              name="serial_number"
              rules={[
                { required: true, message: '请输入序列号' },
                { max: 50, message: '序列号最多50个字符' }
              ]}
            >
              <Input placeholder="请输入序列号" />
            </Form.Item>
            <Form.Item
              label="设备状态"
              name="status"
              rules={[{ required: true, message: '请选择设备状态' }]}
            >
              <Select placeholder="请选择设备状态">
                <Option value="active">正常使用</Option>
                <Option value="inactive">停用</Option>
                <Option value="maintenance">维护中</Option>
                <Option value="repair">维修中</Option>
                <Option value="retired">已报废</Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              label="设备位置"
              name="location"
              rules={[
                { required: true, message: '请输入设备位置' },
                { max: 100, message: '位置最多100个字符' }
              ]}
            >
              <Input placeholder="请输入设备位置" />
            </Form.Item>
            <Form.Item
              label="所属科室"
              name="department_id"
            >
              <Select placeholder="请选择所属科室" allowClear>
                {/* 这里应该从API获取科室列表 */}
                <Option value="dept1">内科</Option>
                <Option value="dept2">外科</Option>
                <Option value="dept3">儿科</Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              label="购买日期"
              name="purchase_date"
              rules={[{ required: true, message: '请选择购买日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
                placeholder="选择购买日期"
              />
            </Form.Item>
            <Form.Item
              label="保修到期日期"
              name="warranty_expiry"
            >
              <DatePicker
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
                placeholder="选择保修到期日期"
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Form.Item
              label="维护间隔（天）"
              name="maintenance_interval"
              rules={[
                { required: true, message: '请输入维护间隔' },
                { type: 'number', min: 1, max: 3650, message: '维护间隔必须在1-3650天之间' }
              ]}
            >
              <Input type="number" placeholder="维护间隔天数" />
            </Form.Item>
            <Form.Item
              label="上次维护日期"
              name="last_maintenance"
            >
              <DatePicker
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
                placeholder="选择上次维护日期"
              />
            </Form.Item>
            <Form.Item
              label="下次维护日期"
              name="next_maintenance"
            >
              <DatePicker
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
                placeholder="选择下次维护日期"
              />
            </Form.Item>
          </div>

          <Form.Item
            label="设备规格"
            name="specifications"
          >
            <TextArea
              rows={3}
              placeholder="请输入设备规格和技术参数..."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="备注信息"
            name="notes"
          >
            <TextArea
              rows={3}
              placeholder="请输入备注信息..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingDevice(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingDevice ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 设备详情模态框 */}
      <Modal
        title="设备详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedDevice && (
          <div>
            <Descriptions title="基本信息" column={2} bordered>
              <Descriptions.Item label="设备名称">
                {selectedDevice.device_name}
              </Descriptions.Item>
              <Descriptions.Item label="设备类型">
                <Tag color={typeConfig[selectedDevice.device_type as keyof typeof typeConfig]?.color}>
                  {typeConfig[selectedDevice.device_type as keyof typeof typeConfig]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="型号">
                {selectedDevice.model}
              </Descriptions.Item>
              <Descriptions.Item label="制造商">
                {selectedDevice.manufacturer}
              </Descriptions.Item>
              <Descriptions.Item label="序列号">
                <span style={{ fontFamily: 'monospace' }}>
                  {selectedDevice.serial_number}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="设备状态">
                <Badge
                  status={statusConfig[selectedDevice.status as keyof typeof statusConfig]?.color as any}
                  text={statusConfig[selectedDevice.status as keyof typeof statusConfig]?.text}
                />
              </Descriptions.Item>
              <Descriptions.Item label="设备位置">
                {selectedDevice.location}
              </Descriptions.Item>
              <Descriptions.Item label="所属科室">
                {selectedDevice.department?.name || '未分配'}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="采购和保修信息" column={2} bordered style={{ marginTop: '16px' }}>
              <Descriptions.Item label="购买日期">
                {dayjs(selectedDevice.purchase_date).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="保修到期日期">
                {selectedDevice.warranty_expiry ? 
                  dayjs(selectedDevice.warranty_expiry).format('YYYY-MM-DD') : '无保修信息'
                }
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="维护信息" column={2} bordered style={{ marginTop: '16px' }}>
              <Descriptions.Item label="维护间隔">
                {selectedDevice.maintenance_interval} 天
              </Descriptions.Item>
              <Descriptions.Item label="上次维护日期">
                {selectedDevice.last_maintenance ? 
                  dayjs(selectedDevice.last_maintenance).format('YYYY-MM-DD') : '无维护记录'
                }
              </Descriptions.Item>
              <Descriptions.Item label="下次维护日期">
                {selectedDevice.next_maintenance ? (
                  <span style={{
                    color: dayjs(selectedDevice.next_maintenance).isBefore(dayjs()) ? '#f5222d' : 
                           dayjs(selectedDevice.next_maintenance).isBefore(dayjs().add(7, 'day')) ? '#fa8c16' : undefined
                  }}>
                    {dayjs(selectedDevice.next_maintenance).format('YYYY-MM-DD')}
                  </span>
                ) : '未安排'}
              </Descriptions.Item>
              <Descriptions.Item label="维护进度">
                <Progress
                  percent={getMaintenanceProgress(selectedDevice)}
                  size="small"
                  status={
                    selectedDevice.next_maintenance && dayjs(selectedDevice.next_maintenance).isBefore(dayjs()) ? 
                    'exception' : getMaintenanceProgress(selectedDevice) > 80 ? 'active' : 'normal'
                  }
                />
              </Descriptions.Item>
            </Descriptions>

            {selectedDevice.specifications && (
              <Descriptions title="技术规格" column={1} bordered style={{ marginTop: '16px' }}>
                <Descriptions.Item label="规格参数">
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedDevice.specifications}
                  </div>
                </Descriptions.Item>
              </Descriptions>
            )}

            {selectedDevice.notes && (
              <Descriptions title="备注信息" column={1} bordered style={{ marginTop: '16px' }}>
                <Descriptions.Item label="备注">
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedDevice.notes}
                  </div>
                </Descriptions.Item>
              </Descriptions>
            )}

            <Descriptions title="系统信息" column={2} bordered style={{ marginTop: '16px' }}>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedDevice.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(selectedDevice.updated_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DeviceManagement;