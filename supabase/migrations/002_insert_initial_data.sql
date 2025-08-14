-- BEM后台管理系统初始数据插入脚本
-- 创建时间: 2024-01-20

-- 插入科室数据
INSERT INTO departments (name, description) VALUES
('内科', '内科疾病诊疗，包括心血管、呼吸、消化等系统疾病'),
('外科', '外科手术治疗，包括普外、骨科、泌尿等专业'),
('儿科', '儿童疾病诊疗，专注0-18岁儿童健康'),
('妇产科', '妇科和产科疾病诊疗，女性健康专业科室'),
('眼科', '眼部疾病诊疗，视力保健专业科室')
ON CONFLICT (name) DO NOTHING;

-- 插入医生数据
INSERT INTO doctors (name, title, department_id, avatar, rating, work_time, specialties, experience_years) VALUES
('张主任', '主任医师', 1, 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20doctor%20portrait%20male%20middle%20aged%20white%20coat&image_size=square', 4.8, 
 '["09:00-12:00", "14:00-17:00"]'::jsonb, '["心血管疾病", "高血压", "糖尿病"]'::jsonb, 15),
('李医生', '副主任医师', 1, 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20doctor%20portrait%20white%20coat%20stethoscope&image_size=square', 4.6, 
 '["08:30-12:00", "13:30-17:30"]'::jsonb, '["呼吸系统疾病", "肺炎", "哮喘"]'::jsonb, 12),
('王教授', '主任医师', 2, 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=senior%20surgeon%20male%20doctor%20experienced%20white%20coat&image_size=square', 4.9, 
 '["07:30-12:00", "14:00-18:00"]'::jsonb, '["普外科手术", "腹腔镜", "肿瘤切除"]'::jsonb, 20),
('陈医生', '主治医师', 3, 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=pediatrician%20female%20doctor%20kind%20smile%20children%20hospital&image_size=square', 4.7, 
 '["08:00-12:00", "14:30-17:30"]'::jsonb, '["儿童常见病", "疫苗接种", "生长发育"]'::jsonb, 8),
('刘主任', '主任医师', 4, 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=gynecologist%20female%20doctor%20professional%20medical%20white%20coat&image_size=square', 4.8, 
 '["09:00-12:00", "13:00-17:00"]'::jsonb, '["妇科疾病", "产前检查", "不孕不育"]'::jsonb, 18)
ON CONFLICT (name, department_id) DO NOTHING;

-- 插入商品数据
INSERT INTO products (name, description, price, image_url, stock, min_stock, category_id) VALUES
('血压计', '家用电子血压计，准确测量血压值', 299.00, 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=digital%20blood%20pressure%20monitor%20medical%20device%20white%20background&image_size=square', 50, 10, 1),
('体温计', '红外线额温枪，快速测量体温', 89.00, 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=infrared%20thermometer%20medical%20device%20white%20background&image_size=square', 100, 20, 1),
('维生素C片', '增强免疫力，每瓶100片', 45.00, 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=vitamin%20C%20tablets%20bottle%20health%20supplement&image_size=square', 200, 50, 2),
('医用口罩', '一次性医用外科口罩，50只装', 25.00, 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=medical%20surgical%20masks%20box%20blue%20white&image_size=square', 500, 100, 3),
('护理垫', '成人护理垫，吸水透气', 68.00, 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=adult%20care%20pads%20medical%20hygiene%20product&image_size=square', 80, 15, 3)
ON CONFLICT (name) DO NOTHING;

-- 插入轮播图数据
INSERT INTO carousel_images (title, image_url, link_url, sort_order) VALUES
('健康体检优惠活动', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=health%20checkup%20promotion%20banner%20medical%20clinic%20blue%20theme&image_size=landscape_16_9', '/medical/checkup', 1),
('在线问诊服务', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=online%20consultation%20banner%20doctor%20patient%20video%20call&image_size=landscape_16_9', '/medical/consultation', 2),
('医疗器械促销', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=medical%20equipment%20sale%20banner%20healthcare%20devices&image_size=landscape_16_9', '/mall/devices', 3),
('专家义诊活动', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=expert%20medical%20consultation%20banner%20professional%20doctors&image_size=landscape_16_9', '/medical/experts', 4)
ON CONFLICT (title) DO NOTHING;

-- 插入医疗资讯数据
INSERT INTO articles (title, content, author, is_published, published_at, cover_image) VALUES
('春季养生小贴士', '春季是养生的好时节，万物复苏，人体新陈代谢也开始旺盛。在这个季节，我们应该注意以下几个方面：\n\n1. 饮食调理：多吃新鲜蔬菜水果，少吃油腻食物\n2. 运动锻炼：适当增加户外活动，但要避免过度疲劳\n3. 作息规律：保证充足睡眠，早睡早起\n4. 情绪调节：保持心情愉悦，避免情绪波动', '健康专家', TRUE, NOW(), 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=spring%20health%20tips%20fresh%20vegetables%20exercise%20wellness&image_size=landscape_4_3'),
('高血压患者饮食指南', '高血压患者在饮食方面需要特别注意，合理的饮食可以有效控制血压：\n\n1. 低盐饮食：每日盐摄入量不超过6克\n2. 多吃富含钾的食物：如香蕉、橙子、菠菜等\n3. 控制脂肪摄入：选择瘦肉，避免油炸食品\n4. 增加膳食纤维：多吃全谷物、豆类\n5. 限制酒精：男性每日不超过25克，女性不超过15克', '营养师', TRUE, NOW(), 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=hypertension%20diet%20healthy%20food%20low%20sodium%20vegetables&image_size=landscape_4_3'),
('儿童疫苗接种时间表', '儿童疫苗接种是预防传染病的重要措施，家长应按时带孩子接种：\n\n出生时：乙肝疫苗、卡介苗\n2月龄：脊灰疫苗、百白破疫苗\n4月龄：脊灰疫苗、百白破疫苗\n6月龄：乙肝疫苗、百白破疫苗\n8月龄：麻疹疫苗\n18月龄：百白破疫苗、麻腮风疫苗\n\n请家长严格按照接种时间表执行，确保孩子健康成长。', '儿科医生', TRUE, NOW(), 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=children%20vaccination%20schedule%20pediatric%20healthcare%20syringe&image_size=landscape_4_3')
ON CONFLICT (title) DO NOTHING;

-- 更新科室负责人
UPDATE departments SET head_doctor_id = 1 WHERE name = '内科';
UPDATE departments SET head_doctor_id = 3 WHERE name = '外科';
UPDATE departments SET head_doctor_id = 4 WHERE name = '儿科';
UPDATE departments SET head_doctor_id = 5 WHERE name = '妇产科';