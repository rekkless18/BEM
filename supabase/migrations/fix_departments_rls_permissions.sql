-- 修复departments表的RLS权限问题
-- 确保anon和authenticated角色可以对科室数据进行完整的CRUD操作

-- 首先检查当前的RLS策略
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'departments';

-- 删除可能存在的限制性策略
DROP POLICY IF EXISTS "departments_select_policy" ON departments;
DROP POLICY IF EXISTS "Enable read access for all users" ON departments;
DROP POLICY IF EXISTS "Users can view departments" ON departments;
DROP POLICY IF EXISTS "departments_insert_policy" ON departments;
DROP POLICY IF EXISTS "departments_update_policy" ON departments;
DROP POLICY IF EXISTS "departments_delete_policy" ON departments;

-- 创建新的宽松策略，允许查询所有科室数据
CREATE POLICY "departments_select_all" ON departments
  FOR SELECT
  TO anon, authenticated
  USING (true); -- 允许查询所有记录

-- 为authenticated用户添加插入权限
CREATE POLICY "departments_insert_authenticated" ON departments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 为anon用户也添加插入权限（如果需要匿名用户创建科室）
CREATE POLICY "departments_insert_anon" ON departments
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 为authenticated用户添加更新权限
CREATE POLICY "departments_update_authenticated" ON departments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 为anon用户也添加更新权限
CREATE POLICY "departments_update_anon" ON departments
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- 为authenticated用户添加删除权限
CREATE POLICY "departments_delete_authenticated" ON departments
  FOR DELETE
  TO authenticated
  USING (true);

-- 为anon用户也添加删除权限
CREATE POLICY "departments_delete_anon" ON departments
  FOR DELETE
  TO anon
  USING (true);

-- 确保RLS已启用
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- 授予基本表权限
GRANT ALL PRIVILEGES ON departments TO anon;
GRANT ALL PRIVILEGES ON departments TO authenticated;

-- 验证策略是否正确创建
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'departments'
ORDER BY policyname;

-- 验证权限是否正确授予
SELECT 
  grantee, 
  table_name, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'departments' 
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;