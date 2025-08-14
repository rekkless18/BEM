-- 调试医生更新问题

-- 1. 检查特定医生是否存在
SELECT id, name, is_active, created_at, updated_at
FROM doctors 
WHERE id = 'de7427f7-37e3-4054-a9cf-70e7a814e5bb';

-- 2. 检查RLS策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'doctors';

-- 3. 尝试直接更新（使用service role）
UPDATE doctors 
SET is_active = false, updated_at = NOW()
WHERE id = 'de7427f7-37e3-4054-a9cf-70e7a814e5bb';

-- 4. 检查更新结果
SELECT id, name, is_active, updated_at
FROM doctors 
WHERE id = 'de7427f7-37e3-4054-a9cf-70e7a814e5bb';