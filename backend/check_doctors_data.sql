-- 检查医生表数据完整性

-- 1. 检查是否有重复的医生ID
SELECT id, COUNT(*) as count
FROM doctors
GROUP BY id
HAVING COUNT(*) > 1;

-- 2. 检查医生总数
SELECT COUNT(*) as total_doctors FROM doctors;

-- 3. 检查是否有NULL的ID
SELECT COUNT(*) as null_ids FROM doctors WHERE id IS NULL;

-- 4. 检查最近的医生记录
SELECT id, name, is_active, created_at, updated_at
FROM doctors
ORDER BY created_at DESC
LIMIT 5;

-- 5. 检查is_active字段的分布
SELECT is_active, COUNT(*) as count
FROM doctors
GROUP BY is_active;