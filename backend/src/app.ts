import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'

// 导入中间件
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler'

// 导入路由
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import adminUserRoutes from './routes/admin-users'
import adminRoutes from './routes/admin'
import departmentRoutes from './routes/departments'
import doctorRoutes from './routes/doctors'
import productRoutes from './routes/products'
import carouselRoutes from './routes/carousel'
import articleRoutes from './routes/articles'
import carouselImagesRoutes from './routes/carousel-images'
import communityArticleRoutes from './routes/articles'
import uploadRoutes from './routes/upload'
import deviceRoutes from './routes/devices'
import consultationRoutes from './routes/consultations'
import orderRoutes from './routes/orders'
import healthRecordRoutes from './routes/health-records'

// 加载环境变量
dotenv.config()

// 创建Express应用
const app = express()

// 信任代理（用于获取真实IP）
app.set('trust proxy', 1)

// 安全中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}))

// CORS配置
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // 允许的源列表
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ]
    
    // 添加环境变量中的允许源
    if (process.env.ALLOWED_ORIGINS) {
      allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(','))
    }
    
    // 开发环境允许所有源
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true)
    }
    
    // 检查源是否在允许列表中
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('不允许的CORS源'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // 24小时
}

app.use(cors(corsOptions))

// 请求日志中间件
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// 解析JSON请求体
app.use(express.json({ 
  limit: process.env.JSON_LIMIT || '10mb',
  strict: true,
}))

// 解析URL编码请求体
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.URL_ENCODED_LIMIT || '10mb',
}))

// 静态文件服务（如果需要）
if (process.env.SERVE_STATIC === 'true') {
  const staticPath = process.env.STATIC_PATH || path.join(__dirname, '../public')
  app.use('/static', express.static(staticPath))
}

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BEM后台管理系统API运行正常',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  })
})

// API健康检查端点（用于Docker健康检查）
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API服务正常',
    timestamp: new Date().toISOString(),
  })
})

// API根路径
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: '欢迎使用BEM后台管理系统API',
    version: process.env.npm_package_version || '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      health: '/health',
    },
  })
})

// 路由注册
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/admin-users', adminUserRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/products', productRoutes)
app.use('/api/carousel', carouselRoutes)
app.use('/api/articles', articleRoutes)
// 社区管理路由
app.use('/api/carousel-images', carouselImagesRoutes)
app.use('/api/community/articles', communityArticleRoutes)
// 文件上传路由
app.use('/api/upload', uploadRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api/consultations', consultationRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/health-records', healthRecordRoutes)

// 处理未找到的路由
app.use(notFoundHandler)

// 全局错误处理
app.use(globalErrorHandler)

// 优雅关闭处理
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在优雅关闭服务器...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在优雅关闭服务器...')
  process.exit(0)
})

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error)
  process.exit(1)
})

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason)
  console.error('Promise:', promise)
  process.exit(1)
})

export default app