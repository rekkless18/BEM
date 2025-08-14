import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Tag,
  Tooltip,
  Modal,
  Typography,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Text } = Typography;

// 日志级别枚举
enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

// 日志类型枚举
enum LogType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  API = 'api',
  DATABASE = 'database',
  SYSTEM = 'system',
  SECURITY = 'security',
}

// 系统日志接口定义
interface SystemLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  type: LogType;
  message: string;
  details?: string;
  userId?: string;
  username?: string;
  ip?: string;
  userAgent?: string;
  module: string;
  action: string;
}

// 日志级别配置
const LOG_LEVEL_CONFIG = {
  [LogLevel.INFO]: { color: 'blue', label: '信息' },
  [LogLevel.WARN]: { color: 'orange', label: '警告' },
  [LogLevel.ERROR]: { color: 'red', label: '错误' },
  [LogLevel.DEBUG]: { color: 'gray', label: '调试' },
};

// 日志类型配置
const LOG_TYPE_CONFIG = {
  [LogType.LOGIN]: { color: 'green', label: '登录' },
  [LogType.LOGOUT]: { color: 'purple', label: '登出' },
  [LogType.API]: { color: 'blue', label: 'API' },
  [LogType.DATABASE]: { color: 'cyan', label: '数据库' },
  [LogType.SYSTEM]: { color: 'orange', label: '系统' },
  [LogType.SECURITY]: { color: 'red', label: '安全' },
};

