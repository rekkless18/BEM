import { Router } from 'express';
import { supabase } from '../utils/supabase';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { ApiResponse, Product, PaginationParams } from '../types';

const router = Router();

// 获取商品列表（支持分页和筛选）
router.get('/', authenticateToken, async (req, res): Promise<any> => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      category_name,
      status,
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query as any;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    // 筛选条件
    if (category) {
      query = query.eq('category', Number(category));
    }
    if (category_name) {
      query = query.eq('category_name', category_name);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,brand.ilike.%${search}%`);
    }

    // 排序
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // 分页
    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: '获取商品列表失败',
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '获取商品列表成功',
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    } as ApiResponse<Product[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 根据ID获取商品详情
router.get('/:id', authenticateToken, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: '商品不存在',
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '获取商品详情成功',
      data
    } as ApiResponse<Product>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 创建新商品（仅管理员）
router.post('/', requireAdmin, async (req, res): Promise<any> => {
  try {
    const {
      name,
      description,
      price,
      original_price,
      category,
      category_name,
      brand,
      model,
      specifications,
      images,
      stock_quantity,
      min_stock_level,
      status,
      tags,
      weight,
      dimensions,
      manufacturer,
      production_date,
      expiry_date,
      usage_instructions,
      precautions,
      storage_conditions
    } = req.body;

    // 验证必填字段
    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: '商品名称、价格和分类为必填项'
      } as ApiResponse<null>);
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        description,
        price: Number(price),
        original_price: original_price ? Number(original_price) : null,
        category: Number(category),
        category_name,
        brand,
        model,
        specifications: specifications || {},
        images: images || [],
        stock_quantity: Number(stock_quantity) || 0,
        min_stock_level: Number(min_stock_level) || 0,
        status: status || 'active',
        tags: tags || [],
        weight,
        dimensions,
        manufacturer,
        production_date,
        expiry_date,
        usage_instructions,
        precautions,
        storage_conditions
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: '创建商品失败',
        error: error.message
      } as ApiResponse<null>);
    }

    res.status(201).json({
      success: true,
      message: '创建商品成功',
      data
    } as ApiResponse<Product>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 更新商品信息（仅管理员）
router.put('/:id', requireAdmin, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.id; // 防止更新ID字段
    updateData.updated_at = new Date().toISOString();

    // 处理数值字段
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.original_price) updateData.original_price = Number(updateData.original_price);
    if (updateData.category) updateData.category = Number(updateData.category);
    if (updateData.stock_quantity !== undefined) updateData.stock_quantity = Number(updateData.stock_quantity);
    if (updateData.min_stock_level !== undefined) updateData.min_stock_level = Number(updateData.min_stock_level);

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: '更新商品信息失败',
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '更新商品信息成功',
      data
    } as ApiResponse<Product>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 删除商品（软删除，仅管理员）
router.delete('/:id', requireAdmin, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: '删除商品失败',
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '删除商品成功',
      data
    } as ApiResponse<Product>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 更新商品库存
router.patch('/:id/stock', requireAdmin, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const { stock_quantity, operation = 'set' } = req.body; // operation: 'set', 'add', 'subtract'

    if (stock_quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: '库存数量为必填项'
      } as ApiResponse<null>);
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (operation === 'set') {
      updateData.stock_quantity = Number(stock_quantity);
    } else {
      // 先获取当前库存
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', id)
        .single();

      if (fetchError) {
        return res.status(404).json({
          success: false,
          message: '商品不存在',
          error: fetchError.message
        } as ApiResponse<null>);
      }

      const currentStock = currentProduct.stock_quantity || 0;
      if (operation === 'add') {
        updateData.stock_quantity = currentStock + Number(stock_quantity);
      } else if (operation === 'subtract') {
        updateData.stock_quantity = Math.max(0, currentStock - Number(stock_quantity));
      }
    }

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: '更新库存失败',
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '更新库存成功',
      data
    } as ApiResponse<Product>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 获取库存预警商品
router.get('/alerts/low-stock', requireAdmin, async (req, res): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .filter('stock_quantity', 'lte', 'min_stock_level')
      .order('stock_quantity', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: '获取库存预警失败',
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: '获取库存预警成功',
      data
    } as ApiResponse<Product[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
});

// 获取商品分类统计
router.get('/stats/categories', requireAdmin, async (req, res): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category_name, category')
      .eq('status', 'active');

    if (error) {
      return res.status(500).json({
        success: false,
        message: '获取分类统计失败',
        error: error.message
      } as ApiResponse<null>);
    }

    // 统计各分类商品数量
    const categoryStats = data.reduce((acc: any, product) => {
      const category = product.category_name || `分类${product.category}`;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const result = Object.entries(categoryStats).map(([name, count]) => ({
      category_name: name,
      product_count: count
    }));

    res.json({
      success: true,
      message: '获取分类统计成功',
      data: result
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