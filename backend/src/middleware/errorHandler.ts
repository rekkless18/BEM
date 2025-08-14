import { Request, Response, NextFunction } from 'express'
import { ApiResponse, ErrorResponse } from '../types/index'

// 自定义错误类
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean
  public errorCode?: string

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    isOperational: boolean = true
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.errorCode = errorCode

    Error.captureStackTrace(this, this.constructor)
  }
}

// 验证错误类
export class ValidationError extends AppError {
  public fields: Record<string, string[]>

  constructor(message: string, fields: Record<string, string[]> = {}) {
    super(message, 400, 'VALIDATION_ERROR')
    this.fields = fields
  }
}

// 数据库错误类
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: any) {
    super(message, 500, 'DATABASE_ERROR')
    if (originalError) {
      console.error('Database error details:', originalError)
    }
  }
}

// 认证错误类
export class AuthenticationError extends AppError {
  constructor(message: string = '认证失败') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

// 授权错误类
export class AuthorizationError extends AppError {
  constructor(message: string = '权限不足') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

// 资源未找到错误类
export class NotFoundError extends AppError {
  constructor(message: string = '资源未找到') {
    super(message, 404, 'NOT_FOUND_ERROR')
  }
}

// 冲突错误类
export class ConflictError extends AppError {
  constructor(message: string = '资源冲突') {
    super(message, 409, 'CONFLICT_ERROR')
  }
}

// 速率限制错误类
export class RateLimitError extends AppError {
  constructor(message: string = '请求过于频繁') {
    super(message, 429, 'RATE_LIMIT_ERROR')
  }
}

// 处理Supabase错误
const handleSupabaseError = (error: any): AppError => {
  console.error('Supabase error:', error)
  
  // 根据Supabase错误代码返回相应的错误
  switch (error.code) {
    case '23505': // 唯一约束违反
      return new ConflictError('数据已存在')
    case '23503': // 外键约束违反
      return new ValidationError('关联数据不存在')
    case '23502': // 非空约束违反
      return new ValidationError('必填字段不能为空')
    case '42P01': // 表不存在
      return new DatabaseError('数据表不存在')
    case '42703': // 列不存在
      return new DatabaseError('数据字段不存在')
    default:
      return new DatabaseError('数据库操作失败')
  }
}

// 处理JWT错误
const handleJWTError = (error: any): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('无效的认证令牌')
  }
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('认证令牌已过期')
  }
  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('认证令牌尚未生效')
  }
  return new AuthenticationError('认证失败')
}

// 处理验证错误
const handleValidationError = (error: any): AppError => {
  const fields: Record<string, string[]> = {}
  
  if (error.details) {
    error.details.forEach((detail: any) => {
      const field = detail.path?.join('.') || 'unknown'
      if (!fields[field]) {
        fields[field] = []
      }
      fields[field].push(detail.message)
    })
  }
  
  return new ValidationError('数据验证失败', fields)
}

// 开发环境错误响应
const sendErrorDev = (err: AppError, res: Response): void => {
  const errorResponse: ErrorResponse = {
    success: false,
    message: err.message,
    error: err.errorCode || 'INTERNAL_ERROR',
    statusCode: err.statusCode,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  }
  
  if (err instanceof ValidationError) {
    errorResponse.fields = err.fields
  }
  
  res.status(err.statusCode).json(errorResponse)
}

// 生产环境错误响应
const sendErrorProd = (err: AppError, res: Response): void => {
  // 只发送操作性错误的详细信息
  if (err.isOperational) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: err.message,
      error: err.errorCode || 'INTERNAL_ERROR',
      statusCode: err.statusCode,
      timestamp: new Date().toISOString(),
    }
    
    if (err instanceof ValidationError) {
      errorResponse.fields = err.fields
    }
    
    res.status(err.statusCode).json(errorResponse)
  } else {
    // 编程错误：不泄露错误详情
    const errorResponse: ErrorResponse = {
      success: false,
      message: '服务器内部错误',
      error: 'INTERNAL_ERROR',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    }
    
    res.status(500).json(errorResponse)
  }
}

// 全局错误处理中间件
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err
  
  // 确保错误有statusCode
  if (!error.statusCode) {
    error.statusCode = 500
  }
  
  // 处理特定类型的错误
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.name === 'NotBeforeError') {
    error = handleJWTError(error)
  } else if (error.code && typeof error.code === 'string' && error.code.startsWith('23')) {
    error = handleSupabaseError(error)
  } else if (error.name === 'ValidationError') {
    error = handleValidationError(error)
  } else if (!(error instanceof AppError)) {
    // 将未知错误转换为AppError
    error = new AppError(
      error.message || '服务器内部错误',
      error.statusCode || 500,
      'INTERNAL_ERROR',
      false
    )
  }
  
  // 记录错误
  console.error('Error occurred:', {
    message: error.message,
    statusCode: error.statusCode,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  })
  
  // 发送错误响应
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res)
  } else {
    sendErrorProd(error, res)
  }
}

// 处理未捕获的路由
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`路由 ${req.originalUrl} 不存在`)
  next(error)
}

// 异步错误包装器
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}