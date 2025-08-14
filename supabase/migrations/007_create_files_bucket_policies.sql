-- 确保files存储桶是公开的
-- 这个操作不需要特殊权限

UPDATE storage.buckets 
SET public = true 
WHERE id = 'files';

-- 注意：RLS策略需要在Supabase Dashboard中手动设置
-- 或者使用具有适当权限的超级用户账户