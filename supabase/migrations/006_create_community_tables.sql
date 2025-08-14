-- 创建社区管理相关表
-- 轮播图表和文章表

-- 创建轮播图表 (carousel_images)
CREATE TABLE carousel_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL, -- 轮播图标题
    image_url TEXT NOT NULL, -- 图片URL地址
    link_url TEXT, -- 点击跳转链接
    sort_order INTEGER DEFAULT 0, -- 排序顺序，数字越小越靠前
    is_active BOOLEAN DEFAULT true, -- 是否启用显示
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- 更新时间
);

-- 创建轮播图表索引
CREATE INDEX idx_carousel_images_sort_order ON carousel_images(sort_order);
CREATE INDEX idx_carousel_images_is_active ON carousel_images(is_active);
CREATE INDEX idx_carousel_images_created_at ON carousel_images(created_at DESC);

-- 创建文章表 (articles)
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL, -- 文章标题
    content TEXT NOT NULL, -- 文章内容（HTML格式）
    summary TEXT, -- 文章摘要
    category VARCHAR(100), -- 文章分类
    cover_image TEXT, -- 封面图片URL
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')), -- 发布状态：草稿/已发布/已归档
    publish_time TIMESTAMP WITH TIME ZONE, -- 发布时间
    author_id UUID REFERENCES users(id), -- 作者ID，关联用户表
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- 更新时间
);

-- 创建文章表索引
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_publish_time ON articles(publish_time DESC);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);

-- 设置轮播图表RLS权限
GRANT SELECT ON carousel_images TO anon;
GRANT ALL PRIVILEGES ON carousel_images TO authenticated;

-- 设置文章表RLS权限
GRANT SELECT ON articles TO anon;
GRANT ALL PRIVILEGES ON articles TO authenticated;

-- 插入轮播图初始数据
INSERT INTO carousel_images (title, image_url, link_url, sort_order, is_active) VALUES
('医院首页轮播图1', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20hospital%20building%20exterior%20view%20professional%20medical%20center&image_size=landscape_16_9', '/about', 1, true),
('医院首页轮播图2', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=medical%20equipment%20advanced%20technology%20healthcare%20facility&image_size=landscape_16_9', '/services', 2, true),
('医院首页轮播图3', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=doctors%20team%20professional%20medical%20staff%20healthcare%20workers&image_size=landscape_16_9', '/doctors', 3, true);

-- 插入文章初始数据
INSERT INTO articles (title, content, summary, category, status, author_id, publish_time) VALUES
('医院新闻：引进先进医疗设备', '<h2>医院引进最新医疗设备</h2><p>我院近期引进了一批先进的医疗设备，包括高端CT扫描仪、核磁共振设备等，大大提升了医疗诊断的准确性和效率。</p><p>这些设备的引进标志着我院在医疗技术方面又迈上了一个新台阶，为患者提供更加精准、高效的医疗服务。</p>', '医院引进新设备，提升医疗服务质量', '医院新闻', 'published', (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1), NOW()),
('健康科普：冬季预防感冒小贴士', '<h2>冬季如何预防感冒</h2><p>冬季是感冒高发季节，以下是一些预防感冒的实用建议：</p><ul><li>保持室内空气流通</li><li>勤洗手，避免用手触摸面部</li><li>适当运动，增强免疫力</li><li>保证充足睡眠</li><li>多喝温水，保持身体水分</li></ul><p>如有感冒症状，请及时就医。</p>', '冬季预防感冒的实用建议和健康贴士', '健康科普', 'published', (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1), NOW()),
('医院公告：春节期间门诊安排', '<h2>春节期间门诊时间调整</h2><p>根据国家法定节假日安排，我院春节期间门诊时间将有所调整：</p><ul><li>除夕至初三：急诊科24小时值班</li><li>初四至初六：上午半天门诊</li><li>初七起：恢复正常门诊时间</li></ul><p>如有紧急情况，请拨打急诊电话：120</p>', '春节期间医院门诊时间安排通知', '医院公告', 'published', (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1), NOW());

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为轮播图表创建更新时间触发器
CREATE TRIGGER update_carousel_images_updated_at
    BEFORE UPDATE ON carousel_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为文章表创建更新时间触发器
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();