import multer from 'multer'
import { Request, Response, NextFunction } from 'express'
import path from 'path'
import { AppError, ValidationError } from './errorHandler'

// 文件类型配置
const FILE_TYPES = {
  IMAGE: {
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  DOCUMENT: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  VIDEO: {
    mimeTypes: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'],
    extensions: ['.mp4', '.mpeg', '.mov', '.avi'],
    maxSize: 100 * 1024 * 1024, // 100MB
  },
}

// 使用内存存储
const storage = multer.memoryStorage()

// 文件过滤器
const createFileFilter = (allowedTypes: string[]) => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // 检查MIME类型
    const isMimeTypeAllowed = allowedTypes.some(type => {
      const config = FILE_TYPES[type as keyof typeof FILE_TYPES]
      return config.mimeTypes.includes(file.mimetype)
    })
    
    if (!isMimeTypeAllowed) {
      const error = new ValidationError(
        `不支持的文件类型: ${file.mimetype}`,
        { [file.fieldname]: [`文件类型必须是: ${allowedTypes.join(', ')}`] }
      )
      return cb(error)
    }
    
    // 检查文件扩展名
    const fileExtension = path.extname(file.originalname).toLowerCase()
    const isExtensionAllowed = allowedTypes.some(type => {
      const config = FILE_TYPES[type as keyof typeof FILE_TYPES]
      return config.extensions.includes(fileExtension)
    })
    
    if (!isExtensionAllowed) {
      const error = new ValidationError(
        `不支持的文件扩展名: ${fileExtension}`,
        { [file.fieldname]: [`文件扩展名必须是: ${allowedTypes.flatMap(type => FILE_TYPES[type as keyof typeof FILE_TYPES].extensions).join(', ')}`] }
      )
      return cb(error)
    }
    
    cb(null, true)
  }
}

// 文件大小限制检查
const createSizeLimit = (allowedTypes: string[]) => {
  const maxSize = Math.max(
    ...allowedTypes.map(type => FILE_TYPES[type as keyof typeof FILE_TYPES].maxSize)
  )
  return maxSize
}

// 创建上传中间件
const createUploadMiddleware = (
  fieldConfig: { name: string; maxCount?: number } | { name: string; maxCount?: number }[],
  allowedTypes: string[] = ['IMAGE']
) => {
  const fileFilter = createFileFilter(allowedTypes)
  const limits = {
    fileSize: createSizeLimit(allowedTypes),
    files: Array.isArray(fieldConfig) 
      ? fieldConfig.reduce((sum, field) => sum + (field.maxCount || 1), 0)
      : (fieldConfig.maxCount || 1),
  }
  
  const upload = multer({
    storage,
    fileFilter,
    limits,
  })
  
  if (Array.isArray(fieldConfig)) {
    return upload.fields(fieldConfig)
  } else {
    return fieldConfig.maxCount && fieldConfig.maxCount > 1
      ? upload.array(fieldConfig.name, fieldConfig.maxCount)
      : upload.single(fieldConfig.name)
  }
}

// 图片上传中间件
export const uploadImage = createUploadMiddleware({ name: 'image' }, ['IMAGE'])
export const uploadImages = (maxCount: number = 5) => 
  createUploadMiddleware({ name: 'images', maxCount }, ['IMAGE'])

// 文档上传中间件
export const uploadDocument = createUploadMiddleware({ name: 'document' }, ['DOCUMENT'])
export const uploadDocuments = (maxCount: number = 3) => 
  createUploadMiddleware({ name: 'documents', maxCount }, ['DOCUMENT'])

// 视频上传中间件
export const uploadVideo = createUploadMiddleware({ name: 'video' }, ['VIDEO'])

// 混合文件上传中间件
export const uploadMixed = createUploadMiddleware(
  [
    { name: 'images', maxCount: 5 },
    { name: 'documents', maxCount: 3 },
    { name: 'video', maxCount: 1 },
  ],
  ['IMAGE', 'DOCUMENT', 'VIDEO']
)

// 头像上传中间件
export const uploadAvatar = createUploadMiddleware({ name: 'avatar' }, ['IMAGE'])

// 轮播图上传中间件
export const uploadBanner = createUploadMiddleware({ name: 'banner' }, ['IMAGE'])

// 商品图片上传中间件
export const uploadProductImages = (maxCount: number = 10) => 
  createUploadMiddleware({ name: 'productImages', maxCount }, ['IMAGE'])

// 文件验证中间件
export const validateFile = (required: boolean = true) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const hasFile = req.file || (req.files && Object.keys(req.files).length > 0)
    
    if (required && !hasFile) {
      const error = new ValidationError('请选择要上传的文件')
      return next(error)
    }
    
    next()
  }
}

// 文件信息提取中间件
export const extractFileInfo = (req: Request, res: Response, next: NextFunction) => {
  if (req.file) {
    // 单文件上传
    req.body.fileInfo = {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer,
    }
  } else if (req.files) {
    // 多文件上传
    if (Array.isArray(req.files)) {
      // files数组格式
      req.body.filesInfo = req.files.map(file => ({
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      }))
    } else {
      // files对象格式
      req.body.filesInfo = {}
      Object.keys(req.files).forEach(fieldName => {
        const files = (req.files as { [fieldname: string]: Express.Multer.File[] })[fieldName]
        req.body.filesInfo[fieldName] = files.map(file => ({
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          buffer: file.buffer,
        }))
      })
    }
  }
  
  next()
}

// 文件大小格式化工具
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 生成唯一文件名
export const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = path.extname(originalName)
  const baseName = path.basename(originalName, extension)
  
  return `${baseName}_${timestamp}_${randomString}${extension}`
}

// 获取文件MIME类型对应的分类
export const getFileCategory = (mimeType: string): string => {
  for (const [category, config] of Object.entries(FILE_TYPES)) {
    if (config.mimeTypes.includes(mimeType)) {
      return category.toLowerCase()
    }
  }
  return 'unknown'
}