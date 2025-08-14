-- 插入初始数据

-- 插入科室数据
INSERT INTO departments (id, name, description, location, phone, email, working_hours, services, equipment, specialties, is_active, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440001', '内科', '内科是医院的重要科室，主要诊治内脏器官的疾病', '1楼东区', '010-12345678', 'internal@hospital.com', 
 '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00", "saturday": "08:00-12:00"}',
 ARRAY['常规体检', '慢性病管理', '急诊处理'], 
 ARRAY['心电图机', '血压计', '听诊器'], 
 ARRAY['心血管疾病', '呼吸系统疾病', '消化系统疾病'], 
 true, 1),

('550e8400-e29b-41d4-a716-446655440002', '外科', '外科专门从事手术治疗的科室', '2楼西区', '010-12345679', 'surgery@hospital.com',
 '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}',
 ARRAY['手术治疗', '创伤处理', '术后康复'], 
 ARRAY['手术台', '麻醉机', '监护仪'], 
 ARRAY['普通外科', '骨科', '泌尿外科'], 
 true, 2),

('550e8400-e29b-41d4-a716-446655440003', '儿科', '专门为儿童提供医疗服务的科室', '3楼南区', '010-12345680', 'pediatrics@hospital.com',
 '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00", "saturday": "08:00-16:00", "sunday": "09:00-15:00"}',
 ARRAY['儿童体检', '疫苗接种', '儿童急诊'], 
 ARRAY['儿童专用设备', '疫苗冷藏设备', '儿童监护仪'], 
 ARRAY['新生儿科', '儿童呼吸科', '儿童消化科'], 
 true, 3);

-- 更新医生表，关联科室
UPDATE doctors SET department = '内科' WHERE name = '张医生';
UPDATE doctors SET department = '外科' WHERE name = '李医生';
UPDATE doctors SET department = '儿科' WHERE name = '王医生';

-- 更新科室负责人
UPDATE departments SET head_doctor_id = (SELECT id FROM doctors WHERE name = '张医生' LIMIT 1) WHERE name = '内科';
UPDATE departments SET head_doctor_id = (SELECT id FROM doctors WHERE name = '李医生' LIMIT 1) WHERE name = '外科';
UPDATE departments SET head_doctor_id = (SELECT id FROM doctors WHERE name = '王医生' LIMIT 1) WHERE name = '儿科';

-- 插入轮播图数据
INSERT INTO carousel_images (id, title, image_url, link_url, description, sort_order, is_active, target_type) VALUES
('660e8400-e29b-41d4-a716-446655440001', '专业医疗团队', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20medical%20team%20in%20modern%20hospital%20setting%20with%20doctors%20and%20nurses&image_size=landscape_16_9', '/doctors', '我们拥有经验丰富的专业医疗团队', 1, true, 'internal'),

('660e8400-e29b-41d4-a716-446655440002', '先进医疗设备', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20medical%20equipment%20and%20technology%20in%20hospital%20room&image_size=landscape_16_9', '/equipment', '配备最先进的医疗设备和技术', 2, true, 'internal'),

('660e8400-e29b-41d4-a716-446655440003', '健康商城', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=medical%20products%20and%20health%20supplements%20display%20in%20modern%20pharmacy&image_size=landscape_16_9', '/products', '优质医疗产品，守护您的健康', 3, true, 'internal');

-- 插入医疗资讯数据
INSERT INTO articles (id, title, content, summary, cover_image, author, category, tags, status, is_featured, published_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', 
 '春季养生指南：如何预防感冒', 
 '春季是感冒高发季节，气温变化大，人体免疫力容易下降。本文将为您介绍春季预防感冒的有效方法：\n\n1. 保持良好的作息习惯\n早睡早起，保证充足的睡眠时间，有助于提高免疫力。\n\n2. 合理饮食\n多吃富含维生素C的水果和蔬菜，如橙子、柠檬、菠菜等。\n\n3. 适量运动\n每天进行30分钟的有氧运动，如散步、慢跑等。\n\n4. 注意保暖\n根据天气变化及时增减衣物，避免受凉。\n\n5. 勤洗手\n保持手部卫生，避免病毒传播。', 
 '春季预防感冒的实用指南，包含作息、饮食、运动等多方面建议', 
 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=spring%20health%20care%20and%20cold%20prevention%20illustration&image_size=landscape_4_3', 
 '张医生', '健康养生', ARRAY['春季养生', '感冒预防', '健康指南'], 'published', true, now()),

('770e8400-e29b-41d4-a716-446655440002', 
 '高血压患者的日常管理', 
 '高血压是常见的慢性疾病，需要长期管理。以下是高血压患者的日常管理要点：\n\n1. 定期监测血压\n每天固定时间测量血压，记录数据变化。\n\n2. 合理用药\n按医嘱服药，不可随意停药或改变剂量。\n\n3. 控制饮食\n低盐低脂饮食，多吃蔬菜水果，控制体重。\n\n4. 适量运动\n选择适合的运动方式，如太极拳、游泳等。\n\n5. 心理调节\n保持心情愉快，避免情绪激动。', 
 '高血压患者日常管理的重要指导，帮助控制病情发展', 
 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=blood%20pressure%20monitoring%20and%20hypertension%20management&image_size=landscape_4_3', 
 '李医生', '慢性病管理', ARRAY['高血压', '慢性病', '日常管理'], 'published', false, now()),

('770e8400-e29b-41d4-a716-446655440003', 
 '儿童疫苗接种时间表', 
 '疫苗接种是预防儿童传染病的重要措施。以下是儿童疫苗接种的标准时间表：\n\n出生时：\n- 乙肝疫苗第一针\n- 卡介苗\n\n1个月：\n- 乙肝疫苗第二针\n\n2个月：\n- 脊髓灰质炎疫苗第一针\n- 百白破疫苗第一针\n\n3个月：\n- 脊髓灰质炎疫苗第二针\n- 百白破疫苗第二针\n\n4个月：\n- 脊髓灰质炎疫苗第三针\n- 百白破疫苗第三针\n\n6个月：\n- 乙肝疫苗第三针\n\n请家长按时带孩子接种疫苗，保护孩子健康成长。', 
 '详细的儿童疫苗接种时间表，帮助家长了解疫苗接种安排', 
 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=children%20vaccination%20schedule%20and%20pediatric%20healthcare&image_size=landscape_4_3', 
 '王医生', '儿童健康', ARRAY['疫苗接种', '儿童健康', '预防接种'], 'published', true, now());

-- 更新商品分类
UPDATE products SET category_name = '医疗器械' WHERE category = 1;
UPDATE products SET category_name = '保健品' WHERE category = 2;
UPDATE products SET category_name = '药品' WHERE category = 3;