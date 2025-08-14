import app from './app'
import { checkSupabaseConnection } from './utils/supabase'

// 服务器配置
const PORT = parseInt(process.env.PORT || '5000', 10)
const HOST = process.env.HOST || '0.0.0.0'

// 启动服务器
const startServer = async () => {
  try {
    // 检查环境变量
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET',
    ]
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
    
    if (missingEnvVars.length > 0) {
      console.error('❌ 缺少必要的环境变量:')
      missingEnvVars.forEach(envVar => {
        console.error(`   - ${envVar}`)
      })
      console.error('\n请检查 .env 文件并确保所有必要的环境变量都已设置。')
      process.exit(1)
    }
    
    // 检查Supabase连接
    console.log('🔍 检查Supabase连接...')
    const isConnected = await checkSupabaseConnection()
    
    if (!isConnected) {
      console.error('❌ Supabase连接失败，请检查配置')
      process.exit(1)
    }
    
    console.log('✅ Supabase连接成功')
    
    // 启动HTTP服务器
    const server = app.listen(PORT, HOST, () => {
      console.log('\n🚀 BEM后台管理系统API服务器启动成功!')
      console.log(`📍 服务器地址: http://${HOST}:${PORT}`)
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`)
      console.log(`📊 健康检查: http://${HOST}:${PORT}/health`)
      console.log(`🔐 认证API: http://${HOST}:${PORT}/api/auth`)
      console.log('\n按 Ctrl+C 停止服务器\n')
    })
    
    // 设置服务器超时
    server.timeout = parseInt(process.env.SERVER_TIMEOUT || '30000', 10)
    
    // 优雅关闭处理
    const gracefulShutdown = (signal: string) => {
      console.log(`\n收到 ${signal} 信号，正在优雅关闭服务器...`)
      
      server.close((err) => {
        if (err) {
          console.error('服务器关闭时发生错误:', err)
          process.exit(1)
        }
        
        console.log('✅ 服务器已优雅关闭')
        process.exit(0)
      })
      
      // 强制关闭超时
      setTimeout(() => {
        console.error('❌ 强制关闭服务器（超时）')
        process.exit(1)
      }, 10000)
    }
    
    // 监听关闭信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
    
    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
      console.error('❌ 未捕获的异常:', error)
      gracefulShutdown('uncaughtException')
    })
    
    // 处理未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ 未处理的Promise拒绝:', reason)
      console.error('Promise:', promise)
      gracefulShutdown('unhandledRejection')
    })
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error)
    process.exit(1)
  }
}

// 启动服务器
startServer()