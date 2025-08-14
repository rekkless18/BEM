-- 为users表添加role字段
-- 添加role字段，varchar类型，默认值为'user'
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 添加检查约束，确保role字段只能是指定的值
ALTER TABLE users ADD CONSTRAINT check_role_values 
  CHECK (role IN ('user', 'doctor', 'admin'));

-- 为现有用户设置默认角色
UPDATE users SET role = 'user' WHERE role IS NULL;

-- 添加注释
COMMENT ON COLUMN users.role IS '用户角色：user-普通用户, doctor-医生, admin-管理员';