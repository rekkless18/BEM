import express from 'express';
import { supabase } from '../utils/supabase';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * 获取订单列表
 * GET /api/orders
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      payment_status = 'all',
      start_date = '',
      end_date = ''
    } = req.query;

    // 构建查询条件
    let query = supabase
      .from('orders')
      .select(`
        *,
        user:users(id, username, email, phone),
        order_items(
          id,
          quantity,
          price,
          product:products(id, name, image_url)
        )
      `);

    // 搜索条件
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,shipping_address.ilike.%${search}%`);
    }

    // 订单状态过滤
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // 支付状态过滤
    if (payment_status !== 'all') {
      query = query.eq('payment_status', payment_status);
    }

    // 日期范围过滤
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    // 排序
    query = query.order('created_at', { ascending: false });

    // 分页
    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('获取订单列表错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取订单列表失败',
        error: error.message
      });
    }

    // 获取总数
    const { count: totalCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    res.json({
      success: true,
      data: {
        orders: orders || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取订单详情
 * GET /api/orders/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:users(id, username, email, phone, avatar_url),
        order_items(
          id,
          quantity,
          price,
          product:products(id, name, description, image_url, category)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取订单详情错误:', error);
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 创建订单
 * POST /api/orders
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      user_id,
      items, // [{ product_id, quantity, price }]
      shipping_address,
      shipping_method = 'standard',
      payment_method = 'online',
      notes
    } = req.body;

    // 验证必填字段
    if (!user_id || !items || !Array.isArray(items) || items.length === 0 || !shipping_address) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }

    // 验证用户是否存在
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (!user) {
      return res.status(400).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证商品并计算总金额
    let totalAmount = 0;
    let shippingFee = 0;
    const validatedItems = [];

    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('id, name, price, stock')
        .eq('id', item.product_id)
        .single();

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `商品 ${item.product_id} 不存在`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `商品 ${product.name} 库存不足`
        });
      }

      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;
      
      validatedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      });
    }

    // 计算运费（简单逻辑：满100免运费，否则10元）
    if (totalAmount < 100) {
      shippingFee = 10;
    }

    const finalAmount = totalAmount + shippingFee;

    // 生成订单号
    const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // 开始事务：创建订单和订单项
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id,
        order_number: orderNumber,
        total_amount: totalAmount,
        shipping_fee: shippingFee,
        final_amount: finalAmount,
        shipping_address,
        shipping_method,
        payment_method,
        payment_status: 'pending',
        status: 'pending',
        notes: notes || null
      })
      .select()
      .single();

    if (orderError) {
      console.error('创建订单错误:', orderError);
      return res.status(500).json({
        success: false,
        message: '创建订单失败',
        error: orderError.message
      });
    }

    // 创建订单项
    const orderItems = validatedItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('创建订单项错误:', itemsError);
      // 回滚：删除已创建的订单
      await supabase.from('orders').delete().eq('id', order.id);
      return res.status(500).json({
        success: false,
        message: '创建订单项失败',
        error: itemsError.message
      });
    }

    // 更新商品库存
    for (const item of validatedItems) {
      // 获取当前库存
      const { data: productData } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();
      
      if (productData) {
        // 更新库存
        await supabase
          .from('products')
          .update({ stock: (productData.stock || 0) - item.quantity })
          .eq('id', item.product_id);
      }
    }

    // 获取完整的订单信息
    const { data: fullOrder } = await supabase
      .from('orders')
      .select(`
        *,
        user:users(id, username, email, phone),
        order_items(
          id,
          quantity,
          price,
          product:products(id, name, image_url)
        )
      `)
      .eq('id', order.id)
      .single();

    res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: fullOrder
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 更新订单状态
 * PATCH /api/orders/:id/status
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status, tracking_number, notes } = req.body;

    if (!status && !payment_status) {
      return res.status(400).json({
        success: false,
        message: '请提供要更新的状态'
      });
    }

    // 验证状态值
    const validOrderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

    if (status && !validOrderStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的订单状态'
      });
    }

    if (payment_status && !validPaymentStatuses.includes(payment_status)) {
      return res.status(400).json({
        success: false,
        message: '无效的支付状态'
      });
    }

    // 检查订单是否存在
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, status, payment_status')
      .eq('id', id)
      .single();

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 构建更新数据
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
      
      // 如果订单已发货，记录发货时间
      if (status === 'shipped') {
        updateData.shipped_at = new Date().toISOString();
        if (tracking_number) {
          updateData.tracking_number = tracking_number;
        }
      }
      
      // 如果订单已完成，记录完成时间
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }
    }

    if (payment_status) {
      updateData.payment_status = payment_status;
      
      // 如果支付成功，记录支付时间
      if (payment_status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }
    }

    if (notes) {
      updateData.notes = notes;
    }

    // 更新订单
    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        user:users(id, username, email, phone),
        order_items(
          id,
          quantity,
          price,
          product:products(id, name, image_url)
        )
      `)
      .single();

    if (error) {
      console.error('更新订单状态错误:', error);
      return res.status(500).json({
        success: false,
        message: '更新订单状态失败',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: '订单状态更新成功',
      data: order
    });
  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 删除订单
 * DELETE /api/orders/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查订单是否存在
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, order_number, status')
      .eq('id', id)
      .single();

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 检查订单状态是否允许删除
    if (!['pending', 'cancelled'].includes(existingOrder.status)) {
      return res.status(400).json({
        success: false,
        message: '只能删除待处理或已取消的订单'
      });
    }

    // 先删除订单项
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', id);

    if (itemsError) {
      console.error('删除订单项错误:', itemsError);
      return res.status(500).json({
        success: false,
        message: '删除订单项失败',
        error: itemsError.message
      });
    }

    // 删除订单
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除订单错误:', error);
      return res.status(500).json({
        success: false,
        message: '删除订单失败',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: '订单删除成功'
    });
  } catch (error) {
    console.error('删除订单错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取订单统计信息
 * GET /api/orders/statistics
 */
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    // 获取订单总数和状态统计
    const { data: orders, error } = await supabase
      .from('orders')
      .select('status, payment_status, final_amount, created_at');

    if (error) {
      console.error('获取订单统计错误:', error);
      return res.status(500).json({
        success: false,
        message: '获取订单统计失败',
        error: error.message
      });
    }

    // 计算统计数据
    const total = orders?.length || 0;
    const pending = orders?.filter(o => o.status === 'pending').length || 0;
    const confirmed = orders?.filter(o => o.status === 'confirmed').length || 0;
    const processing = orders?.filter(o => o.status === 'processing').length || 0;
    const shipped = orders?.filter(o => o.status === 'shipped').length || 0;
    const delivered = orders?.filter(o => o.status === 'delivered').length || 0;
    const cancelled = orders?.filter(o => o.status === 'cancelled').length || 0;

    // 支付状态统计
    const paidOrders = orders?.filter(o => o.payment_status === 'paid').length || 0;
    const pendingPayment = orders?.filter(o => o.payment_status === 'pending').length || 0;

    // 计算总收入（已支付订单）
    const totalRevenue = orders
      ?.filter(o => o.payment_status === 'paid')
      ?.reduce((sum, o) => sum + (o.final_amount || 0), 0) || 0;

    // 今日新增订单
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders?.filter(o => 
      o.created_at.startsWith(today)
    ).length || 0;

    // 今日收入
    const todayRevenue = orders
      ?.filter(o => o.created_at.startsWith(today) && o.payment_status === 'paid')
      ?.reduce((sum, o) => sum + (o.final_amount || 0), 0) || 0;

    res.json({
      success: true,
      data: {
        total,
        pending,
        confirmed,
        processing,
        shipped,
        delivered,
        cancelled,
        paidOrders,
        pendingPayment,
        totalRevenue,
        todayOrders,
        todayRevenue
      }
    });
  } catch (error) {
    console.error('获取订单统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 批量更新订单状态
 * PATCH /api/orders/batch-status
 */
router.patch('/batch-status', authenticateToken, async (req, res) => {
  try {
    const { order_ids, status, payment_status } = req.body;

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的订单ID列表'
      });
    }

    if (!status && !payment_status) {
      return res.status(400).json({
        success: false,
        message: '请提供要更新的状态'
      });
    }

    // 构建更新数据
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
    }

    if (payment_status) {
      updateData.payment_status = payment_status;
    }

    // 批量更新订单状态
    const { data: orders, error } = await supabase
      .from('orders')
      .update(updateData)
      .in('id', order_ids)
      .select('id, order_number, status, payment_status');

    if (error) {
      console.error('批量更新订单状态错误:', error);
      return res.status(500).json({
        success: false,
        message: '批量更新订单状态失败',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: `成功更新 ${orders?.length || 0} 个订单的状态`,
      data: orders
    });
  } catch (error) {
    console.error('批量更新订单状态错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;