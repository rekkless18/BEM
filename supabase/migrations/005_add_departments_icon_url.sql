-- 为departments表添加icon_url字段
-- 用于存储科室图标的URL链接

-- 添加icon_url字段到departments表
ALTER TABLE departments 
ADD COLUMN icon_url VARCHAR(500);

-- 为现有科室数据添加默认图标URL
-- 使用Supabase存储的图标链接
UPDATE departments 
SET icon_url = CASE 
    WHEN name = '内科' THEN 'https://arazxebdefxtciszqnih.supabase.co/storage/v1/object/public/department-icons/neike.png'
    WHEN name = '外科' THEN 'https://arazxebdefxtciszqnih.supabase.co/storage/v1/object/public/department-icons/waike.png'
    WHEN name = '儿科' THEN 'https://arazxebdefxtciszqnih.supabase.co/storage/v1/object/public/department-icons/erke.png'
    WHEN name = '妇科' THEN 'https://arazxebdefxtciszqnih.supabase.co/storage/v1/object/public/department-icons/fuke.png'
    WHEN name = '骨科' THEN 'https://arazxebdefxtciszqnih.supabase.co/storage/v1/object/public/department-icons/guke.png'
    WHEN name = '皮肤科' THEN 'https://arazxebdefxtciszqnih.supabase.co/storage/v1/object/public/department-icons/pifuke.png'
    WHEN name = '眼科' THEN 'https://arazxebdefxtciszqnih.supabase.co/storage/v1/object/public/department-icons/yanke.png'
    WHEN name = '耳鼻喉科' THEN 'https://arazxebdefxtciszqnih.supabase.co/storage/v1/object/public/department-icons/erbihou.png'
    WHEN name = '口腔科' THEN 'https://arazxebdefxtciszqnih.supabase.co/storage/v1/object/public/department-icons/kouqiang.png'
    WHEN name = '心理科' THEN 'https://arazxebdefxtciszqnih.supabase.co/storage/v1/object/public/department-icons/xinli.png'
    ELSE 'https://arazxebdefxtciszqnih.supabase.co/storage/v1/object/public/department-icons/default.png'
END
WHERE icon_url IS NULL;

-- 添加注释说明字段用途
COMMENT ON COLUMN departments.icon_url IS '科室图标URL链接，用于在前端页面显示科室图标';