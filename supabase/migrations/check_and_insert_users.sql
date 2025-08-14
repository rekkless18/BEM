-- 检查users表数据并插入测试数据

-- 1. 查看当前users表的所有数据
SELECT 'Current users count:' as info, COUNT(*) as count FROM users;

-- 2. 查看users表的前5条记录
SELECT 'Sample users data:' as info;
SELECT id, openid, nick_name, real_name, phone, is_verified, created_at 
FROM users 
LIMIT 5;

-- 3. 如果没有数据，插入一些测试用户
INSERT INTO users (
  openid, 
  nick_name, 
  real_name, 
  phone, 
  avatar_url, 
  level, 
  level_progress, 
  points, 
  system_type, 
  is_verified, 
  is_logged_in, 
  created_at, 
  updated_at
) 
SELECT 
  'test_openid_' || gen_random_uuid()::text,
  '测试用户' || (ROW_NUMBER() OVER()),
  '真实姓名' || (ROW_NUMBER() OVER()),
  '1380000000' || (ROW_NUMBER() OVER()),
  'https://example.com/avatar' || (ROW_NUMBER() OVER()) || '.jpg',
  'VIP' || ((ROW_NUMBER() OVER() % 3) + 1),
  (ROW_NUMBER() OVER() * 10) % 100,
  (ROW_NUMBER() OVER() * 100),
  'WIP',
  (ROW_NUMBER() OVER() % 2 = 1),
  false,
  NOW(),
  NOW()
FROM generate_series(1, 5) -- 生成5个测试用户
WHERE NOT EXISTS (SELECT 1 FROM users LIMIT 1); -- 只有在没有用户时才插入

-- 4. 再次查看插入后的数据
SELECT 'After insert - users count:' as info, COUNT(*) as count FROM users;

-- 5. 查看插入后的用户数据
SELECT 'Final users data:' as info;
SELECT id, openid, nick_name, real_name, phone, is_verified, level, points, created_at 
FROM users 
ORDER BY created_at DESC
LIMIT 10;