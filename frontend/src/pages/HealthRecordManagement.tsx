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
  Row,
  Col,
  Statistic,
  Avatar,
  Descriptions,
  Upload,
  Image,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  UserOutlined,
  FileTextOutlined,
  UploadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

/**
 * 健康档案数据接口
 */
interface HealthRecord {
  id: string;
  user_id: string;
  doctor_id?: string;
  record_type: 'examination' | 'diagnosis' | 'treatment' | 'prescription' | 'lab_result' | 'imaging';
  title: string;
  description: string;
  diagnosis?: string;
  treatment_plan?: string;
  medications?: string;
  notes?: string;
  attachments?: string[];
  record_date: string;
  created_at: string;
  updated_at: string;
  // 关联数据
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    age?: number;
    gender?: string;
  };
  doctor?: {
    id: string;
    name: string;
    title: string;
    department: string;
  };
}

/**
 * 健康档案管理页面组件
 */
const HealthRecordManagement: React.FC = () => {
  // 状态管理
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [statistics, setStatistics] = useState({
    total: 0,
    examination: 0,
    diagnosis: 0,
    treatment: 0,
    prescription: 0,
    labResult: 0,
    imaging: 0
  });
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const [form] = Form.useForm();

  /**
   * 获取健康档案列表
   */
  const fetchRecords = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search: searchText,
        type: typeFilter
      });

      if (dateRange) {
        params.append('start_date', dateRange[0].format('YYYY-MM-DD'));
        params.append('end_date', dateRange[1].format('YYYY-MM-DD'));
      }

      const response = await fetch(`/api/health-records?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('获取健康档案列表失败');
      }

      const data = await response.json();
      if (data.success) {
        setRecords(data.data.records);
        setPagination({
          current: data.data.pagination.page,
          pageSize: data.data.pagination.limit,
          total: data.data.pagination.total
        });
        
        // 更新统计数据
        updateStatistics(data.data.records);
      } else {
        message.error(data.message || '获取健康档案列表失败');
      }
    } catch (error) {
      console.error('获取健康档案列表错误:', error);
      message.error('获取健康档案列表失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 更新统计数据
   */
  const updateStatistics = (recordList: HealthRecord[]) => {
    const total = recordList.length;
    const examination = recordList.filter(r => r.record_type === 'examination').length;
    const diagnosis = recordList.filter(r => r.record_type === 'diagnosis').length;
    const treatment = recordList.filter(r => r.record_type === 'treatment').length;
    const prescription = recordList.filter(r => r.record_type === 'prescription').length;
    const labResult = recordList.filter(r => r.record_type === 'lab_result').length;
    const imaging = recordList.filter(r => r.record_type === 'imaging').length;

    setStatistics({ 
      total, 
      examination, 
      diagnosis, 
      treatment, 
      prescription, 
      labResult, 
      imaging 
    });
  };

  /**
   * 创建或更新健康档案
   */
  const handleSubmit = async (values: any) => {
    try {
      // 处理附件上传
      const attachments = fileList.map(file => file.response?.url || file.url).filter(Boolean);
      
      const recordData = {
        ...values,
        attachments,
        record_date: values.record_date.toISOString()
      };

      const url = editingRecord ? `/api/health-records/${editingRecord.id}` : '/api/health-records';
      const method = editingRecord ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(recordData)
      });

      if (!response.ok) {
        throw new Error(editingRecord ? '更新健康档案失败' : '创建健康档案失败');
      }

      const data = await response.json();
      if (data.success) {
        message.success(editingRecord ? '更新健康档案成功' : '创建健康档案成功');
        setModalVisible(false);
        setEditingRecord(null);
        form.resetFields();
        setFileList([]);
        fetchRecords(pagination.current, pagination.pageSize);
      } else {
        message.error(data.message || (editingRecord ? '更新健康档案失败' : '创建健康档案失败'));
      }
    } catch (error) {
      console.error('提交健康档案数据错误:', error);
      message.error(editingRecord ? '更新健康档案失败' : '创建健康档案失败');
    }
  };

  /**
   * 删除健康档案
   */
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/health-records/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('删除健康档案失败');
      }

      const data = await response.json();
      if (data.success) {
        message.success('删除健康档案成功');
        fetchRecords(pagination.current, pagination.pageSize);
      } else {
        message.error(data.message || '删除健康档案失败');
      }
    } catch (error) {
      console.error('删除健康档案错误:', error);
      message.error('删除健康档案失败');
    }
  };

  /**
   * 查看详情
   */
  const handleViewDetail = (record: HealthRecord) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  /**
   * 编辑健康档案
   */
  const handleEdit = (record: HealthRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      record_date: record.record_date ? dayjs(record.record_date) : null
    });
    
    // 设置附件列表
    if (record.attachments) {
      const files = record.attachments.map((url, index) => ({
        uid: `${index}`,
        name: `attachment-${index}`,
        status: 'done' as const,
        url
      }));
      setFileList(files);
    }
    
    setModalVisible(true);
  };

  /**
   * 搜索处理
   */
  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchRecords(1, pagination.pageSize);
  };

  /**
   * 重置搜索
   */
  const handleReset = () => {
    setSearchText('');
    setTypeFilter('all');
    setDateRange(null);
    setPagination({ ...pagination, current: 1 });
    fetchRecords(1, pagination.pageSize);
  };

  // 档案类型配置
  const typeConfig = {
    examination: { color: 'blue', text: '体检记录' },
    diagnosis: { color: 'orange', text: '诊断记录' },
    treatment: { color: 'green', text: '治疗记录' },
    prescription: { color: 'purple', text: '处方记录' },
    lab_result: { color: 'cyan', text: '检验报告' },
    imaging: { color: 'magenta', text: '影像报告' }
  };

  // 文件上传配置
  const uploadProps = {
    name: 'file',
    action: '/api/upload',
    headers: {
      authorization: `Bearer ${localStorage.getItem('token')}`
    },
    fileList,
    onChange: (info: any) => {
      setFileList(info.fileList);
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 文件上传成功`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 文件上传失败`);
      }
    },
    onRemove: (file: UploadFile) => {
      setFileList(fileList.filter(item => item.uid !== file.uid));
    }
  };

  // 表格列定义
  const columns: ColumnsType<HealthRecord> = [
    {
      title: '患者',
      key: 'user',
      width: 150,
      render: (_, record: HealthRecord) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar icon={<UserOutlined />} size="small" />
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {record.user?.name || '未知患者'}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.user?.age && `${record.user.age}岁`} {record.user?.gender}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '档案类型',
      dataIndex: 'record_type',
      key: 'record_type',
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
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true
    },
    {
      title: '医生',
      key: 'doctor',
      width: 150,
      render: (_, record: HealthRecord) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.doctor?.name || '未指定'}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.doctor?.department}
          </div>
        </div>
      )
    },
    {
      title: '记录日期',
      dataIndex: 'record_date',
      key: 'record_date',
      width: 120,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD')
    },
    {
      title: '附件',
      key: 'attachments',
      width: 80,
      render: (_, record: HealthRecord) => (
        <span>
          {record.attachments?.length || 0} 个
        </span>
      )
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
      width: 180,
      fixed: 'right',
      render: (_, record: HealthRecord) => (
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
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '确定要删除这条健康档案吗？',
                content: '删除后无法恢复，请谨慎操作。',
                onOk: () => handleDelete(record.id)
              });
            }}
            size="small"
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  // 组件挂载时获取数据
  useEffect(() => {
    fetchRecords();
  }, []);

  // 搜索条件变化时重新获取数据
  useEffect(() => {
    if (searchText || typeFilter !== 'all' || dateRange) {
      const timer = setTimeout(() => {
        fetchRecords(1, pagination.pageSize);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchText, typeFilter, dateRange]);

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="总档案数"
              value={statistics.total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="体检记录"
              value={statistics.examination}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="诊断记录"
              value={statistics.diagnosis}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="治疗记录"
              value={statistics.treatment}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="处方记录"
              value={statistics.prescription}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="检验报告"
              value={statistics.labResult}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和操作区域 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder="搜索患者姓名或档案标题"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="档案类型"
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部类型</Option>
              <Option value="examination">体检记录</Option>
              <Option value="diagnosis">诊断记录</Option>
              <Option value="treatment">治疗记录</Option>
              <Option value="prescription">处方记录</Option>
              <Option value="lab_result">检验报告</Option>
              <Option value="imaging">影像报告</Option>
            </Select>
          </Col>
          <Col span={5}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
          <Col span={9}>
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
                  setEditingRecord(null);
                  form.resetFields();
                  setFileList([]);
                  setModalVisible(true);
                }}
              >
                添加档案
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={() => message.info('导出功能开发中...')}
              >
                导出
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 健康档案表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={records}
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
              fetchRecords(page, pageSize);
            }
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 添加/编辑健康档案模态框 */}
      <Modal
        title={editingRecord ? '编辑健康档案' : '添加健康档案'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRecord(null);
          form.resetFields();
          setFileList([]);
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            record_type: 'examination',
            record_date: dayjs()
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="患者ID"
                name="user_id"
                rules={[{ required: true, message: '请输入患者ID' }]}
              >
                <Input placeholder="请输入患者ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="医生ID"
                name="doctor_id"
              >
                <Input placeholder="请输入医生ID（可选）" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="档案类型"
                name="record_type"
                rules={[{ required: true, message: '请选择档案类型' }]}
              >
                <Select placeholder="请选择档案类型">
                  <Option value="examination">体检记录</Option>
                  <Option value="diagnosis">诊断记录</Option>
                  <Option value="treatment">治疗记录</Option>
                  <Option value="prescription">处方记录</Option>
                  <Option value="lab_result">检验报告</Option>
                  <Option value="imaging">影像报告</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="记录日期"
                name="record_date"
                rules={[{ required: true, message: '请选择记录日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  placeholder="选择记录日期"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="档案标题"
            name="title"
            rules={[
              { required: true, message: '请输入档案标题' },
              { max: 100, message: '标题最多100个字符' }
            ]}
          >
            <Input placeholder="请输入档案标题" />
          </Form.Item>

          <Form.Item
            label="档案描述"
            name="description"
            rules={[
              { required: true, message: '请输入档案描述' },
              { max: 1000, message: '描述最多1000个字符' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="请输入档案描述..."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="诊断结果"
                name="diagnosis"
              >
                <TextArea
                  rows={3}
                  placeholder="请输入诊断结果（可选）..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="治疗方案"
                name="treatment_plan"
              >
                <TextArea
                  rows={3}
                  placeholder="请输入治疗方案（可选）..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="用药信息"
            name="medications"
          >
            <TextArea
              rows={3}
              placeholder="请输入用药信息（可选）..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="备注信息"
            name="notes"
          >
            <TextArea
              rows={3}
              placeholder="请输入备注信息（可选）..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item label="附件上传">
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>上传文件</Button>
            </Upload>
            <div style={{ marginTop: '8px', color: '#666', fontSize: '12px' }}>
              支持上传图片、PDF等格式文件，单个文件不超过10MB
            </div>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingRecord(null);
                  form.resetFields();
                  setFileList([]);
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRecord ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 健康档案详情模态框 */}
      <Modal
        title="健康档案详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedRecord && (
          <div>
            <Descriptions title="基本信息" column={2} bordered>
              <Descriptions.Item label="患者姓名">
                {selectedRecord.user?.name || '未知患者'}
              </Descriptions.Item>
              <Descriptions.Item label="患者信息">
                {selectedRecord.user?.age && `${selectedRecord.user.age}岁`} {selectedRecord.user?.gender}
              </Descriptions.Item>
              <Descriptions.Item label="医生姓名">
                {selectedRecord.doctor?.name || '未指定'}
              </Descriptions.Item>
              <Descriptions.Item label="医生科室">
                {selectedRecord.doctor?.department || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="档案类型">
                <Tag color={typeConfig[selectedRecord.record_type as keyof typeof typeConfig]?.color}>
                  {typeConfig[selectedRecord.record_type as keyof typeof typeConfig]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="记录日期">
                {dayjs(selectedRecord.record_date).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="档案标题" span={2}>
                {selectedRecord.title}
              </Descriptions.Item>
              <Descriptions.Item label="档案描述" span={2}>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedRecord.description}
                </div>
              </Descriptions.Item>
            </Descriptions>

            {(selectedRecord.diagnosis || selectedRecord.treatment_plan || selectedRecord.medications) && (
              <div>
                <Divider />
                <Descriptions title="医疗信息" column={1} bordered>
                  {selectedRecord.diagnosis && (
                    <Descriptions.Item label="诊断结果">
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {selectedRecord.diagnosis}
                      </div>
                    </Descriptions.Item>
                  )}
                  {selectedRecord.treatment_plan && (
                    <Descriptions.Item label="治疗方案">
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {selectedRecord.treatment_plan}
                      </div>
                    </Descriptions.Item>
                  )}
                  {selectedRecord.medications && (
                    <Descriptions.Item label="用药信息">
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {selectedRecord.medications}
                      </div>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            )}

            {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
              <div>
                <Divider />
                <div>
                  <h4>附件文件</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedRecord.attachments.map((url, index) => (
                      <div key={index} style={{ border: '1px solid #d9d9d9', padding: '8px', borderRadius: '4px' }}>
                        {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                          <Image
                            src={url}
                            width={100}
                            height={100}
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                            <FileTextOutlined style={{ fontSize: '24px' }} />
                          </div>
                        )}
                        <div style={{ textAlign: 'center', marginTop: '4px' }}>
                          <Button
                            type="link"
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => window.open(url, '_blank')}
                          >
                            下载
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedRecord.notes && (
              <div>
                <Divider />
                <Descriptions title="备注信息" column={1} bordered>
                  <Descriptions.Item label="备注">
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedRecord.notes}
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}

            <Divider />
            <Descriptions title="系统信息" column={2} bordered>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedRecord.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(selectedRecord.updated_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HealthRecordManagement;