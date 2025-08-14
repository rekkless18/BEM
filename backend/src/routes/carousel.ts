import { Router } from 'express';
import { supabase } from '../utils/supabase';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { ApiResponse, Banner } from '../types';

const router = Router();

// 获取轮播图列表
router.get('/', authenticateToken, async (req, res): Promise<any> => {
  try {
    const { is_active } = req.query;

    let query = supabase
      .from('carousel_images')
      .select('*')
      .order('sort_order', { ascending: true });

    // 筛选激活状态
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: '获取轮播图列表失败',
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '获取轮播图列表成功',
      data
    } as ApiResponse<any[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 根据ID获取轮播图详情
router.get('/:id', authenticateToken, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('carousel_images')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: '轮播图不存在',
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '获取轮播图详情成功',
      data
    } as ApiResponse<Banner>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 创建新轮播图（仅管理员）
router.post('/', requireAdmin, async (req, res): Promise<any> => {
  try {
    const {
      title,
      image_url,
      link_url,
      description,
      sort_order,
      is_active,
      target_type,
      start_time,
      end_time
    } = req.body;

    // 验证必填字段
    if (!title || !image_url) {
      return res.status(400).json({
        success: false,
        message: '标题和图片URL为必填项'
      } as ApiResponse<null>);
    }

    const { data, error } = await supabase
      .from('carousel_images')
      .insert({
        title,
        image_url,
        link_url,
        description,
        sort_order: sort_order || 999,
        is_active: is_active !== false,
        target_type: target_type || 'internal',
        start_time,
        end_time
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: '创建轮播图失败',
        error: error.message
      } as ApiResponse<null>);
    }

    res.status(201).json({
      success: true,
      message: '创建轮播图成功',
      data
    } as ApiResponse<Banner>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 更新轮播图信息（仅管理员）
router.put('/:id', requireAdmin, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.id; // 防止更新ID字段
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('carousel_images')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: '更新轮播图失败',
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '更新轮播图成功',
      data
    } as ApiResponse<Banner>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 删除轮播图（仅管理员）
router.delete('/:id', requireAdmin, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('carousel_images')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: '删除轮播图失败',
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '删除轮播图成功',
      data
    } as ApiResponse<Banner>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 更新轮播图状态
router.patch('/:id/status', requireAdmin, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const { data, error } = await supabase
      .from('carousel_images')
      .update({ 
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: '更新轮播图状态失败',
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '更新轮播图状态成功',
      data
    } as ApiResponse<Banner>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 更新轮播图排序（仅管理员）
router.patch('/sort', requireAdmin, async (req, res): Promise<any> => {
  try {
    const { carousels } = req.body; // [{ id, sort_order }]

    if (!Array.isArray(carousels)) {
      return res.status(400).json({
        success: false,
        message: '参数格式错误'
      } as ApiResponse<null>);
    }

    // 批量更新排序
    const updatePromises = carousels.map(carousel => 
      supabase
        .from('carousel_images')
        .update({ 
          sort_order: carousel.sort_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', carousel.id)
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: '更新排序成功'
    } as ApiResponse<null>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 获取有效的轮播图（前端展示用）
router.get('/public/active', async (req, res): Promise<any> => {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('carousel_images')
      .select('id, title, image_url, link_url, description, target_type')
      .eq('is_active', true)
      .or(`start_time.is.null,start_time.lte.${now}`)
      .or(`end_time.is.null,end_time.gte.${now}`)
      .order('sort_order', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: '获取轮播图失败',
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '获取轮播图成功',
      data
    } as ApiResponse<any[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

export default router;