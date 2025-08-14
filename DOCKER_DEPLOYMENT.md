# BEM项目Docker部署指南

本文档详细说明如何使用Docker部署BEM后台管理系统。

## 📋 前置要求

- Docker Engine 20.10+
- Docker Compose 2.0+
- 至少4GB可用内存
- Supabase项目（用于数据库和存储）

## 🚀 快速开始

### 1. 环境配置

复制环境变量模板文件：
```bash
cp .env.docker .env
```

编辑`.env`文件，填入实际配置：
```bash
# Supabase配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
```

### 2. 构建和启动服务

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 3. 访问应用

- 前端应用：http://localhost
- 后端API：http://localhost:5000
- 健康检查：http://localhost:5000/api/health

## 📁 项目结构

```
BEM/
├── docker-compose.yml          # Docker Compose配置
├── .env.docker                 # 环境变量模板
├── .env                        # 实际环境变量（需要创建）
├── frontend/
│   ├── Dockerfile              # 前端Docker配置
│   ├── nginx.conf              # Nginx配置
│   └── .dockerignore           # Docker忽略文件
├── backend/
│   ├── Dockerfile              # 后端Docker配置
│   ├── healthcheck.js          # 健康检查脚本
│   └── .dockerignore           # Docker忽略文件
└── DOCKER_DEPLOYMENT.md        # 本文档
```

## 🔧 详细配置

### Docker Compose服务

#### 后端服务 (backend)
- **端口**: 5000
- **健康检查**: 每30秒检查一次
- **重启策略**: unless-stopped
- **网络**: bem-network

#### 前端服务 (frontend)
- **端口**: 80
- **依赖**: 后端服务健康
- **重启策略**: unless-stopped
- **网络**: bem-network

### 环境变量说明

| 变量名 | 描述 | 必需 | 默认值 |
|--------|------|------|--------|
| SUPABASE_URL | Supabase项目URL | ✅ | - |
| SUPABASE_ANON_KEY | Supabase匿名密钥 | ✅ | - |
| SUPABASE_SERVICE_ROLE_KEY | Supabase服务角色密钥 | ✅ | - |
| JWT_SECRET | JWT签名密钥 | ✅ | - |
| JWT_EXPIRES_IN | JWT过期时间 | ❌ | 24h |
| NODE_ENV | 运行环境 | ❌ | production |
| PORT | 后端端口 | ❌ | 5000 |
| ALLOWED_ORIGINS | 允许的CORS源 | ❌ | - |

## 🛠️ 常用命令

### 服务管理
```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 重新构建并启动
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 容器管理
```bash
# 进入后端容器
docker-compose exec backend sh

# 进入前端容器
docker-compose exec frontend sh

# 查看容器资源使用
docker stats
```

### 数据管理
```bash
# 清理未使用的镜像
docker image prune

# 清理所有未使用的资源
docker system prune

# 查看磁盘使用
docker system df
```

## 🔍 故障排除

### 常见问题

#### 1. 服务启动失败
```bash
# 查看详细错误信息
docker-compose logs backend
docker-compose logs frontend

# 检查环境变量配置
cat .env
```

#### 2. 前端无法访问后端API
- 检查网络配置
- 确认后端服务健康状态
- 验证CORS配置

#### 3. 数据库连接失败
- 验证Supabase配置
- 检查网络连接
- 确认密钥正确性

#### 4. 文件上传失败
- 确认Supabase Storage配置
- 检查存储桶权限
- 验证SERVICE_ROLE_KEY

### 健康检查
```bash
# 检查后端健康状态
curl http://localhost:5000/api/health

# 检查前端服务
curl http://localhost

# 查看容器健康状态
docker-compose ps
```

## 🚀 生产环境部署

### 安全配置
1. 使用强密码和密钥
2. 配置防火墙规则
3. 启用HTTPS（使用反向代理）
4. 定期更新镜像

### 性能优化
1. 调整容器资源限制
2. 配置日志轮转
3. 使用CDN加速静态资源
4. 监控服务性能

### 备份策略
1. 定期备份Supabase数据
2. 备份环境配置文件
3. 保存Docker镜像版本

## 📞 技术支持

如果遇到问题，请：
1. 查看本文档的故障排除部分
2. 检查Docker和Docker Compose版本
3. 查看服务日志获取详细错误信息
4. 联系技术支持团队

---

**注意**: 请确保在生产环境中使用强密码和安全配置。