import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Space,
  message,
  Divider,
  Upload,
  Image,
} from 'antd';
import { UploadOutlined, SaveOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

// 系统设置接口定义
interface SystemSettings {
  // 基本设置
  systemName: string;
  systemDescription: string;
  systemLogo?: string;
  
  // 功能设置
  enableRegistration: boolean;
  enableEmailVerification: boolean;
  enableSmsVerification: boolean;
  
  // 安全设置
  passwordMinLength: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  
  // 邮件设置
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpFromEmail: string;
  
  // 短信设置
  smsProvider: string;
  smsApiKey: string;
  smsApiSecret: string;
}

const SystemSettings: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false); // 保存加载状态
  const [settings, setSettings] = useState<SystemSettings | null>(null); // 系统设置数据
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]); // Logo文件列表
  const [form] = Form.useForm(); // 表单实例

  // 组件挂载时加载设置
  useEffect(() => {
    fetchSettings();
  }, []);

  // 获取系统设置
  const fetchSettings = async () => {
    try {
      // TODO: 调用API获取系统设置
      // const response = await systemService.getSettings();
      // const settingsData = response.data;
      
      // 模拟数据
      const mockSettings: SystemSettings = {
        systemName: 'BEM管理系统',
        systemDescription: '医疗健康管理平台',
        systemLogo: '',
        enableRegistration: true,
        enableEmailVerification: true,
        enableSmsVerification: false,
        passwordMinLength: 6,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpUsername: '',
        smtpPassword: '',
        smtpFromEmail: 'noreply@example.com',
        smsProvider: 'aliyun',
        smsApiKey: '',
        smsApiSecret: '',
      };
      
      setSettings(mockSettings);
      form.setFieldsValue(mockSettings);
      
      // 设置Logo文件列表
      if (mockSettings.systemLogo) {
        setLogoFileList([
          {
            uid: '-1',
            name: 'logo.png',
            status: 'done',
            url: mockSettings.systemLogo,
          },
        ]);
      }
    } catch (error) {
      message.error('获取系统设置失败');
    }
  };

  // 处理表单提交
  const handleSubmit = async (values: SystemSettings) => {
    setLoading(true);
    try {
      // TODO: 调用API保存系统设置
      // await systemService.updateSettings(values);
      
      setSettings(values);
      message.success('系统设置保存成功');
    } catch (error) {
      message.error('保存系统设置失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理Logo上传
  const handleLogoUpload = (info: any) => {
    let fileList = [...info.fileList];
    
    // 限制只能上传一个文件
    fileList = fileList.slice(-1);
    
    // 读取文件内容
    fileList = fileList.map(file => {
      if (file.response) {
        // 组件会将 file.url 作为链接进行展示
        file.url = file.response.url;
      }
      return file;
    });
    
    setLogoFileList(fileList);
    
    if (info.file.status === 'done') {
      message.success(`${info.file.name} 文件上传成功`);
      // 更新表单中的logo字段
      form.setFieldsValue({ systemLogo: info.file.response?.url });
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 文件上传失败`);
    }
  };

  // 上传前的校验
  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 格式的图片!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB!');
    }
    return isJpgOrPng && isLt2M;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={settings || {}}
      >
        {/* 基本设置 */}
        <Card title="基本设置" style={{ marginBottom: '24px' }}>
          <Form.Item
            label="系统名称"
            name="systemName"
            rules={[{ required: true, message: '请输入系统名称' }]}
          >
            <Input placeholder="请输入系统名称" />
          </Form.Item>

          <Form.Item
            label="系统描述"
            name="systemDescription"
          >
            <Input.TextArea
              placeholder="请输入系统描述"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            label="系统Logo"
            name="systemLogo"
          >
            <Upload
              name="logo"
              listType="picture"
              fileList={logoFileList}
              onChange={handleLogoUpload}
              beforeUpload={beforeUpload}
              action="/api/upload" // TODO: 替换为实际的上传接口
            >
              {logoFileList.length === 0 && (
                <Button icon={<UploadOutlined />}>上传Logo</Button>
              )}
            </Upload>
          </Form.Item>
        </Card>

        {/* 功能设置 */}
        <Card title="功能设置" style={{ marginBottom: '24px' }}>
          <Form.Item
            label="允许用户注册"
            name="enableRegistration"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="启用邮箱验证"
            name="enableEmailVerification"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="启用短信验证"
            name="enableSmsVerification"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Card>

        {/* 安全设置 */}
        <Card title="安全设置" style={{ marginBottom: '24px' }}>
          <Form.Item
            label="密码最小长度"
            name="passwordMinLength"
            rules={[{ required: true, message: '请输入密码最小长度' }]}
          >
            <InputNumber
              min={6}
              max={20}
              placeholder="请输入密码最小长度"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="会话超时时间（分钟）"
            name="sessionTimeout"
            rules={[{ required: true, message: '请输入会话超时时间' }]}
          >
            <InputNumber
              min={5}
              max={1440}
              placeholder="请输入会话超时时间"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="最大登录尝试次数"
            name="maxLoginAttempts"
            rules={[{ required: true, message: '请输入最大登录尝试次数' }]}
          >
            <InputNumber
              min={3}
              max={10}
              placeholder="请输入最大登录尝试次数"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Card>

        {/* 邮件设置 */}
        <Card title="邮件设置" style={{ marginBottom: '24px' }}>
          <Form.Item
            label="SMTP服务器"
            name="smtpHost"
          >
            <Input placeholder="请输入SMTP服务器地址" />
          </Form.Item>

          <Form.Item
            label="SMTP端口"
            name="smtpPort"
          >
            <InputNumber
              min={1}
              max={65535}
              placeholder="请输入SMTP端口"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="SMTP用户名"
            name="smtpUsername"
          >
            <Input placeholder="请输入SMTP用户名" />
          </Form.Item>

          <Form.Item
            label="SMTP密码"
            name="smtpPassword"
          >
            <Input.Password placeholder="请输入SMTP密码" />
          </Form.Item>

          <Form.Item
            label="发件人邮箱"
            name="smtpFromEmail"
          >
            <Input placeholder="请输入发件人邮箱" />
          </Form.Item>
        </Card>

        {/* 短信设置 */}
        <Card title="短信设置" style={{ marginBottom: '24px' }}>
          <Form.Item
            label="短信服务商"
            name="smsProvider"
          >
            <Input placeholder="请输入短信服务商" />
          </Form.Item>

          <Form.Item
            label="API密钥"
            name="smsApiKey"
          >
            <Input placeholder="请输入API密钥" />
          </Form.Item>

          <Form.Item
            label="API密钥"
            name="smsApiSecret"
          >
            <Input.Password placeholder="请输入API密钥" />
          </Form.Item>
        </Card>

        {/* 操作按钮 */}
        <Card>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => form.resetFields()}>
                重置
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
              >
                保存设置
              </Button>
            </Space>
          </Form.Item>
        </Card>
      </Form>
    </div>
  );
};

export default SystemSettings;