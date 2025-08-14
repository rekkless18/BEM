/**
 * 文件上传API路由
 * 提供图片和文档上传功能
 */

import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { authenticateToken as auth } from '../middleware/auth'
import { uploadImage, uploadImages, uploadDocument, extractFileInfo } from '../middleware/upload'
import { ApiResponse, UploadResponse } from '../types'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

const router = Router()

/**
 * 单文件上传（通用）
 * POST /api/upload/single
 * 支持图片和文档上传
 */
router.post('/single', auth, uploadImage, extractFileInfo, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请选择要上传的文件'
      } as UploadResponse)
    }

    const file = req.file
    const { folder = 'uploads' } = req.body

    // 生成唯一文件名
    const fileExtension = path.extname(file.originalname)
    const fileName = `${uuidv4()}${fileExtension}`
    const filePath = `${folder}/${fileName}`

    try {
      // 上传到Supabase Storage
      const { data, error } = await supabase.storage
        .from('files') // 确保这个bucket存在
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        })

      if (error) {
        console.error('Supabase上传失败:', error)
        return res.status(500).json({
          success: false,
          error: '文件上传失败: ' + error.message
        } as UploadResponse)
      }

      // 获取公共URL
      const { data: urlData } = supabase.storage
        .from('files')
        .getPublicUrl(filePath)

      const fileUrl = urlData.publicUrl

      res.json({
        success: true,
        url: fileUrl,
        filename: fileName,
        size: file.size
      } as UploadResponse)

    } catch (storageError) {
      console.error('存储服务错误:', storageError)
      res.status(500).json({
        success: false,
        error: '存储服务不可用'
      } as UploadResponse)
    }

  } catch (error) {
    console.error('文件上传异常:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    } as UploadResponse)
  }
})

/**
 * 图片上传
 * POST /api/upload/image
 * 专门用于图片上传
 */
router.post('/image', auth, uploadImage, extractFileInfo, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请选择要上传的图片'
      } as UploadResponse)
    }

    const file = req.file
    const { folder = 'images' } = req.body

    // 生成唯一文件名
    const fileExtension = path.extname(file.originalname)
    const fileName = `${uuidv4()}${fileExtension}`
    const filePath = `${folder}/${fileName}`

    try {
      // 上传到Supabase Storage
      const { data, error } = await supabase.storage
        .from('files')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        })

      if (error) {
        console.error('图片上传失败:', error)
        return res.status(500).json({
          success: false,
          error: '图片上传失败: ' + error.message
        } as UploadResponse)
      }

      // 获取公共URL
      const { data: urlData } = supabase.storage
        .from('files')
        .getPublicUrl(filePath)

      const fileUrl = urlData.publicUrl

      res.json({
        success: true,
        url: fileUrl,
        filename: fileName,
        size: file.size
      } as UploadResponse)

    } catch (storageError) {
      console.error('存储服务错误:', storageError)
      res.status(500).json({
        success: false,
        error: '存储服务不可用'
      } as UploadResponse)
    }

  } catch (error) {
    console.error('图片上传异常:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    } as UploadResponse)
  }
})

/**
 * 多图片上传
 * POST /api/upload/images
 * 支持批量图片上传
 */
router.post('/images', auth, uploadImages(5), extractFileInfo, async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[]
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请选择要上传的图片'
      } as ApiResponse)
    }

    const { folder = 'images' } = req.body
    const uploadResults: UploadResponse[] = []

    // 并行上传所有文件
    const uploadPromises = files.map(async (file) => {
      const fileExtension = path.extname(file.originalname)
      const fileName = `${uuidv4()}${fileExtension}`
      const filePath = `${folder}/${fileName}`

      try {
        const { data, error } = await supabase.storage
          .from('files')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          })

        if (error) {
          return {
            success: false,
            error: `${file.originalname}: ${error.message}`
          } as UploadResponse
        }

        const { data: urlData } = supabase.storage
          .from('files')
          .getPublicUrl(filePath)

        return {
          success: true,
          url: urlData.publicUrl,
          filename: fileName,
          size: file.size
        } as UploadResponse

      } catch (error) {
        return {
          success: false,
          error: `${file.originalname}: 上传失败`
        } as UploadResponse
      }
    })

    const results = await Promise.all(uploadPromises)
    
    // 统计成功和失败的数量
    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    res.json({
      success: failureCount === 0,
      data: results,
      message: `成功上传 ${successCount} 个文件${failureCount > 0 ? `，失败 ${failureCount} 个` : ''}`
    } as ApiResponse<UploadResponse[]>)

  } catch (error) {
    console.error('批量图片上传异常:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse)
  }
})

