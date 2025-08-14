-- 检查当前权限
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'departments'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- 授予authenticated角色对departments表的完整权限
GRANT ALL PRIVILEGES ON departments TO authenticated;

-- 确保anon角色至少有SELECT权限
GRANT SELECT ON departments TO anon;

-- 检查RLS策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'departments';

-- 如果需要，创建允许authenticated用户更新的RLS策略
DROP POLICY IF EXISTS "Allow authenticated users to update departments" ON departments;
CREATE POLICY "Allow authenticated users to update departments" 
ON departments FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 确保authenticated用户可以查看所有科室
DROP POLICY IF EXISTS "Allow authenticated users to view departments" ON departments;
CREATE POLICY "Allow authenticated users to view departments" 
ON departments FOR SELECT 
TO authenticated 
USING (true);

-- 再次检查权限
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'departments'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;