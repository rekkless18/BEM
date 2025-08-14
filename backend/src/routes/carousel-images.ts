/**
 * 轮播图管理API路由
 * 提供轮播图的CRUD操作接口
 */

import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { authenticateToken as auth } from '../middleware/auth';
import {
  CarouselImage,
  CreateCarouselImageRequest,
  UpdateCarouselImageRequest,
  CarouselImageQueryParams,
  ApiResponse,
  PaginatedResponse,
  TABLE_NAMES
} from '../types'

const router = Router()

/**
 * 获取轮播图列表
 * GET /api/carousel-images
 * 支持分页、筛选和搜索
 */
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'all',
      target_type,
      search
    } = req.query as CarouselImageQueryParams

    // 构建查询条件
    let query = supabase
      .from(TABLE_NAMES.CAROUSEL_IMAGES)
      .select('*', { count: 'exact' })

    // 状态筛选
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    // 目标类型筛选
    if (target_type) {
      query = query.eq('target_type', target_type)
    }

    // 标题搜索
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    // 分页和排序
    const offset = (Number(page) - 1) * Number(limit)
    query = query
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('获取轮播图列表失败:', error)
      return res.status(500).json({
        success: false,
        message: '获取轮播图列表失败',
        error: error.message
      } as ApiResponse)
    }

    // 返回分页数据
    const totalPages = Math.ceil((count || 0) / Number(limit))
    res.json({
      success: true,
      data: data || [],
      total: count || 0,
      page: Number(page),
      limit: Number(limit),
      totalPages
    } as PaginatedResponse<CarouselImage>)

  } catch (error) {
    console.error('获取轮播图列表异常:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse)
  }
})

/**
 * 根据ID获取单个轮播图
 * GET /api/carousel-images/:id
 */
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from(TABLE_NAMES.CAROUSEL_IMAGES)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('获取轮播图详情失败:', error)
      return res.status(404).json({
        success: false,
        message: '轮播图不存在',
        error: error.message
      } as ApiResponse)
    }

    res.json({
      success: true,
      data,
      message: '获取轮播图详情成功'
    } as ApiResponse<CarouselImage>)

  } catch (error) {
    console.error('获取轮播图详情异常:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse)
  }
})

/**
 * 创建新轮播图
 * POST /api/carousel-images
 */
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const requestData = req.body as CreateCarouselImageRequest

    // 验证必填字段
    if (!requestData.title || !requestData.image_url) {
      return res.status(400).json({
        success: false,
        message: '标题和图片URL为必填项'
      } as ApiResponse)
    }

    // 构建插入数据
    const insertData = {
      title: requestData.title,
      image_url: requestData.image_url,
      link_url: requestData.link_url || null,
      target_type: requestData.target_type || 'home',
      sort_order: requestData.sort_order || 0,
      is_active: requestData.is_active !== undefined ? requestData.is_active : true,
      start_time: requestData.start_time || null,
      end_time: requestData.end_time || null,
      description: requestData.description || null,
      click_count: 0
    }

    const { data, error } = await supabase
      .from(TABLE_NAMES.CAROUSEL_IMAGES)
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('创建轮播图失败:', error)
      return res.status(500).json({
        success: false,
        message: '创建轮播图失败',
        error: error.message
      } as ApiResponse)
    }

    res.status(201).json({
      success: true,
      data,
      message: '轮播图创建成功'
    } as ApiResponse<CarouselImage>)

  } catch (error) {
    console.error('创建轮播图异常:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse)
  }
})

/**
 * 更新轮播图
 * PUT /api/carousel-images/:id
 */
router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const requestData = req.body as UpdateCarouselImageRequest

    // 构建更新数据（只更新提供的字段）
    const updateData: Partial<CarouselImage> = {}
    
    if (requestData.title !== undefined) updateData.title = requestData.title
    if (requestData.image_url !== undefined) updateData.image_url = requestData.image_url
    if (requestData.link_url !== undefined) updateData.link_url = requestData.link_url
    if (requestData.target_type !== undefined) updateData.target_type = requestData.target_type
    if (requestData.sort_order !== undefined) updateData.sort_order = requestData.sort_order
    if (requestData.is_active !== undefined) updateData.is_active = requestData.is_active
    if (requestData.start_time !== undefined) updateData.start_time = requestData.start_time
    if (requestData.end_time !== undefined) updateData.end_time = requestData.end_time
    if (requestData.description !== undefined) updateData.description = requestData.description

    const { data, error } = await supabase
      .from(TABLE_NAMES.CAROUSEL_IMAGES)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('更新轮播图失败:', error)
      return res.status(500).json({
        success: false,
        message: '更新轮播图失败',
        error: error.message
      } as ApiResponse)
    }

    res.json({
      success: true,
      data,
      message: '轮播图更新成功'
    } as ApiResponse<CarouselImage>)

  } catch (error) {
    console.error('更新轮播图异常:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse)
  }
})

/**
 * 删除轮播图
 * DELETE /api/carousel-images/:id
 */
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from(TABLE_NAMES.CAROUSEL_IMAGES)
      .delete()
      .eq('id', id)

    if (error) {
      console.error('删除轮播图失败:', error)
      return res.status(500).json({
        success: false,
        message: '删除轮播图失败',
        error: error.message
      } as ApiResponse)
    }

    res.json({
      success: true,
      message: '轮播图删除成功'
    } as ApiResponse)

  } catch (error) {
    console.error('删除轮播图异常:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse)
  }
})

/**
 * 批量删除轮播图
 * DELETE /api/carousel-images
 */
router.delete('/', auth, async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: string[] }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的轮播图ID列表'
      } as ApiResponse)
    }

    const { error } = await supabase
      .from(TABLE_NAMES.CAROUSEL_IMAGES)
      .delete()
      .in('id', ids)

    if (error) {
      console.error('批量删除轮播图失败:', error)
      return res.status(500).json({
        success: false,
        message: '批量删除轮播图失败',
        error: error.message
      } as ApiResponse)
    }

    res.json({
      success: true,
      message: `成功删除 ${ids.length} 个轮播图`
    } as ApiResponse)

  } catch (error) {
    console.error('批量删除轮播图异常:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse)
  }
})

/**
 * 更新轮播图点击次数
 * POST /api/carousel-images/:id/click
 */
router.post('/:id/click', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 增加点击次数
    const { data, error } = await supabase
      .rpc('increment_carousel_click', { carousel_id: id })

    if (error) {
      console.error('更新点击次数失败:', error)
      // 如果RPC函数不存在，使用普通更新方式
      const { data: currentData, error: fetchError } = await supabase
        .from(TABLE_NAMES.CAROUSEL_IMAGES)
        .select('click_count')
        .eq('id', id)
        .single()

      if (fetchError) {
        return res.status(404).json({
          success: false,
          message: '轮播图不存在'
        } as ApiResponse)
      }

      const { error: updateError } = await supabase
        .from(TABLE_NAMES.CAROUSEL_IMAGES)
        .update({ click_count: (currentData.click_count || 0) + 1 })
        .eq('id', id)

      if (updateError) {
        return res.status(500).json({
          success: false,
          message: '更新点击次数失败',
          error: updateError.message
        } as ApiResponse)
      }
    }

    res.json({
      success: true,
      message: '点击次数更新成功'
    } as ApiResponse)

  } catch (error) {
    console.error('更新点击次数异常:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse)
  }
})

export default router