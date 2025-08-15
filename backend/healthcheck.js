/**
 * Docker健康检查脚本
 * 检查后端服务是否正常运行
 */
const http = require('http');

// 健康检查选项
const options = {
  host: '127.0.0.1',
  port: process.env.PORT || 5000,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

// 执行健康检查
const request = http.request(options, (res) => {
  console.log(`健康检查状态码: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    process.exit(0); // 健康
  } else {
    process.exit(1); // 不健康
  }
});

// 处理请求错误
request.on('error', (err) => {
  console.error('健康检查失败:', err.message);
  process.exit(1);
});

// 处理超时
request.on('timeout', () => {
  console.error('健康检查超时');
  request.destroy();
  process.exit(1);
});

// 发送请求
request.end();