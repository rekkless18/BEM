import React, { useState } from 'react'
import { Form, Input, Button, Card, message, Spin } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import type { User } from '../types'

// 登录表单数据类型
interface LoginFormData {
  username: string
  password: string
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  // 处理登录提交
  const handleLogin = async (values: LoginFormData) => {
    setLoading(true)
    console.log('🚀 前端登录开始:', { username: values.username, passwordLength: values.password.length })
    
    try {
      // 调用后端登录API
      console.log('📡 发送登录请求到:', '/api/admin/login')
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
        }),
      })
      
      console.log('📥 收到响应:', { status: response.status, ok: response.ok })
      const result = await response.json()
      console.log('📋 响应数据:', result)
      
      if (!response.ok) {
        console.log('❌ 登录失败:', result.message)
        message.error(result.message || '用户名或密码错误')
        return
      }
      
      // 构造用户信息
      const user: User = {
        id: result.data.user.id,
        username: result.data.user.username,
        email: result.data.user.email,
        name: result.data.user.name,
        role: result.data.user.role,
        isActive: result.data.user.is_active,
        createdAt: result.data.user.created_at,
        updatedAt: result.data.user.updated_at,
      }
      
      // 保存登录状态（使用后端返回的JWT token）
      login(result.data.token, user)
      
      message.success('登录成功')
      navigate('/dashboard')
      
    } catch (error) {
      console.error('Login error:', error)
      message.error('登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <Card className="login-form">
        <div className="login-title">
          BEM后台管理系统
        </div>
        
        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </Form.Item>

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

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: '40px' }}
            >
              {loading ? <Spin size="small" /> : '登录'}
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ textAlign: 'center', color: '#8c8c8c', fontSize: '12px' }}>
          <p>测试账号：admin / admin123</p>
        </div>
      </Card>
    </div>
  )
}

export default LoginPage