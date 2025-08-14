-- 设置所有表的RLS权限策略
-- 确保anon和authenticated角色能够正确访问数据

-- 1. 用户表权限
-- 允许anon角色读取用户信息（用于展示）
GRANT SELECT ON users TO anon;
-- 允许authenticated角色完全访问用户表
GRANT ALL PRIVILEGES ON users TO authenticated;

-- 2. 医生表权限
-- 允许anon角色读取医生信息（用于展示医生列表）
GRANT SELECT ON doctors TO anon;
-- 允许authenticated角色完全访问医生表
GRANT ALL PRIVILEGES ON doctors TO authenticated;

-- 3. 科室表权限
-- 允许anon角色读取科室信息
GRANT SELECT ON departments TO anon;
-- 允许authenticated角色完全访问科室表
GRANT ALL PRIVILEGES ON departments TO authenticated;

-- 4. 商品表权限
-- 允许anon角色读取商品信息（用于商城展示）
GRANT SELECT ON products TO anon;
-- 允许authenticated角色完全访问商品表
GRANT ALL PRIVILEGES ON products TO authenticated;

-- 5. 管理员用户表权限
-- 只允许authenticated角色访问管理员表
GRANT ALL PRIVILEGES ON admin_users TO authenticated;

-- 6. 文章表权限
-- 允许anon角色读取已发布的文章
GRANT SELECT ON articles TO anon;
-- 允许authenticated角色完全访问文章表
GRANT ALL PRIVILEGES ON articles TO authenticated;

-- 7. 轮播图表权限
-- 允许anon角色读取轮播图（用于首页展示）
GRANT SELECT ON carousel_images TO anon;
-- 允许authenticated角色完全访问轮播图表
GRANT ALL PRIVILEGES ON carousel_images TO authenticated;

-- 8. 设备表权限
-- 只允许authenticated角色访问设备表
GRANT ALL PRIVILEGES ON devices TO authenticated;

-- 9. 咨询表权限
-- 只允许authenticated角色访问咨询表
GRANT ALL PRIVILEGES ON consultations TO authenticated;

-- 10. 订单相关表权限
-- 只允许authenticated角色访问订单表
GRANT ALL PRIVILEGES ON orders TO authenticated;
GRANT ALL PRIVILEGES ON order_items TO authenticated;

-- 11. 健康记录表权限
-- 只允许authenticated角色访问健康记录表
GRANT ALL PRIVILEGES ON health_records TO authenticated;

-- 12. 评价表权限
-- 允许anon角色读取评价（用于展示医生评价）
GRANT SELECT ON reviews TO anon;
-- 允许authenticated角色完全访问评价表
GRANT ALL PRIVILEGES ON reviews TO authenticated;

-- 创建RLS策略（如果需要更细粒度的控制）
-- 注意：当前所有表都已启用RLS，但没有强制执行
-- 以下策略可以根据需要启用

-- 用户表RLS策略示例（当前注释掉，因为已通过GRANT授权）
/*
CREATE POLICY "用户可以查看所有用户信息" ON users
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "管理员可以管理用户" ON users
  FOR ALL TO authenticated
  USING (true);
*/

-- 商品表RLS策略示例
/*
CREATE POLICY "所有人可以查看上架商品" ON products
  FOR SELECT TO anon, authenticated
  USING (status = 'active' AND is_active = true);

CREATE POLICY "管理员可以管理所有商品" ON products
  FOR ALL TO authenticated
  USING (true);
*/

-- 文章表RLS策略示例
/*
CREATE POLICY "所有人可以查看已发布文章" ON articles
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "管理员可以管理所有文章" ON articles
  FOR ALL TO authenticated
  USING (true);
*/

COMMIT;