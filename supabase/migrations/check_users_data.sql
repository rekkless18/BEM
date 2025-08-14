-- 检查users表的数据内容
SELECT 
    id,
    openid,
    nick_name,
    real_name,
    phone,
    avatar_url,
    level,
    level_progress,
    points,
    is_verified,
    is_logged_in,
    system_type,
    created_at,
    updated_at
FROM users 
ORDER BY created_at DESC;

-- 统计用户总数
SELECT COUNT(*) as total_users FROM users;

-- 检查各字段的数据分布
SELECT 
    system_type,
    is_verified,
    is_logged_in,
    COUNT(*) as count
FROM users 
GROUP BY system_type, is_verified, is_logged_in;

-- 检查是否有空值
SELECT 
    COUNT(CASE WHEN nick_name IS NULL OR nick_name = '' THEN 1 END) as empty_nick_name,
    COUNT(CASE WHEN real_name IS NULL OR real_name = '' THEN 1 END) as empty_real_name,
    COUNT(CASE WHEN phone IS NULL OR phone = '' THEN 1 END) as empty_phone,
    COUNT(CASE WHEN avatar_url IS NULL OR avatar_url = '' THEN 1 END) as empty_avatar_url
FROM users;