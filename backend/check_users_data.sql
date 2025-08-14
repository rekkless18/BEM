-- 查询users表的数据内容，特别关注nick_name、real_name、phone字段
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

-- 统计各字段的非空数据情况
SELECT 
    COUNT(*) as total_users,
    COUNT(nick_name) as nick_name_count,
    COUNT(real_name) as real_name_count,
    COUNT(phone) as phone_count,
    COUNT(CASE WHEN nick_name IS NOT NULL AND nick_name != '' THEN 1 END) as valid_nick_name,
    COUNT(CASE WHEN real_name IS NOT NULL AND real_name != '' THEN 1 END) as valid_real_name,
    COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END) as valid_phone
FROM users;