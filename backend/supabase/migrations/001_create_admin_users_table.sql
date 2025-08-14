-- 创建管理员用户表
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_created_at ON admin_users(created_at);

-- 添加约束
ALTER TABLE admin_users ADD CONSTRAINT chk_admin_users_role 
    CHECK (role IN ('super_admin', 'medical_admin', 'mall_admin', 'marketing_admin', 'admin'));

ALTER TABLE admin_users ADD CONSTRAINT chk_admin_users_username_length 
    CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 50);

ALTER TABLE admin_users ADD CONSTRAINT chk_admin_users_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 只有认证用户可以查看管理员用户信息
CREATE POLICY "Allow authenticated users to view admin users" ON admin_users
    FOR SELECT USING (auth.role() = 'authenticated');

-- 只有超级管理员可以插入新用户
CREATE POLICY "Allow super admin to insert admin users" ON admin_users
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 只有超级管理员可以更新用户信息
CREATE POLICY "Allow super admin to update admin users" ON admin_users
    FOR UPDATE USING (auth.role() = 'service_role');

-- 只有超级管理员可以删除用户
CREATE POLICY "Allow super admin to delete admin users" ON admin_users
    FOR DELETE USING (auth.role() = 'service_role');

-- 插入默认超级管理员账户（密码: admin123456）
INSERT INTO admin_users (username, email, password_hash, name, role, is_active)
VALUES (
    'admin',
    'admin@bem.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hqDxfHvJG', -- admin123456
    '系统管理员',
    'super_admin',
    true
) ON CONFLICT (username) DO NOTHING;

-- 授权给anon和authenticated角色
GRANT SELECT ON admin_users TO anon;
GRANT ALL PRIVILEGES ON admin_users TO authenticated;

-- 注释
COMMENT ON TABLE admin_users IS '管理员用户表';
COMMENT ON COLUMN admin_users.id IS '用户ID';
COMMENT ON COLUMN admin_users.username IS '用户名';
COMMENT ON COLUMN admin_users.email IS '邮箱';
COMMENT ON COLUMN admin_users.password_hash IS '密码哈希';
COMMENT ON COLUMN admin_users.name IS '姓名';
COMMENT ON COLUMN admin_users.role IS '角色：super_admin-超级管理员, medical_admin-医疗管理员, mall_admin-商城管理员, marketing_admin-营销管理员, admin-普通管理员';
COMMENT ON COLUMN admin_users.is_active IS '是否激活';
COMMENT ON COLUMN admin_users.last_login_at IS '最后登录时间';
COMMENT ON COLUMN admin_users.created_at IS '创建时间';
COMMENT ON COLUMN admin_users.updated_at IS '更新时间';