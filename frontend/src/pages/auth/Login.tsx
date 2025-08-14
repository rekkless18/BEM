import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Checkbox } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import './Login.css';

// 登录表单数据接口
interface LoginFormData {
  username: string; // 用户名
  password: string; // 密码
  remember: boolean; // 记住密码
}

/**
 * 登录页面组件
 * 提供管理员登录功能，包含用户名密码验证和记住密码功能
 */
const Login: React.FC = () => {
  const [loading, setLoading] = useState(false); // 登录加载状态
  const navigate = useNavigate(); // 路由导航
  const { login } = useAuthStore(); // 认证状态管理
  const [form] = Form.useForm(); // 表单实例

  /**
   * 处理登录表单提交
   * @param values - 表单数据
   */
  const handleLogin = async (values: LoginFormData) => {
    setLoading(true);
    try {
      // 调用登录API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 登录成功，保存用户信息和token
        login(data.data.user, data.data.token);
        
        // 如果选择记住密码，保存到localStorage
        if (values.remember) {
          localStorage.setItem('rememberedUsername', values.username);
        } else {
          localStorage.removeItem('rememberedUsername');
        }

        message.success('登录成功！');
        navigate('/dashboard'); // 跳转到仪表板
      } else {
        // 登录失败，显示错误信息
        message.error(data.message || '登录失败，请检查用户名和密码');
      }
    } catch (error) {
      console.error('登录错误:', error);
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 组件挂载时检查是否有记住的用户名
   */
  React.useEffect(() => {
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    if (rememberedUsername) {
      form.setFieldsValue({
        username: rememberedUsername,
        remember: true,
      });
    }
  }, [form]);

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-overlay" />
      </div>
      
      <Card className="login-card" title={null} bordered={false}>
        <div className="login-header">
          <h1 className="login-title">BEM后台管理系统</h1>
          <p className="login-subtitle">健康管理平台管理后台</p>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
          className="login-form"
        >
          {/* 用户名输入框 */}
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 50, message: '用户名最多50个字符' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </Form.Item>

          {/* 密码输入框 */}
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Form.Item>

          {/* 记住密码选项 */}
          <Form.Item name="remember" valuePropName="checked" className="login-remember">
            <Checkbox>记住用户名</Checkbox>
          </Form.Item>

          {/* 登录按钮 */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="login-button"
              block
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </Form.Item>
        </Form>

        {/* 默认账号提示 */}
        <div className="login-tips">
          <p>测试账号：</p>
          <p>用户名：admin，密码：admin123</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;