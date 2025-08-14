-- 启用users表的行级安全(RLS)并创建安全策略
-- 创建时间: 2024-01-01

-- 1. 启用users表的RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. 删除可能存在的旧策略
DROP POLICY IF EXISTS "service_role_full_access" ON users;
DROP POLICY IF EXISTS "admin_users_access" ON users;
DROP POLICY IF EXISTS "users_own_records" ON users;

-- 3. 创建策略：允许service_role完全访问（用于后端API）
CREATE POLICY "service_role_full_access" ON users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 4. 创建策略：允许已认证的管理员用户访问所有记录
CREATE POLICY "admin_users_access" ON users
    FOR ALL
    TO authenticated
    USING (
        -- 检查当前用户是否为管理员
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id::text = auth.uid()::text 
            AND admin_users.is_active = true
        )
    )
    WITH CHECK (
        -- 检查当前用户是否为管理员
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id::text = auth.uid()::text 
            AND admin_users.is_active = true
        )
    );

-- 5. 创建策略：允许普通用户只能访问自己的记录
CREATE POLICY "users_own_records" ON users
    FOR ALL
    TO authenticated
    USING (id::text = auth.uid()::text)
    WITH CHECK (id::text = auth.uid()::text);

-- 6. 授予必要的权限
GRANT ALL PRIVILEGES ON users TO service_role;
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- 7. 验证RLS已启用
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 8. 查看创建的策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';