# 环境变量配置指南

本文档详细说明了BEM医疗管理系统的环境变量配置方法。

## 📁 配置文件位置

- **后端配置**: `backend/.env`
- **前端配置**: `frontend/.env`

## 🔧 后端环境变量配置 (backend/.env)

### 基础服务配置
```bash
# 服务器端口号
PORT=5000

# 运行环境 (development/production)
NODE_ENV=development
```

### Supabase数据库配置
```bash
# Supabase项目URL
SUPABASE_URL=https://arazxebdefxtciszqnih.supabase.co

# Supabase匿名密钥（用于前端）
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase服务角色密钥（仅用于后端，具有管理员权限）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### JWT认证配置
```bash
# JWT签名密钥（生产环境请使用强密码）
JWT_SECRET=bem-super-secret-jwt-key-2024-production

# JWT令牌过期时间
JWT_EXPIRES_IN=7d
```

### CORS跨域配置
```bash
# 允许的前端域名（开发环境）
CORS_ORIGIN=http://localhost:3000

# 允许的源列表（生产环境需要修改）
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**生产环境ALLOWED_ORIGINS配置示例：**
```bash
# 单个域名
ALLOWED_ORIGINS=https://yourdomain.com

# 多个域名（用逗号分隔）
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com

# 包含IP地址
ALLOWED_ORIGINS=https://yourdomain.com,http://192.168.1.100:3000
```

### 文件上传配置
```bash
# 最大文件大小（字节）5MB = 5242880
MAX_FILE_SIZE=5242880

# 上传文件存储路径
UPLOAD_PATH=uploads
```

## 🎨 前端环境变量配置 (frontend/.env)

### Supabase配置
```bash
# Supabase项目URL
VITE_SUPABASE_URL=https://arazxebdefxtciszqnih.supabase.co

# Supabase匿名密钥（前端专用）
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API配置
```bash
# 后端API基础URL
VITE_API_BASE_URL=http://localhost:5000/api
```

**生产环境API配置示例：**
```bash
# 生产环境后端地址
VITE_API_BASE_URL=https://api.yourdomain.com/api

# 或者使用相对路径（如果前后端部署在同一域名下）
VITE_API_BASE_URL=/api
```

### 应用配置
```bash
# 应用名称
VITE_APP_NAME=BEM医疗管理系统

# 应用版本
VITE_APP_VERSION=1.0.0

# 开发模式标识
VITE_DEV_MODE=true
```

## 🔒 安全注意事项

### ⚠️ 重要安全提醒

1. **SERVICE_ROLE_KEY安全**
   - `SUPABASE_SERVICE_ROLE_KEY` 具有管理员权限
   - 仅在后端使用，绝不能暴露给前端
   - 生产环境必须妥善保管

2. **JWT_SECRET安全**
   - 生产环境必须使用强密码
   - 建议使用随机生成的64位字符串
   - 定期更换密钥

3. **环境文件安全**
   - `.env` 文件已添加到 `.gitignore`
   - 不要将包含真实密钥的 `.env` 文件提交到版本控制
   - 团队成员需要单独配置自己的环境文件

### 🔑 生产环境密钥生成

**生成强JWT密钥：**
```bash
# 使用Node.js生成
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 或使用在线工具
# https://generate-secret.vercel.app/64
```

## 🚀 部署配置

### 开发环境
- 使用 `localhost` 地址
- 启用调试模式
- 使用HTTP协议

### 生产环境
- 使用实际域名
- 禁用调试模式
- 使用HTTPS协议
- 配置CDN和负载均衡

### Docker部署
如果使用Docker部署，可以通过环境变量覆盖：

```bash
# 启动时传递环境变量
docker-compose up -d \
  -e SUPABASE_URL=your_production_url \
  -e ALLOWED_ORIGINS=https://yourdomain.com
```

## 🔧 故障排除

### 常见问题

1. **CORS错误**
   - 检查 `CORS_ORIGIN` 和 `ALLOWED_ORIGINS` 配置
   - 确保前端域名在允许列表中

2. **Supabase连接失败**
   - 验证 `SUPABASE_URL` 格式正确
   - 检查密钥是否有效
   - 确认Supabase项目状态正常

3. **JWT认证失败**
   - 检查 `JWT_SECRET` 配置
   - 验证令牌过期时间设置

4. **文件上传失败**
   - 检查 `MAX_FILE_SIZE` 限制
   - 确认Supabase Storage配置正确

### 环境变量验证

可以使用以下命令验证环境变量是否正确加载：

```bash
# 后端
cd backend
node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"

# 前端（开发服务器启动时会显示）
cd frontend
npm run dev
```

## 📞 技术支持

如果在配置过程中遇到问题，请检查：
1. 文件路径是否正确
2. 环境变量名称是否准确
3. 值是否包含特殊字符需要转义
4. Supabase项目是否正常运行

---

**最后更新**: 2024年1月
**版本**: 1.0.0