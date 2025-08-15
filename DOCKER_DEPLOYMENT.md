# BEM项目云服务器部署指南 - 小白版

本指南将手把手教你如何在云服务器上部署BEM后台管理系统，即使你是完全的新手也能成功部署！

## 📋 部署概览

我们将完成以下步骤：
1. 购买云服务器
2. 连接到服务器
3. 安装必要软件
4. 下载项目代码
5. 配置环境
6. 启动服务
7. 配置域名和SSL证书
8. 完成部署

## 🛒 第一步：购买云服务器

### 推荐的云服务商

#### 阿里云（推荐新手）
1. 访问 [阿里云官网](https://www.aliyun.com/)
2. 点击「云服务器ECS」
3. 选择「轻量应用服务器」（更便宜，适合小项目）

**推荐配置：**
- CPU：2核
- 内存：4GB
- 硬盘：40GB SSD
- 带宽：3Mbps
- 系统：Ubuntu 20.04 LTS
- 价格：约60元/月

#### 腾讯云
1. 访问 [腾讯云官网](https://cloud.tencent.com/)
2. 选择「云服务器CVM」
3. 选择相同配置

#### 华为云
1. 访问 [华为云官网](https://www.huaweicloud.com/)
2. 选择「弹性云服务器ECS」

### 购买注意事项

⚠️ **重要提醒：**
- 选择「Ubuntu 20.04 LTS」操作系统
- 记住你设置的root密码
- 购买后记录服务器的公网IP地址
- 建议先买1个月测试

## 🔌 第二步：连接到服务器

### Windows用户连接方法

#### 方法一：使用PuTTY（推荐新手）

1. **下载PuTTY**
   - 访问 [PuTTY官网](https://www.putty.org/)
   - 下载并安装PuTTY

2. **连接服务器**
   - 打开PuTTY
   - 在「Host Name」输入你的服务器IP地址
   - 端口保持22不变
   - 点击「Open」
   - 输入用户名：`root`
   - 输入密码（你购买时设置的密码）

#### 方法二：使用Windows Terminal

1. 按 `Win + R`，输入 `cmd`，回车
2. 输入命令：
   ```bash
   ssh root@你的服务器IP地址
   ```
3. 输入密码

### Mac用户连接方法

1. 打开「终端」应用
2. 输入命令：
   ```bash
   ssh root@你的服务器IP地址
   ```
3. 输入密码

### 连接成功标志

当你看到类似这样的提示时，说明连接成功：
```
root@your-server:~#
```

## 🛠️ 第三步：安装必要软件

连接到服务器后，我们需要安装Docker、Git等软件。

### 3.1 更新系统

```bash
# 更新软件包列表
sudo yum makecache

# 升级已安装的软件包
sudo yum update -y
```

**解释：** 这两个命令会更新你的Linux系统，确保所有软件都是最新版本。

### 3.2 安装Docker

```bash
# 安装必要的依赖
sudo yum install -y yum-utils device-mapper-persistent-data lvm2

# 添加Docker官方软件源
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 更新软件包列表
sudo yum makecache fast

# 安装Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Docker Compose已经通过docker-compose-plugin安装，无需额外安装
```

# 卸载已有的Docker仓库配置（如果存在）
sudo rm -f /etc/yum.repos.d/docker-ce.repo

# 添加阿里云Docker源
sudo curl -o /etc/yum.repos.d/docker-ce.repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 清除yum缓存并重新安装
sudo yum clean all
sudo yum makecache
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin



### 3.3 验证Docker安装

```bash
# 检查Docker版本
docker --version

# 检查Docker Compose版本
docker compose version

# 启动Docker服务
sudo systemctl start docker

# 设置Docker开机自启
sudo systemctl enable docker
```




**预期结果：** 你应该看到Docker和Docker Compose的版本信息。

### 3.4 安装Git

```bash
# 安装Git
sudo yum install -y git

# 验证安装
git --version
```

### 3.5 安装其他必要工具

```bash
# 安装文本编辑器和其他工具
sudo yum install -y nano curl wget unzip
```

## 📥 第四步：下载项目代码

### 4.1 创建项目目录

```bash
# 进入home目录
cd /home

# 创建项目目录
sudo mkdir -p /home/bem

# 进入项目目录
cd /home/bem
```

### 4.2 克隆项目代码

```bash
# 克隆项目（替换为你的实际Git地址）
sudo git clone https://github.com/rekkless18/BEM.git

# 查看文件是否下载成功
ls -la
```

**预期结果：** 你应该看到项目的文件和文件夹，包括 `frontend/`、`backend/`、`docker-compose.yml` 等。

## ⚙️ 第五步：配置环境变量

### 5.1 创建环境变量文件

```bash
# 创建环境变量文件
sudo nano .env
```

### 5.2 填写环境变量

在打开的编辑器中，输入以下内容（**请替换为你的实际配置**）：

```bash
# Supabase配置（从Supabase项目设置中获取）
SUPABASE_URL=https://arazxebdefxtciszqnih.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyYXp4ZWJkZWZ4dGNpc3pxbmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2Mzg2OTgsImV4cCI6MjA3MDIxNDY5OH0.3CLTpp3VK8bcl_G7Fa_S7Zv5HaY9_Ok9sODJKQLoxZQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyYXp4ZWJkZWZ4dGNpc3pxbmloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYzODY5OCwiZXhwIjoyMDcwMjE0Njk4fQ.OLqzEwOojR586dDGguoGfrAMTlexq9JiLk_Gm8gHYMY

# JWT配置（用于用户认证）
JWT_SECRET=bem-super-secret-jwt-key-2024-production
JWT_EXPIRES_IN=7d

# CORS配置（允许的前端域名）
CORS_ORIGIN=http://localhost:3000

# 文件上传配置
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads

# 数据库配置
DB_SCHEMA=public

# 允许的源（生产环境时需要修改为实际域名）
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 5.3 保存文件

- 按 `Ctrl + X`
- 按 `Y` 确认保存
- 按 `Enter` 确认文件名

### 5.4 设置文件权限

```bash
# 设置环境变量文件权限（只有root可以读写）
sudo chmod 600 .env
```

## 🚀 第六步：启动服务

### 6.1 构建并启动容器

```bash
# 构建并启动所有服务
sudo docker compose up -d --build
```

**解释：**
- `up`：启动服务
- `-d`：在后台运行
- `--build`：重新构建镜像

### 6.2 查看服务状态

```bash
# 查看容器状态
sudo docker compose ps

# 查看日志
sudo docker compose logs -f
```

**预期结果：** 你应该看到前端和后端服务都在运行，状态为 "Up"。

### 6.3 测试服务

```bash
# 测试后端API
curl http://localhost:5000/api/health

# 测试前端服务
curl http://localhost:80
```

## 🔒 第七步：配置防火墙

### 7.1 配置云服务器安全组

**阿里云用户：**
1. 登录阿里云控制台
2. 进入「云服务器ECS」
3. 点击你的服务器实例
4. 点击「安全组」
5. 点击「配置规则」
6. 添加以下规则：
   - 端口80（HTTP）：0.0.0.0/0
   - 端口443（HTTPS）：0.0.0.0/0
   - 端口22（SSH）：你的IP地址/32

**腾讯云用户：**
1. 登录腾讯云控制台
2. 进入「云服务器」
3. 点击你的实例
4. 点击「安全组」
5. 添加相同的规则

### 7.2 配置服务器防火墙

```bash
# 启动firewalld防火墙服务
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 允许SSH连接
sudo firewall-cmd --permanent --add-service=ssh

# 允许HTTP和HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# 重新加载防火墙规则
sudo firewall-cmd --reload

# 查看防火墙状态
sudo firewall-cmd --list-all
```

## 🌐 第八步：配置域名（可选但推荐）

### 8.1 购买域名

推荐域名注册商：
- 阿里云万网
- 腾讯云
- GoDaddy
- Namecheap

### 8.2 配置DNS解析

1. 登录你的域名管理控制台
2. 添加A记录：
   - 主机记录：`@`（代表根域名）
   - 记录值：你的服务器IP地址
   - TTL：600
3. 添加CNAME记录：
   - 主机记录：`www`
   - 记录值：你的根域名
   - TTL：600

### 8.3 验证域名解析

```bash
# 测试域名解析（替换为你的域名）
ping your-domain.com
```

## 🔐 第九步：配置SSL证书

### 9.1 安装Certbot

```bash
# 安装Certbot
sudo yum install -y certbot python3-certbot-nginx
```

### 9.2 安装Nginx

```bash
# 安装Nginx
sudo yum install -y nginx

# 启动Nginx
sudo systemctl start nginx

# 设置开机自启
sudo systemctl enable nginx
```

### 9.3 配置Nginx反向代理

```bash
# 创建Nginx配置文件
sudo nano /etc/nginx/conf.d/bem.conf
```

输入以下配置（**替换your-domain.com为你的实际域名**）：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 前端代理
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 9.4 启用配置

```bash
# 创建软链接启用配置
sudo ln -s /etc/nginx/sites-available/bem /etc/nginx/sites-enabled/

# 删除默认配置
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

### 9.5 申请SSL证书

```bash
# 申请SSL证书（替换为你的域名和邮箱）
sudo certbot --nginx -d your-domain.com -d www.your-domain.com --email your-email@example.com --agree-tos --no-eff-email
```

### 9.6 设置证书自动续期

```bash
# 测试自动续期
sudo certbot renew --dry-run

# 添加定时任务
sudo crontab -e
```

在打开的编辑器中添加：
```
0 12 * * * /usr/bin/certbot renew --quiet
```

## ✅ 第十步：验证部署

### 10.1 检查服务状态

```bash
# 检查Docker容器
sudo docker-compose ps

# 检查Nginx状态
sudo systemctl status nginx

# 检查防火墙状态
sudo firewall-cmd --list-all
```

### 10.2 访问测试

1. **通过域名访问**（如果配置了域名）：
   - 访问：`https://your-domain.com`
   - 应该看到BEM系统登录页面

2. **通过IP访问**（如果没有域名）：
   - 访问：`http://你的服务器IP`
   - 应该看到BEM系统登录页面

3. **测试API**：
   - 访问：`https://your-domain.com/api/health`
   - 应该返回健康检查信息

### 10.3 默认登录信息

- 用户名：`admin`
- 密码：`admin123`

⚠️ **安全提醒：** 登录后请立即修改默认密码！

## 🛠️ 常用管理命令

### 服务管理

```bash
# 查看服务状态
sudo docker-compose ps

# 查看日志
sudo docker-compose logs -f

# 重启服务
sudo docker-compose restart

# 停止服务
sudo docker-compose down

# 启动服务
sudo docker-compose up -d

# 重新构建并启动
sudo docker compose up -d --build
```

### 系统管理

```bash
# 查看系统资源使用
top

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 重启服务器
sudo reboot
```

### 日志查看

```bash
# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 查看系统日志
sudo journalctl -f
```

## 🚨 常见问题解决

### 问题1：无法连接到服务器

**症状：** SSH连接超时或被拒绝

**解决方案：**
1. 检查服务器IP地址是否正确
2. 检查云服务器安全组是否开放22端口
3. 检查本地网络是否正常
4. 尝试重启服务器

### 问题2：Docker服务启动失败

**症状：** `docker-compose up` 命令报错

**解决方案：**
```bash
# 查看详细错误信息
sudo docker compose logs

# 检查环境变量文件
cat .env

# 重新构建镜像
sudo docker compose build --no-cache

# 清理Docker缓存
sudo docker system prune -a
```

### 问题3：网站无法访问

**症状：** 浏览器显示"无法访问此网站"

**解决方案：**
1. 检查防火墙设置
2. 检查Nginx配置
3. 检查域名解析
4. 检查SSL证书

```bash
# 检查端口是否开放
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# 检查Nginx状态
sudo systemctl status nginx

# 重启Nginx
sudo systemctl restart nginx
```

### 问题4：SSL证书申请失败

**症状：** Certbot报错

**解决方案：**
1. 确保域名已正确解析到服务器IP
2. 确保80端口可以访问
3. 检查防火墙设置

```bash
# 测试域名解析
nslookup your-domain.com

# 手动申请证书
sudo certbot certonly --standalone -d your-domain.com
```

## 📊 监控和维护

### 设置监控脚本

```bash
# 创建监控脚本
sudo nano /home/bem/monitor.sh
```

输入以下内容：

```bash
#!/bin/bash

# 检查Docker服务状态
echo "=== Docker服务状态 ==="
sudo docker compose ps

echo "\n=== 系统资源使用 ==="
echo "CPU和内存使用："
top -bn1 | grep "Cpu\|Mem"

echo "\n磁盘使用："
df -h

echo "\n=== 服务健康检查 ==="
echo "后端API健康检查："
curl -s http://localhost:5000/api/health || echo "后端服务异常"

echo "\n前端服务检查："
curl -s http://localhost:80 > /dev/null && echo "前端服务正常" || echo "前端服务异常"
```

```bash
# 设置执行权限
sudo chmod +x /home/bem/monitor.sh

# 运行监控脚本
/home/bem/monitor.sh
```

### 设置定时备份

```bash
# 创建备份脚本
sudo nano /home/bem/backup.sh
```

输入以下内容：

```bash
#!/bin/bash

# 设置备份目录
BACKUP_DIR="/home/bem/backups"
DATE=$(date +"%Y%m%d_%H%M%S")

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份环境变量文件
cp /home/bem/.env $BACKUP_DIR/.env_$DATE

# 备份Docker配置
cp /home/bem/docker-compose.yml $BACKUP_DIR/docker-compose_$DATE.yml

# 备份Nginx配置
cp /etc/nginx/conf.d/bem.conf $BACKUP_DIR/nginx_bem_$DATE.conf

# 删除7天前的备份
find $BACKUP_DIR -name "*" -mtime +7 -delete

echo "备份完成：$DATE"
```

```bash
# 设置执行权限
sudo chmod +x /home/bem/backup.sh

# 设置定时备份（每天凌晨2点）
sudo crontab -e
```

添加：
```
0 2 * * * /home/bem/backup.sh
```

## 🔐 安全建议

### 1. 修改SSH端口

```bash
# 编辑SSH配置
sudo nano /etc/ssh/sshd_config

# 找到 #Port 22 这一行，修改为：
# Port 2222

# 重启SSH服务
sudo systemctl restart ssh

# 更新防火墙规则
sudo firewall-cmd --permanent --add-port=2222/tcp
sudo firewall-cmd --permanent --remove-service=ssh
sudo firewall-cmd --reload
```

### 2. 禁用root登录

```bash
# 创建新用户
sudo adduser bem-admin

# 添加到sudo组
sudo usermod -aG sudo bem-admin

# 编辑SSH配置
sudo nano /etc/ssh/sshd_config

# 修改以下配置：
# PermitRootLogin no
# PasswordAuthentication no  # 如果使用密钥登录

# 重启SSH服务
sudo systemctl restart ssh
```

### 3. 设置自动更新

```bash
# 安装自动更新
sudo yum install -y yum-cron

# 启用自动更新服务
sudo systemctl enable yum-cron
sudo systemctl start yum-cron
```

### 4. 安装Fail2ban

```bash
# 安装Fail2ban
sudo yum install -y fail2ban

# 启动服务
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# 查看状态
sudo fail2ban-client status
```

## 📞 技术支持

如果在部署过程中遇到问题：

1. **查看日志**：
   ```bash
   sudo docker compose logs -f
   sudo journalctl -f
   ```

2. **检查配置**：
   - 确认环境变量文件正确
   - 确认域名解析正确
   - 确认防火墙设置正确

3. **重启服务**：
   ```bash
   sudo docker compose restart
   sudo systemctl restart nginx
   ```

4. **联系技术支持**：
   - 提供详细的错误信息
   - 说明你的操作步骤
   - 提供服务器配置信息

## 🎉 部署完成

恭喜！如果你按照本指南完成了所有步骤，你的BEM系统现在应该已经成功部署在云服务器上了！

**最后的检查清单：**
- ✅ 服务器正常运行
- ✅ Docker容器正常启动
- ✅ 网站可以正常访问
- ✅ SSL证书配置成功
- ✅ 防火墙配置正确
- ✅ 监控和备份脚本设置完成

**下一步：**
1. 登录系统修改默认密码
2. 配置系统设置
3. 添加用户和权限
4. 定期检查系统状态
5. 定期更新系统和应用

---

**注意事项：**
- 定期备份重要数据
- 定期更新系统和软件
- 监控服务器资源使用情况
- 及时处理安全更新
- 保持SSL证书有效

祝你使用愉快！🚀