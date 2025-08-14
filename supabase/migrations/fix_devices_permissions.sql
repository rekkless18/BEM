-- 修复devices表权限问题
-- 确保anon和authenticated角色可以访问devices表

-- 1. 授予anon角色基本读取权限
GRANT SELECT ON devices TO anon;

-- 2. 授予authenticated角色全部权限
GRANT ALL PRIVILEGES ON devices TO authenticated;

-- 3. 检查并显示当前权限状态
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'devices'
    AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- 4. 检查RLS状态
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'devices';