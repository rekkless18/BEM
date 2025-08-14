-- 创建默认管理员账户
INSERT INTO admin_users (username, name, email, password_hash, role, is_active, created_at, updated_at)
VALUES (
  'admin',
  '系统管理员',
  'admin@bem.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 密码: password
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  is_active = true,
  updated_at = NOW();

-- 查看创建的管理员账户
SELECT id, username, email, role, is_active, created_at FROM admin_users WHERE username = 'admin';