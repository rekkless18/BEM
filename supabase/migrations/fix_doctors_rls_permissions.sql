-- 修复doctors表的RLS权限问题
-- 确保anon和authenticated角色可以查询所有医生数据，包括is_active=false的记录

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
WHERE tablename = 'doctors';

-- 删除可能存在的限制性策略
DROP POLICY IF EXISTS "doctors_select_policy" ON doctors;
DROP POLICY IF EXISTS "Enable read access for all users" ON doctors;
DROP POLICY IF EXISTS "Users can view doctors" ON doctors;

-- 创建新的宽松策略，允许查询所有医生数据
CREATE POLICY "doctors_select_all" ON doctors
  FOR SELECT
  TO anon, authenticated
  USING (true); -- 允许查询所有记录，不限制is_active状态

-- 为authenticated用户添加插入、更新、删除权限
CREATE POLICY "doctors_insert_authenticated" ON doctors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "doctors_update_authenticated" ON doctors
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "doctors_delete_authenticated" ON doctors
  FOR DELETE
  TO authenticated
  USING (true);

-- 确保RLS已启用
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- 授予基本表权限
GRANT SELECT ON doctors TO anon;
GRANT ALL PRIVILEGES ON doctors TO authenticated;

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
WHERE tablename = 'doctors'
ORDER BY policyname;

-- 验证权限是否正确授予
SELECT 
  grantee, 
  table_name, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'doctors' 
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;