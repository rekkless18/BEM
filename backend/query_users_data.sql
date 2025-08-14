-- 查询users表的实际数据内容
SELECT 
    id,
    openid,
    nick_name,
    real_name,
    phone,
    avatar_url,
    level,
    points,
    is_verified,
    is_logged_in,
    system_type,
    created_at,
    updated_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- 检查字段数据分布
SELECT 
    COUNT(*) as total_users,
    COUNT(nick_name) as has_nick_name,
    COUNT(real_name) as has_real_name,
    COUNT(phone) as has_phone,
    COUNT(CASE WHEN nick_name IS NOT NULL AND nick_name != '' THEN 1 END) as non_empty_nick_name,
    COUNT(CASE WHEN real_name IS NOT NULL AND real_name != '' THEN 1 END) as non_empty_real_name,
    COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END) as non_empty_phone
FROM users;