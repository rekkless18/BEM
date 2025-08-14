-- 查询admin_users表的管理员账户信息
SELECT 
    id,
    username,
    email,
    role,
    is_active,
    created_at
FROM admin_users
ORDER BY created_at DESC
LIMIT 10;

-- 检查是否有默认管理员账户
SELECT COUNT(*) as admin_count FROM admin_users WHERE role = 'admin';

-- 查看所有用户名
SELECT username FROM admin_users;