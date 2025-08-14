/**
 * 文章管理路由
 * 提供文章的CRUD操作接口
 */

import express, { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken as auth } from '../middleware/auth';
import {
  Article,
  CreateArticleRequest,
  UpdateArticleRequest,
  ArticleQueryParams,
  PaginatedResponse,
  ApiResponse,
  TABLE_NAMES
} from '../types';

const router = express.Router();

/**
 * 获取文章列表
 * GET /api/community/articles
 */
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      category,
      author,
      is_featured,
      start_date,
      end_date,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query as ArticleQueryParams;

    // 构建查询
    let query = supabase
      .from(TABLE_NAMES.ARTICLES)
      .select('*', { count: 'exact' });

    // 搜索条件
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,summary.ilike.%${search}%`);
    }

    // 状态筛选
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // 分类筛选
    if (category) {
      query = query.eq('category', category);
    }

    // 作者筛选
    if (author) {
      query = query.eq('author', author);
    }

    // 推荐筛选
    if (is_featured !== undefined) {
      query = query.eq('is_featured', is_featured === 'true');
    }

    // 时间范围筛选
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    // 排序
    const validSortFields = ['created_at', 'updated_at', 'published_at', 'view_count', 'like_count', 'title'];
    const sortField = validSortFields.includes(sort_by as string) ? sort_by as string : 'created_at';
    const sortDirection = sort_order === 'asc' ? true : false;
    
    query = query.order(sortField, { ascending: sortDirection });

    // 分页
    const pageNum = Math.max(1, Number(page));
    const pageSize = Math.min(100, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * pageSize;
    
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('获取文章列表失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取文章列表失败',
        error: error.message
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: data || [],
      total: count || 0,
      page: pageNum,
      limit: pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      message: '获取文章列表成功'
    } as PaginatedResponse<Article>);

  } catch (error) {
    console.error('获取文章列表异常:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse);
  }
});

/**
 * 根据ID获取单个文章
 * GET /api/community/articles/:id
 */
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from(TABLE_NAMES.ARTICLES)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取文章详情失败:', error);
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data,
      message: '获取文章详情成功'
    } as ApiResponse<Article>);

  } catch (error) {
    console.error('获取文章详情异常:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse);
  }
});

/**
 * 创建文章
 * POST /api/community/articles
 */
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const requestData = req.body as CreateArticleRequest;

    // 验证必填字段
    if (!requestData.title || !requestData.content || !requestData.summary || !requestData.author) {
      return res.status(400).json({
        success: false,
        message: '标题、内容、摘要和作者为必填字段'
      } as ApiResponse);
    }

    // 构建插入数据
    const insertData: Partial<Article> = {
      title: requestData.title,
      content: requestData.content,
      summary: requestData.summary,
      category: requestData.category || 'health',
      cover_image: requestData.cover_image || '',
      author: requestData.author,
      tags: requestData.tags || [],
      status: requestData.status || 'draft',
      is_featured: requestData.is_featured || false,
      view_count: 0,
      like_count: 0,
      share_count: 0
    };

    // 如果状态为已发布，设置发布时间
    if (requestData.status === 'published') {
      insertData.published_at = requestData.published_at || new Date().toISOString();
    }

    const { data, error } = await supabase
      .from(TABLE_NAMES.ARTICLES)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('创建文章失败:', error);
      return res.status(500).json({
        success: false,
        message: '创建文章失败',
        error: error.message
      } as ApiResponse);
    }

    res.status(201).json({
      success: true,
      data,
      message: '文章创建成功'
    } as ApiResponse<Article>);

  } catch (error) {
    console.error('创建文章异常:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse);
  }
});

/**
 * 更新文章
 * PUT /api/community/articles/:id
 */
router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requestData = req.body as UpdateArticleRequest;

    // 构建更新数据（只更新提供的字段）
    const updateData: Partial<Article> = {};
    
    if (requestData.title !== undefined) updateData.title = requestData.title;
    if (requestData.content !== undefined) updateData.content = requestData.content;
    if (requestData.summary !== undefined) updateData.summary = requestData.summary;
    if (requestData.category !== undefined) updateData.category = requestData.category;
    if (requestData.cover_image !== undefined) updateData.cover_image = requestData.cover_image;
    if (requestData.author !== undefined) updateData.author = requestData.author;
    if (requestData.tags !== undefined) updateData.tags = requestData.tags;
    if (requestData.is_featured !== undefined) updateData.is_featured = requestData.is_featured;
    
    // 状态更新逻辑
    if (requestData.status !== undefined) {
      updateData.status = requestData.status;
      
      // 如果状态改为已发布，设置发布时间
      if (requestData.status === 'published' && !requestData.published_at) {
        updateData.published_at = new Date().toISOString();
      } else if (requestData.published_at !== undefined) {
        updateData.published_at = requestData.published_at;
      }
    }

    const { data, error } = await supabase
      .from(TABLE_NAMES.ARTICLES)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新文章失败:', error);
      return res.status(500).json({
        success: false,
        message: '更新文章失败',
        error: error.message
      } as ApiResponse);
    }

    res.json({
      success: true,
      data,
      message: '文章更新成功'
    } as ApiResponse<Article>);

  } catch (error) {
    console.error('更新文章异常:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse);
  }
});

/**
 * 删除文章
 * DELETE /api/community/articles/:id
 */
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from(TABLE_NAMES.ARTICLES)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除文章失败:', error);
      return res.status(500).json({
        success: false,
        message: '删除文章失败',
        error: error.message
      } as ApiResponse);
    }

    res.json({
      success: true,
      message: '文章删除成功'
    } as ApiResponse);

  } catch (error) {
    console.error('删除文章异常:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse);
  }
});

/**
 * 批量删除文章
 * DELETE /api/community/articles
 */
router.delete('/', auth, async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的文章ID列表'
      } as ApiResponse);
    }

    const { error } = await supabase
      .from(TABLE_NAMES.ARTICLES)
      .delete()
      .in('id', ids);

    if (error) {
      console.error('批量删除文章失败:', error);
      return res.status(500).json({
        success: false,
        message: '批量删除文章失败',
        error: error.message
      } as ApiResponse);
    }

    res.json({
      success: true,
      message: `成功删除 ${ids.length} 篇文章`
    } as ApiResponse);

  } catch (error) {
    console.error('批量删除文章异常:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse);
  }
});

/**
 * 增加文章浏览次数
 * POST /api/community/articles/:id/view
 */
router.post('/:id/view', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 增加浏览次数
    const { data: currentData, error: fetchError } = await supabase
      .from(TABLE_NAMES.ARTICLES)
      .select('view_count')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      } as ApiResponse);
    }

    const { error: updateError } = await supabase
      .from(TABLE_NAMES.ARTICLES)
      .update({ view_count: (currentData.view_count || 0) + 1 })
      .eq('id', id);

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: '更新浏览次数失败',
        error: updateError.message
      } as ApiResponse);
    }

    res.json({
      success: true,
      message: '浏览次数更新成功'
    } as ApiResponse);

  } catch (error) {
    console.error('更新浏览次数异常:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse);
  }
});

/**
 * 增加文章点赞次数
 * POST /api/community/articles/:id/like
 */
router.post('/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 增加点赞次数
    const { data: currentData, error: fetchError } = await supabase
      .from(TABLE_NAMES.ARTICLES)
      .select('like_count')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      } as ApiResponse);
    }

    const { error: updateError } = await supabase
      .from(TABLE_NAMES.ARTICLES)
      .update({ like_count: (currentData.like_count || 0) + 1 })
      .eq('id', id);

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: '更新点赞次数失败',
        error: updateError.message
      } as ApiResponse);
    }

    res.json({
      success: true,
      message: '点赞成功'
    } as ApiResponse);

  } catch (error) {
    console.error('更新点赞次数异常:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse);
  }
});

/**
 * 增加文章分享次数
 * POST /api/community/articles/:id/share
 */
router.post('/:id/share', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 增加分享次数
    const { data: currentData, error: fetchError } = await supabase
      .from(TABLE_NAMES.ARTICLES)
      .select('share_count')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      } as ApiResponse);
    }

    const { error: updateError } = await supabase
      .from(TABLE_NAMES.ARTICLES)
      .update({ share_count: (currentData.share_count || 0) + 1 })
      .eq('id', id);

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: '更新分享次数失败',
        error: updateError.message
      } as ApiResponse);
    }

    res.json({
      success: true,
      message: '分享次数更新成功'
    } as ApiResponse);

  } catch (error) {
    console.error('更新分享次数异常:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse);
  }
});

export default router;