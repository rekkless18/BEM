-- 删除现有的RLS策略
DROP POLICY IF EXISTS "Allow authenticated users to update departments" ON departments;
DROP POLICY IF EXISTS "Allow authenticated users to view departments" ON departments;
DROP POLICY IF EXISTS "Enable read access for all users" ON departments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON departments;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON departments;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON departments;

-- 创建新的宽松RLS策略
-- 允许所有认证用户查看科室
CREATE POLICY "Allow all authenticated users to select departments" 
ON departments FOR SELECT 
TO authenticated 
USING (true);

-- 允许所有认证用户插入科室
CREATE POLICY "Allow all authenticated users to insert departments" 
ON departments FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 允许所有认证用户更新科室
CREATE POLICY "Allow all authenticated users to update departments" 
ON departments FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 允许所有认证用户删除科室
CREATE POLICY "Allow all authenticated users to delete departments" 
ON departments FOR DELETE 
TO authenticated 
USING (true);

-- 允许匿名用户查看科室
CREATE POLICY "Allow anonymous users to select departments" 
ON departments FOR SELECT 
TO anon 
USING (true);

-- 检查当前策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'departments'
ORDER BY policyname;