const SystemLogs: React.FC = () => {
  // 状态管理
  const [logs, setLogs] = useState<SystemLog[]>([]); // 日志列表
  const [loading, setLoading] = useState(false); // 加载状态
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null); // 选中的日志
  const [detailModalVisible, setDetailModalVisible] = useState(false); // 详情模态框显示状态
  
  // 筛选条件
  const [filters, setFilters] = useState({
    keyword: '', // 关键词搜索
    level: undefined as LogLevel | undefined, // 日志级别
    type: undefined as LogType | undefined, // 日志类型
    dateRange: undefined as [dayjs.Dayjs, dayjs.Dayjs] | undefined, // 时间范围
  });

  // 表格列配置
  const columns: ColumnsType<SystemLog> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => (
        <Text style={{ fontSize: '12px' }}>
          {dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}
        </Text>
      ),
      sorter: (a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: LogLevel) => {
        const config = LOG_LEVEL_CONFIG[level];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
      filters: Object.values(LogLevel).map(level => ({
        text: LOG_LEVEL_CONFIG[level].label,
        value: level,
      })),
      onFilter: (value, record) => record.level === value,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: LogType) => {
        const config = LOG_TYPE_CONFIG[type];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
      filters: Object.values(LogType).map(type => ({
        text: LOG_TYPE_CONFIG[type].label,
        value: type,
      })),
      onFilter: (value, record) => record.type === value,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 120,
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 100,
      render: (username?: string) => username || '-',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 120,
      render: (ip?: string) => ip || '-',
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: {
        showTitle: false,
      },
      render: (message: string) => (
        <Tooltip placement="topLeft" title={message}>
          {message}
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  // 组件挂载时加载数据
  useEffect(() => {
    fetchLogs();
  }, []);

  // 获取系统日志
  const fetchLogs = async () => {
    setLoading(true);
    try {
      // TODO: 调用API获取系统日志
      // const response = await logService.getLogs(filters);
      // setLogs(response.data);
      
      // 模拟数据
      const mockLogs: SystemLog[] = [
        {
          id: '1',
          timestamp: dayjs().subtract(1, 'hour').toISOString(),
          level: LogLevel.INFO,
          type: LogType.LOGIN,
          message: '用户登录成功',
          details: '用户通过用户名密码登录系统',
          userId: '1',
          username: 'admin',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          module: '认证模块',
          action: '用户登录',
        },
        {
          id: '2',
          timestamp: dayjs().subtract(2, 'hours').toISOString(),
          level: LogLevel.ERROR,
          type: LogType.API,
          message: 'API请求失败',
          details: '获取用户列表时数据库连接超时',
          userId: '2',
          username: 'medical_admin',
          ip: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          module: '用户管理',
          action: '获取用户列表',
        },
        {
          id: '3',
          timestamp: dayjs().subtract(3, 'hours').toISOString(),
          level: LogLevel.WARN,
          type: LogType.SECURITY,
          message: '多次登录失败',
          details: '用户在5分钟内尝试登录失败3次',
          ip: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          module: '安全模块',
          action: '登录验证',
        },
        {
          id: '4',
          timestamp: dayjs().subtract(4, 'hours').toISOString(),
          level: LogLevel.INFO,
          type: LogType.SYSTEM,
          message: '系统启动',
          details: '系统服务启动完成',
          module: '系统核心',
          action: '系统启动',
        },
        {
          id: '5',
          timestamp: dayjs().subtract(5, 'hours').toISOString(),
          level: LogLevel.DEBUG,
          type: LogType.DATABASE,
          message: '数据库查询',
          details: 'SELECT * FROM users WHERE status = "active"',
          userId: '1',
          username: 'admin',
          ip: '192.168.1.100',
          module: '数据库',
          action: '查询操作',
        },
      ];
      
      setLogs(mockLogs);
    } catch (error) {
      console.error('获取系统日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = () => {
    fetchLogs();
  };

  // 处理重置
  const handleReset = () => {
    setFilters({
      keyword: '',
      level: undefined,
      type: undefined,
      dateRange: undefined,
    });
    // 重置后重新获取数据
    setTimeout(() => {
      fetchLogs();
    }, 100);
  };

  // 处理查看详情
  const handleViewDetail = (log: SystemLog) => {
    setSelectedLog(log);
    setDetailModalVisible(true);
  };

  // 处理时间范围变化
  const handleDateRangeChange: RangePickerProps['onChange'] = (dates) => {
    setFilters(prev => ({
      ...prev,
      dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | undefined,
    }));
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        {/* 搜索筛选区域 */}
        <div style={{ marginBottom: '16px' }}>
          <Space wrap>
            <Input
              placeholder="搜索关键词"
              value={filters.keyword}
              onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
              style={{ width: 200 }}
              allowClear
            />
            
            <Select
              placeholder="日志级别"
              value={filters.level}
              onChange={(value) => setFilters(prev => ({ ...prev, level: value }))}
              style={{ width: 120 }}
              allowClear
            >
              {Object.values(LogLevel).map(level => (
                <Select.Option key={level} value={level}>
                  {LOG_LEVEL_CONFIG[level].label}
                </Select.Option>
              ))}
            </Select>
            
            <Select
              placeholder="日志类型"
              value={filters.type}
              onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              style={{ width: 120 }}
              allowClear
            >
              {Object.values(LogType).map(type => (
                <Select.Option key={type} value={type}>
                  {LOG_TYPE_CONFIG[type].label}
                </Select.Option>
              ))}
            </Select>
            
            <RangePicker
              value={filters.dateRange}
              onChange={handleDateRangeChange}
              showTime
              format="YYYY-MM-DD HH:mm:ss"
            />
            
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
          </Space>
        </div>

        {/* 日志表格 */}
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            total: logs.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 日志详情模态框 */}
      <Modal
        title="日志详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedLog(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailModalVisible(false);
              setSelectedLog(null);
            }}
          >
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedLog && (
          <div>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong>时间：</Text>
                <Text>{dayjs(selectedLog.timestamp).format('YYYY-MM-DD HH:mm:ss')}</Text>
              </div>
              
              <div>
                <Text strong>级别：</Text>
                <Tag color={LOG_LEVEL_CONFIG[selectedLog.level].color}>
                  {LOG_LEVEL_CONFIG[selectedLog.level].label}
                </Tag>
              </div>
              
              <div>
                <Text strong>类型：</Text>
                <Tag color={LOG_TYPE_CONFIG[selectedLog.type].color}>
                  {LOG_TYPE_CONFIG[selectedLog.type].label}
                </Tag>
              </div>
              
              <div>
                <Text strong>模块：</Text>
                <Text>{selectedLog.module}</Text>
              </div>
              
              <div>
                <Text strong>操作：</Text>
                <Text>{selectedLog.action}</Text>
              </div>
              
              {selectedLog.username && (
                <div>
                  <Text strong>用户：</Text>
                  <Text>{selectedLog.username}</Text>
                </div>
              )}
              
              {selectedLog.ip && (
                <div>
                  <Text strong>IP地址：</Text>
                  <Text>{selectedLog.ip}</Text>
                </div>
              )}
              
              <div>
                <Text strong>消息：</Text>
                <Text>{selectedLog.message}</Text>
              </div>
              
              {selectedLog.details && (
                <div>
                  <Text strong>详细信息：</Text>
                  <TextArea
                    value={selectedLog.details}
                    readOnly
                    rows={4}
                    style={{ marginTop: '8px' }}
                  />
                </div>
              )}
              
              {selectedLog.userAgent && (
                <div>
                  <Text strong>用户代理：</Text>
                  <TextArea
                    value={selectedLog.userAgent}
                    readOnly
                    rows={2}
                    style={{ marginTop: '8px' }}
                  />
                </div>
              )}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SystemLogs;