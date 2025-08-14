-- 检查users表的RLS策略和权限

-- 1. 检查users表是否启用了RLS
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 2. 查看users表的RLS策略
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

-- 3. 检查当前用户的角色
SELECT current_user, current_role;

-- 4. 检查service_role的权限
SELECT 
  grantee, 
  table_name, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND grantee IN ('service_role', 'anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- 5. 尝试直接查询users表（测试权限）
SELECT 'Direct query test:' as info, COUNT(*) as user_count FROM users;

-- 6. 查看前3条用户记录
SELECT 'Sample users:' as info;
SELECT id, openid, nick_name, real_name, is_verified, created_at 
FROM users 
LIMIT 3;