-- 为users表添加所属系统字段
ALTER TABLE users ADD COLUMN system_type VARCHAR(50) DEFAULT 'WIP' NOT NULL;

-- 添加字段注释
COMMENT ON COLUMN users.system_type IS '所属系统类型，如：WIP、医疗系统、商城系统等';

-- 为现有数据设置默认值
UPDATE users SET system_type = 'WIP' WHERE system_type IS NULL;