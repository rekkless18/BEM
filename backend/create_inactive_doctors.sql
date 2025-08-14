-- 创建离职状态的医生测试数据
-- 插入几条is_active=false的医生记录用于测试状态筛选功能

INSERT INTO doctors (
  id,
  name,
  title,
  department,
  experience_years,
  specialties,
  consultation_fee,
  is_active,
  introduction,
  avatar,
  hospital,
  rating,
  response_time,
  good_rate,
  work_time,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  '王离职',
  '主治医师',
  '内科',
  8,
  ARRAY['心血管疾病', '高血压'],
  150.00,
  false, -- 离职状态
  '原内科主治医师，专长心血管疾病诊治，现已离职。',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20doctor%20portrait%20male%20asian%20medical%20uniform&image_size=square',
  '市人民医院',
  4.2,
  '2小时内',
  0.88,
  ARRAY['周一-周五 9:00-17:00'],
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '李退休',
  '副主任医师',
  '外科',
  15,
  ARRAY['普外科', '腹腔镜手术'],
  200.00,
  false, -- 离职状态
  '资深外科医师，擅长腹腔镜微创手术，现已退休。',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=senior%20doctor%20portrait%20female%20asian%20medical%20uniform&image_size=square',
  '市人民医院',
  4.5,
  '1小时内',
  0.92,
  ARRAY['周一-周三 8:00-12:00'],
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '张调离',
  '住院医师',
  '儿科',
  3,
  ARRAY['儿童常见病', '新生儿护理'],
  80.00,
  false, -- 离职状态
  '儿科住院医师，专注儿童健康，现已调离本院。',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=young%20doctor%20portrait%20male%20asian%20medical%20uniform&image_size=square',
  '市人民医院',
  3.8,
  '3小时内',
  0.85,
  ARRAY['周一-周日 24小时'],
  NOW(),
  NOW()
);

-- 验证插入的数据
SELECT id, name, title, department, is_active 
FROM doctors 
WHERE is_active = false 
ORDER BY name;