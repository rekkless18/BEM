# Git 仓库设置和推送指南

本指南将帮助您将BEM项目推送到远程Git仓库（如GitHub、GitLab等）。

## 📋 前提条件

- ✅ Git已安装在您的系统上
- ✅ 拥有GitHub/GitLab等平台的账号
- ✅ 已创建远程仓库（如果还没有，请先在平台上创建）

## 🚀 快速推送步骤

### 1. 配置Git用户信息（首次使用）

```bash
# 设置全局用户名和邮箱
git config --global user.name "您的用户名"
git config --global user.email "您的邮箱@example.com"
```

### 2. 添加远程仓库

```bash
# 添加远程仓库（请替换为您的实际仓库地址）
git remote add origin https://github.com/您的用户名/BEM.git

# 或者使用SSH（推荐，需要先配置SSH密钥）
git remote add origin git@github.com:您的用户名/BEM.git
```

### 3. 推送到远程仓库

```bash
# 推送到远程仓库的main分支
git branch -M main
git push -u origin main
```

## 🔧 详细配置步骤

### GitHub 配置示例

1. **创建GitHub仓库**
   - 登录GitHub
   - 点击右上角的"+"号，选择"New repository"
   - 输入仓库名称（如：BEM）
   - 选择公开或私有
   - **不要**初始化README、.gitignore或LICENSE（因为本地已有）
   - 点击"Create repository"

2. **获取仓库地址**
   - 创建后会显示仓库地址，类似：
     - HTTPS: `https://github.com/您的用户名/BEM.git`
     - SSH: `git@github.com:您的用户名/BEM.git`

3. **推送代码**
   ```bash
   # 在BEM项目根目录执行
   git remote add origin https://github.com/您的用户名/BEM.git
   git branch -M main
   git push -u origin main
   ```

### GitLab 配置示例

```bash
# GitLab示例
git remote add origin https://gitlab.com/您的用户名/BEM.git
git branch -M main
git push -u origin main
```

### 其他Git平台

```bash
# 通用格式
git remote add origin <您的仓库地址>
git branch -M main
git push -u origin main
```

## 🔐 SSH密钥配置（推荐）

使用SSH可以避免每次推送时输入用户名和密码。

### 1. 生成SSH密钥

```bash
# 生成新的SSH密钥
ssh-keygen -t ed25519 -C "您的邮箱@example.com"

# 如果系统不支持ed25519，使用RSA
ssh-keygen -t rsa -b 4096 -C "您的邮箱@example.com"
```

### 2. 添加SSH密钥到ssh-agent

```bash
# 启动ssh-agent
eval "$(ssh-agent -s)"

# 添加私钥
ssh-add ~/.ssh/id_ed25519
```

### 3. 复制公钥到剪贴板

```bash
# Windows (Git Bash)
clip < ~/.ssh/id_ed25519.pub

# macOS
pbcopy < ~/.ssh/id_ed25519.pub

# Linux
xclip -sel clip < ~/.ssh/id_ed25519.pub
```

### 4. 在Git平台添加SSH密钥

**GitHub:**
1. 进入Settings → SSH and GPG keys
2. 点击"New SSH key"
3. 粘贴公钥内容
4. 点击"Add SSH key"

**GitLab:**
1. 进入User Settings → SSH Keys
2. 粘贴公钥内容
3. 点击"Add key"

### 5. 测试SSH连接

```bash
# 测试GitHub连接
ssh -T git@github.com

# 测试GitLab连接
ssh -T git@gitlab.com
```

## 📝 日常Git操作

### 提交新更改

```bash
# 查看文件状态
git status

# 添加所有更改
git add .

# 或添加特定文件
git add 文件名

# 提交更改
git commit -m "描述您的更改"

# 推送到远程仓库
git push
```

### 拉取远程更改

```bash
# 拉取并合并远程更改
git pull

# 或者分步操作
git fetch
git merge origin/main
```

### 分支操作

```bash
# 创建新分支
git checkout -b 新分支名

# 切换分支
git checkout 分支名

# 推送新分支
git push -u origin 新分支名

# 删除分支
git branch -d 分支名
```

## ⚠️ 重要注意事项

### 1. 环境变量安全

- ✅ `.env`文件已被`.gitignore`排除
- ✅ 只提交`.env.example`模板文件
- ⚠️ **永远不要**提交包含真实API密钥的文件

### 2. 敏感信息检查

在推送前，请确保以下文件不包含敏感信息：
- 数据库密码
- API密钥
- JWT密钥
- 第三方服务凭证

### 3. 大文件处理

如果项目包含大文件（>100MB），考虑使用Git LFS：

```bash
# 安装Git LFS
git lfs install

# 跟踪大文件类型
git lfs track "*.zip"
git lfs track "*.tar.gz"

# 提交.gitattributes文件
git add .gitattributes
git commit -m "Add Git LFS tracking"
```

## 🔧 常见问题解决

### 1. 推送被拒绝

```bash
# 如果远程仓库有更新，先拉取
git pull --rebase origin main
git push
```

### 2. 更改远程仓库地址

```bash
# 查看当前远程仓库
git remote -v

# 更改远程仓库地址
git remote set-url origin 新的仓库地址
```

### 3. 撤销最后一次提交

```bash
# 撤销提交但保留更改
git reset --soft HEAD~1

# 完全撤销提交和更改
git reset --hard HEAD~1
```

### 4. 查看提交历史

```bash
# 查看提交历史
git log --oneline

# 查看图形化历史
git log --graph --oneline --all
```

## 📚 推荐资源

- [Git官方文档](https://git-scm.com/doc)
- [GitHub帮助文档](https://docs.github.com/)
- [GitLab帮助文档](https://docs.gitlab.com/)
- [Git可视化学习](https://learngitbranching.js.org/)

## 🎯 下一步

推送成功后，您可以：

1. **设置CI/CD**: 配置自动化部署
2. **邀请协作者**: 添加团队成员
3. **创建Issues**: 跟踪bug和功能请求
4. **设置分支保护**: 保护主分支
5. **配置Webhooks**: 集成第三方服务

---

**需要帮助？** 如果在推送过程中遇到问题，请检查：
1. 网络连接是否正常
2. 仓库地址是否正确
3. 是否有推送权限
4. SSH密钥是否正确配置（如果使用SSH）