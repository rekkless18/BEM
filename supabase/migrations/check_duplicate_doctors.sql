-- 检查医生表中是否存在重复的ID
SELECT 
  id, 
  COUNT(*) as count,
  array_agg(name) as doctor_names
FROM doctors 
GROUP BY id 
HAVING COUNT(*) > 1;

-- 检查医生表的总记录数和唯一ID数量
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT id) as unique_ids,
  (COUNT(*) - COUNT(DISTINCT id)) as duplicate_count
FROM doctors;

-- 查看所有医生的基本信息
SELECT id, name, title, department, is_active, created_at 
FROM doctors 
ORDER BY created_at DESC;