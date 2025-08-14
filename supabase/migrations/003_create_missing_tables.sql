-- 创建缺失的表：departments、carousel_images、articles

-- 创建科室表
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- 科室ID
    name VARCHAR(100) NOT NULL, -- 科室名称
    description TEXT, -- 科室描述
    head_doctor_id UUID, -- 科室负责人ID
    location VARCHAR(200), -- 科室位置
    phone VARCHAR(20), -- 科室电话
    email VARCHAR(100), -- 科室邮箱
    working_hours JSONB, -- 工作时间
    services TEXT[], -- 提供的服务
    equipment TEXT[], -- 设备列表
    specialties TEXT[], -- 专业特长
    is_active BOOLEAN DEFAULT true, -- 是否激活
    sort_order INTEGER DEFAULT 0, -- 排序
    created_at TIMESTAMPTZ DEFAULT now(), -- 创建时间
    updated_at TIMESTAMPTZ DEFAULT now() -- 更新时间
);

-- 创建轮播图表
CREATE TABLE IF NOT EXISTS carousel_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- 轮播图ID
    title VARCHAR(200) NOT NULL, -- 标题
    image_url TEXT NOT NULL, -- 图片URL
    link_url TEXT, -- 跳转链接
    description TEXT, -- 描述
    sort_order INTEGER DEFAULT 0, -- 排序
    is_active BOOLEAN DEFAULT true, -- 是否激活
    start_time TIMESTAMPTZ, -- 开始时间
    end_time TIMESTAMPTZ, -- 结束时间
    click_count INTEGER DEFAULT 0, -- 点击次数
    target_type VARCHAR(50) DEFAULT 'internal', -- 链接类型：internal-内部链接, external-外部链接
    created_at TIMESTAMPTZ DEFAULT now(), -- 创建时间
    updated_at TIMESTAMPTZ DEFAULT now() -- 更新时间
);

-- 创建医疗资讯表
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- 文章ID
    title VARCHAR(200) NOT NULL, -- 标题
    content TEXT NOT NULL, -- 内容
    summary TEXT, -- 摘要
    cover_image TEXT, -- 封面图片
    author VARCHAR(100), -- 作者
    category VARCHAR(50), -- 分类
    tags TEXT[], -- 标签
    status VARCHAR(20) DEFAULT 'draft', -- 状态：draft-草稿, published-已发布, archived-已归档
    is_featured BOOLEAN DEFAULT false, -- 是否推荐
    view_count INTEGER DEFAULT 0, -- 浏览次数
    like_count INTEGER DEFAULT 0, -- 点赞次数
    share_count INTEGER DEFAULT 0, -- 分享次数
    published_at TIMESTAMPTZ, -- 发布时间
    created_at TIMESTAMPTZ DEFAULT now(), -- 创建时间
    updated_at TIMESTAMPTZ DEFAULT now() -- 更新时间
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_head_doctor ON departments(head_doctor_id);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);
CREATE INDEX IF NOT EXISTS idx_departments_sort ON departments(sort_order);

CREATE INDEX IF NOT EXISTS idx_carousel_active ON carousel_images(is_active);
CREATE INDEX IF NOT EXISTS idx_carousel_sort ON carousel_images(sort_order);
CREATE INDEX IF NOT EXISTS idx_carousel_time ON carousel_images(start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(is_featured);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at);

-- 启用行级安全策略
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- departments表策略
CREATE POLICY "Allow read access to departments" ON departments
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage departments" ON departments
    FOR ALL USING (auth.role() = 'authenticated');

-- carousel_images表策略
CREATE POLICY "Allow read access to carousel_images" ON carousel_images
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage carousel_images" ON carousel_images
    FOR ALL USING (auth.role() = 'authenticated');

-- articles表策略
CREATE POLICY "Allow read access to published articles" ON articles
    FOR SELECT USING (status = 'published' OR auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage articles" ON articles
    FOR ALL USING (auth.role() = 'authenticated');

-- 授予权限
GRANT ALL PRIVILEGES ON departments TO authenticated;
GRANT SELECT ON departments TO anon;

GRANT ALL PRIVILEGES ON carousel_images TO authenticated;
GRANT SELECT ON carousel_images TO anon;

GRANT ALL PRIVILEGES ON articles TO authenticated;
GRANT SELECT ON articles TO anon;

-- 添加外键约束（如果需要）
ALTER TABLE departments 
ADD CONSTRAINT fk_departments_head_doctor 
FOREIGN KEY (head_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL;

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carousel_images_updated_at BEFORE UPDATE ON carousel_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();