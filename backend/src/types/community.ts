/**
 * 社区管理模块类型定义
 * 包含轮播图和文章相关的接口定义
 */

// 轮播图接口定义
export interface CarouselImage {
  id: string; // 轮播图唯一标识
  title: string; // 轮播图标题
  image_url: string; // 图片URL地址
  link_url?: string; // 点击跳转链接（可选）
  target_type?: string; // 目标类型（home/mall等）
  sort_order: number; // 排序顺序，数字越小越靠前
  is_active: boolean; // 是否启用显示
  start_time?: string; // 开始展示时间（可选）
  end_time?: string; // 结束展示时间（可选）
  click_count: number; // 点击次数统计
  description?: string; // 轮播图描述（可选）
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
}

// 创建轮播图请求接口
export interface CreateCarouselImageRequest {
  title: string; // 轮播图标题（必填）
  image_url: string; // 图片URL地址（必填）
  link_url?: string; // 点击跳转链接（可选）
  target_type?: string; // 目标类型（可选，默认home）
  sort_order?: number; // 排序顺序（可选，默认0）
  is_active?: boolean; // 是否启用（可选，默认true）
  start_time?: string; // 开始展示时间（可选）
  end_time?: string; // 结束展示时间（可选）
  description?: string; // 轮播图描述（可选）
}

// 更新轮播图请求接口
export interface UpdateCarouselImageRequest {
  title?: string; // 轮播图标题（可选）
  image_url?: string; // 图片URL地址（可选）
  link_url?: string; // 点击跳转链接（可选）
  target_type?: string; // 目标类型（可选）
  sort_order?: number; // 排序顺序（可选）
  is_active?: boolean; // 是否启用（可选）
  start_time?: string; // 开始展示时间（可选）
  end_time?: string; // 结束展示时间（可选）
  description?: string; // 轮播图描述（可选）
}

// 文章接口定义
export interface Article {
  id: string; // 文章唯一标识
  title: string; // 文章标题
  content: string; // 文章内容（HTML格式）
  summary?: string; // 文章摘要（可选）
  category?: string; // 文章分类（可选）
  cover_image?: string; // 封面图片URL（可选）
  author?: string; // 作者名称
  tags?: string[]; // 文章标签数组
  status: 'draft' | 'published' | 'archived'; // 发布状态：草稿/已发布/已归档
  is_featured: boolean; // 是否为推荐文章
  view_count: number; // 浏览次数统计
  like_count: number; // 点赞次数统计
  share_count: number; // 分享次数统计
  published_at?: string; // 发布时间（可选）
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
}

// 创建文章请求接口
export interface CreateArticleRequest {
  title: string; // 文章标题（必填）
  content: string; // 文章内容（必填）
  summary?: string; // 文章摘要（可选）
  category?: string; // 文章分类（可选）
  cover_image?: string; // 封面图片URL（可选）
  author?: string; // 作者名称（可选）
  tags?: string[]; // 文章标签（可选）
  status?: 'draft' | 'published' | 'archived'; // 发布状态（可选，默认draft）
  is_featured?: boolean; // 是否推荐（可选，默认false）
  published_at?: string; // 发布时间（可选）
}

// 更新文章请求接口
export interface UpdateArticleRequest {
  title?: string; // 文章标题（可选）
  content?: string; // 文章内容（可选）
  summary?: string; // 文章摘要（可选）
  category?: string; // 文章分类（可选）
  cover_image?: string; // 封面图片URL（可选）
  author?: string; // 作者名称（可选）
  tags?: string[]; // 文章标签（可选）
  status?: 'draft' | 'published' | 'archived'; // 发布状态（可选）
  is_featured?: boolean; // 是否推荐（可选）
  published_at?: string; // 发布时间（可选）
}

// 分页查询参数接口
export interface PaginationParams {
  page?: number; // 页码（可选，默认1）
  limit?: number; // 每页数量（可选，默认10）
}

// 轮播图查询参数接口
export interface CarouselImageQueryParams extends PaginationParams {
  status?: 'active' | 'inactive' | 'all'; // 状态筛选（可选）
  target_type?: string; // 目标类型筛选（可选）
  search?: string; // 标题搜索关键词（可选）
}

// 文章查询参数接口
export interface ArticleQueryParams extends PaginationParams {
  status?: 'published' | 'draft' | 'archived' | 'all'; // 状态筛选（可选）
  category?: string; // 分类筛选（可选）
  author?: string; // 作者筛选（可选）
  is_featured?: boolean; // 是否推荐筛选（可选）
  search?: string; // 标题搜索关键词（可选）
  start_date?: string; // 开始日期筛选（可选）
  end_date?: string; // 结束日期筛选（可选）
}

// API响应接口
export interface ApiResponse<T> {
  success: boolean; // 请求是否成功
  data?: T; // 响应数据（可选）
  message?: string; // 响应消息（可选）
  error?: string; // 错误信息（可选）
}

// 分页响应接口
export interface PaginatedResponse<T> {
  success: boolean; // 请求是否成功
  data: T[]; // 数据列表
  total: number; // 总数量
  page: number; // 当前页码
  limit: number; // 每页数量
  totalPages: number; // 总页数
}

// 文件上传响应接口
export interface UploadResponse {
  success: boolean; // 上传是否成功
  url?: string; // 文件访问URL（成功时返回）
  filename?: string; // 文件名（成功时返回）
  size?: number; // 文件大小（成功时返回）
  error?: string; // 错误信息（失败时返回）
}