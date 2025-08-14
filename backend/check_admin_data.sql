-- 检查admin_users表中的所有数据
SELECT 
    id,
    username,
    email,
    LEFT(password_hash, 20) || '...' as password_hash_preview,
    name,
    role,
    is_active,
    created_at
FROM admin_users
ORDER BY created_at;

-- 专门查询admin用户
SELECT 
    id,
    username,
    email,
    password_hash,
    name,
    role,
    is_active,
    created_at
FROM admin_users 
WHERE username = 'admin';

-- 检查是否有重复的admin用户
SELECT username, COUNT(*) as count
FROM admin_users 
WHERE username = 'admin'
GROUP BY username;