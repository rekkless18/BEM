import bcrypt from 'bcryptjs'

// 盐值轮数
const SALT_ROUNDS = 12

// 加密密码
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS)
    const hashedPassword = await bcrypt.hash(password, salt)
    return hashedPassword
  } catch (error) {
    console.error('Password hashing failed:', error)
    throw new Error('密码加密失败')
  }
}

// 验证密码
export const verifyPassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword)
    return isMatch
  } catch (error) {
    console.error('Password verification failed:', error)
    return false
  }
}

// 生成随机密码
export const generateRandomPassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }
  
  return password
}

// 验证密码强度
export const validatePasswordStrength = (password: string): {
  isValid: boolean
  errors: string[]
} => {
  const errors: string[] = []
  
  // 最小长度检查
  if (password.length < 8) {
    errors.push('密码长度至少8个字符')
  }
  
  // 最大长度检查
  if (password.length > 128) {
    errors.push('密码长度不能超过128个字符')
  }
  
  // 包含小写字母
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母')
  }
  
  // 包含大写字母
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母')
  }
  
  // 包含数字
  if (!/\d/.test(password)) {
    errors.push('密码必须包含至少一个数字')
  }
  
  // 包含特殊字符
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('密码必须包含至少一个特殊字符')
  }
  
  // 不能包含常见的弱密码模式
  const weakPatterns = [
    /123456/,
    /password/i,
    /admin/i,
    /qwerty/i,
    /(.)\1{3,}/, // 连续相同字符
  ]
  
  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      errors.push('密码不能包含常见的弱密码模式')
      break
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

// 检查密码是否需要更新（基于最后修改时间）
export const shouldUpdatePassword = (lastPasswordUpdate: Date, maxAgeInDays: number = 90): boolean => {
  const now = new Date()
  const daysSinceUpdate = Math.floor((now.getTime() - lastPasswordUpdate.getTime()) / (1000 * 60 * 60 * 24))
  return daysSinceUpdate >= maxAgeInDays
}

// 生成密码重置令牌
export const generatePasswordResetToken = (): string => {
  const timestamp = Date.now().toString()
  const randomString = Math.random().toString(36).substring(2, 15)
  return `${timestamp}-${randomString}`
}

// 验证密码重置令牌是否有效（24小时内）
export const validatePasswordResetToken = (token: string): boolean => {
  try {
    const [timestampStr] = token.split('-')
    const timestamp = parseInt(timestampStr, 10)
    const now = Date.now()
    const hoursDiff = (now - timestamp) / (1000 * 60 * 60)
    
    // 令牌有效期为24小时
    return hoursDiff <= 24
  } catch (error) {
    return false
  }
}