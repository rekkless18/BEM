-- 插入初始管理员用户数据（如果不存在）
-- 密码: admin123 (已加密)
INSERT INTO admin_users (
    username,
    email,
    password_hash,
    name,
    role,
    is_active
) VALUES (
    'admin',
    'admin@bem.com',
    '$2b$10$K7L/8Y3QxvkRnBEfrh/jLOXBh4kMY8Lbfz5rYvYvYvYvYvYvYvYvYu', -- admin123
    '系统管理员',
    'super_admin',
    true
) ON CONFLICT (username) DO NOTHING;

-- 插入医疗管理员
INSERT INTO admin_users (
    username,
    email,
    password_hash,
    name,
    role,
    is_active
) VALUES (
    'medical_admin',
    'medical@bem.com',
    '$2b$10$K7L/8Y3QxvkRnBEfrh/jLOXBh4kMY8Lbfz5rYvYvYvYvYvYvYvYvYu', -- admin123
    '医疗管理员',
    'medical_admin',
    true
) ON CONFLICT (username) DO NOTHING;

-- 插入商城管理员
INSERT INTO admin_users (
    username,
    email,
    password_hash,
    name,
    role,
    is_active
) VALUES (
    'mall_admin',
    'mall@bem.com',
    '$2b$10$K7L/8Y3QxvkRnBEfrh/jLOXBh4kMY8Lbfz5rYvYvYvYvYvYvYvYvYu', -- admin123
    '商城管理员',
    'mall_admin',
    true
) ON CONFLICT (username) DO NOTHING;

-- 检查权限并授予访问权限
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO authenticated;

-- 为其他表授予权限
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON doctors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON doctors TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON consultations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON consultations TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON order_items TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON health_records TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON health_records TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON devices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON devices TO authenticated;