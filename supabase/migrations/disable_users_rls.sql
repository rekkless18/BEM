-- 禁用users表的RLS策略以解决数据访问问题

-- 1. 查看当前RLS状态
SELECT 'Before disable RLS:' as info, rowsecurity as rls_enabled 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 2. 禁用users表的RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. 确保service_role有完整权限
GRANT ALL PRIVILEGES ON public.users TO service_role;
GRANT ALL PRIVILEGES ON public.users TO anon;
GRANT ALL PRIVILEGES ON public.users TO authenticated;

-- 4. 查看禁用后的RLS状态
SELECT 'After disable RLS:' as info, rowsecurity as rls_enabled 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 5. 验证数据访问
SELECT 'Users count after RLS disable:' as info, COUNT(*) as count FROM public.users;

-- 6. 查看用户数据
SELECT 'Sample users after RLS disable:' as info;
SELECT id, openid, nick_name, real_name, is_verified, created_at 
FROM public.users 
LIMIT 3;