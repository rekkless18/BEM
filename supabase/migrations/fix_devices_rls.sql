-- 修复devices表RLS策略问题
-- 临时禁用RLS以允许匿名访问，或创建适当的策略

-- 方案1: 临时禁用RLS（用于测试）
-- ALTER TABLE devices DISABLE ROW LEVEL SECURITY;

-- 方案2: 创建允许所有用户读取的策略（推荐）
-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "devices_select_policy" ON devices;
DROP POLICY IF EXISTS "devices_insert_policy" ON devices;
DROP POLICY IF EXISTS "devices_update_policy" ON devices;
DROP POLICY IF EXISTS "devices_delete_policy" ON devices;

-- 创建新的RLS策略
-- 1. 允许所有人查看设备（用于公共展示）
CREATE POLICY "devices_select_policy" ON devices
    FOR SELECT
    USING (true);

-- 2. 只允许认证用户插入设备
CREATE POLICY "devices_insert_policy" ON devices
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 3. 只允许设备所有者或管理员更新设备
CREATE POLICY "devices_update_policy" ON devices
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR 
            auth.jwt() ->> 'role' = 'admin'
        )
    );

-- 4. 只允许设备所有者或管理员删除设备
CREATE POLICY "devices_delete_policy" ON devices
    FOR DELETE
    USING (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR 
            auth.jwt() ->> 'role' = 'admin'
        )
    );

-- 确保RLS已启用
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- 检查策略是否创建成功
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'devices';