/**
 * 文档上传
 * POST /api/upload/document
 * 专门用于文档上传
 */
router.post('/document', auth, uploadDocument, extractFileInfo, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请选择要上传的文档'
      } as UploadResponse)
    }

    const file = req.file
    const { folder = 'documents' } = req.body

    // 生成唯一文件名
    const fileExtension = path.extname(file.originalname)
    const fileName = `${uuidv4()}${fileExtension}`
    const filePath = `${folder}/${fileName}`

    try {
      // 上传到Supabase Storage
      const { data, error } = await supabase.storage
        .from('files')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        })

      if (error) {
        console.error('文档上传失败:', error)
        return res.status(500).json({
          success: false,
          error: '文档上传失败: ' + error.message
        } as UploadResponse)
      }

      // 获取公共URL
      const { data: urlData } = supabase.storage
        .from('files')
        .getPublicUrl(filePath)

      const fileUrl = urlData.publicUrl

      res.json({
        success: true,
        url: fileUrl,
        filename: fileName,
        size: file.size
      } as UploadResponse)

    } catch (storageError) {
      console.error('存储服务错误:', storageError)
      res.status(500).json({
        success: false,
        error: '存储服务不可用'
      } as UploadResponse)
    }

  } catch (error) {
    console.error('文档上传异常:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    } as UploadResponse)
  }
})

/**
 * 删除文件
 * DELETE /api/upload/:filename
 * 从存储中删除指定文件
 */
router.delete('/:filename', auth, async (req: Request, res: Response) => {
  try {
    const { filename } = req.params
    const { folder = 'uploads' } = req.query

    const filePath = `${folder}/${filename}`

    const { error } = await supabase.storage
      .from('files')
      .remove([filePath])

    if (error) {
      console.error('文件删除失败:', error)
      return res.status(500).json({
        success: false,
        error: '文件删除失败: ' + error.message
      } as ApiResponse)
    }

    res.json({
      success: true,
      message: '文件删除成功'
    } as ApiResponse)

  } catch (error) {
    console.error('文件删除异常:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse)
  }
})

/**
 * 获取文件信息
 * GET /api/upload/info/:filename
 * 获取指定文件的详细信息
 */
router.get('/info/:filename', auth, async (req: Request, res: Response) => {
  try {
    const { filename } = req.params
    const { folder = 'uploads' } = req.query

    const filePath = `${folder}/${filename}`

    // 检查文件是否存在
    const { data, error } = await supabase.storage
      .from('files')
      .list(folder as string, {
        search: filename
      })

    if (error) {
      console.error('获取文件信息失败:', error)
      return res.status(500).json({
        success: false,
        error: '获取文件信息失败: ' + error.message
      } as ApiResponse)
    }

    const fileInfo = data.find(file => file.name === filename)
    
    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      } as ApiResponse)
    }

    // 获取公共URL
    const { data: urlData } = supabase.storage
      .from('files')
      .getPublicUrl(filePath)

    res.json({
      success: true,
      data: {
        name: fileInfo.name,
        size: fileInfo.metadata?.size || 0,
        lastModified: fileInfo.updated_at,
        url: urlData.publicUrl
      },
      message: '获取文件信息成功'
    } as ApiResponse)

  } catch (error) {
    console.error('获取文件信息异常:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse)
  }
})

export default router