-- 修改users表的openid字段为可空并调整约束
-- 解决创建用户时openid为空导致的约束违反问题

-- 1. 首先移除openid字段的唯一约束
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_openid_key;

-- 2. 将openid字段修改为可空
ALTER TABLE users ALTER COLUMN openid DROP NOT NULL;

-- 3. 创建部分唯一索引，只对非空的openid值进行唯一性约束
-- 这样可以允许多个用户的openid为NULL，但非空值必须唯一
CREATE UNIQUE INDEX IF NOT EXISTS users_openid_unique_partial 
ON users (openid) 
WHERE openid IS NOT NULL;

-- 4. 添加注释说明字段用途
COMMENT ON COLUMN users.openid IS '微信用户唯一标识，用于微信登录，可为空（管理员创建用户时）';