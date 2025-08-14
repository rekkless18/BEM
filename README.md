# BEM - 医院管理系统

一个基于React + Node.js + Supabase的现代化医院管理系统，提供用户管理、医生管理、科室管理、咨询管理、设备管理和社区管理等功能。

## 🚀 项目特性

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Node.js + Express + TypeScript
- **数据库**: Supabase (PostgreSQL)
- **认证**: JWT + Supabase Auth
- **文件存储**: Supabase Storage
- **部署**: Docker + Docker Compose

## 📁 项目结构

```
BEM/
├── frontend/                 # 前端React应用
│   ├── src/
│   │   ├── components/       # 可复用组件
│   │   ├── pages/           # 页面组件
│   │   ├── stores/          # Zustand状态管理
│   │   ├── utils/           # 工具函数
│   │   └── types/           # TypeScript类型定义
│   ├── Dockerfile           # 前端Docker配置
│   └── nginx.conf           # Nginx配置
├── backend/                  # 后端Node.js应用
│   ├── src/
│   │   ├── routes/          # API路由
│   │   ├── middleware/      # 中间件
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 业务逻辑
│   │   ├── types/           # TypeScript类型定义
│   │   └── utils/           # 工具函数
│   ├── Dockerfile           # 后端Docker配置
│   └── healthcheck.js       # 健康检查脚本
├── supabase/
│   └── migrations/          # 数据库迁移文件
├── docker-compose.yml       # Docker编排配置
├── .env.docker             # Docker环境变量模板
└── DOCKER_DEPLOYMENT.md    # Docker部署说明
```

## 🛠️ 功能模块

### 核心管理模块
- **用户管理**: 用户注册、登录、权限管理
- **医生管理**: 医生信息管理、状态控制
- **科室管理**: 科室信息维护、图标管理
- **咨询管理**: 在线咨询记录管理
- **设备管理**: 医疗设备信息管理

### 社区管理模块
- **轮播图管理**: 首页轮播图片上传和管理
- **文章管理**: 社区文章发布和编辑
- **文件上传**: 支持图片和文档上传

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Docker & Docker Compose (可选)
- Supabase账号

### 本地开发

1. **克隆项目**
```bash
git clone <your-git-url>
cd BEM
```

2. **安装依赖**
```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

3. **配置环境变量**

前端 (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

后端 (`backend/.env`):
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
```

4. **启动开发服务器**
```bash
# 启动后端服务 (端口5000)
cd backend
npm run dev

# 启动前端服务 (端口3000)
cd frontend
npm run dev
```

### Docker部署

1. **配置环境变量**
```bash
cp .env.docker .env
# 编辑.env文件，填入你的Supabase配置
```

2. **构建并启动服务**
```bash
docker-compose up -d --build
```

3. **访问应用**
- 前端: http://localhost:80
- 后端API: http://localhost:80/api

## 📊 数据库设置

项目使用Supabase作为后端服务，需要执行以下迁移文件：

1. `001_create_core_tables.sql` - 创建核心表结构
2. `002_insert_initial_data.sql` - 插入初始数据
3. `006_create_community_tables.sql` - 创建社区管理表
4. `007_create_files_bucket_policies.sql` - 创建文件存储桶和权限

## 🔐 认证与权限

系统支持多种用户角色：
- **管理员**: 完整系统访问权限
- **医生**: 医生相关功能访问权限
- **普通用户**: 基础功能访问权限

## 📝 API文档

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/verify` - 验证token

### 管理接口
- `GET /api/users` - 获取用户列表
- `GET /api/doctors` - 获取医生列表
- `GET /api/departments` - 获取科室列表
- `GET /api/consultations` - 获取咨询列表
- `GET /api/devices` - 获取设备列表

### 社区接口
- `GET /api/carousel-images` - 获取轮播图列表
- `POST /api/carousel-images` - 创建轮播图
- `GET /api/articles` - 获取文章列表
- `POST /api/articles` - 创建文章
- `POST /api/upload/image` - 上传图片

## 🧪 测试

```bash
# 运行前端测试
cd frontend
npm run test

# 运行后端测试
cd backend
npm run test

# 运行类型检查
npm run check
```

## 📦 构建部署

### 前端构建
```bash
cd frontend
npm run build
```

### 后端构建
```bash
cd backend
npm run build
```

### 生产环境部署
详见 [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 项目Issues: [GitHub Issues](your-repo-url/issues)
- 邮箱: your-email@example.com

## 🙏 致谢

感谢以下开源项目：
- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)