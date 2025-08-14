/**
 * 创建Supabase存储桶脚本
 * 用于创建'files'存储桶并设置权限
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少Supabase配置')
  console.error('请确保.env文件中包含:')
  console.error('- SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// 创建Supabase客户端（使用service role key以获得管理权限）
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createFilesBucket() {
  try {
    console.log('正在创建\'files\'存储桶...')
    
    // 创建存储桶
    const { data: bucket, error: createError } = await supabase.storage.createBucket('files', {
      public: true, // 设置为公开，便于获取公共URL
      allowedMimeTypes: [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      fileSizeLimit: 10485760 // 10MB限制
    })
    
    if (createError) {
      if (createError.message.includes('already exists')) {
        console.log('✅ \'files\'存储桶已存在')
      } else {
        console.error('创建存储桶失败:', createError)
        return false
      }
    } else {
      console.log('✅ 成功创建\'files\'存储桶')
      console.log('桶配置:', bucket)
    }
    
    // 设置存储桶策略（RLS规则）
    console.log('\n正在设置存储桶访问策略...')
    
    // 这里我们需要通过SQL来设置RLS策略
    // 由于JavaScript客户端不能直接设置存储策略，我们先创建桶
    // 策略需要在Supabase Dashboard中手动设置或通过SQL迁移文件
    
    console.log('\n⚠️  重要提醒:')
    console.log('需要在Supabase Dashboard中为\'files\'存储桶设置以下策略:')
    console.log('1. 允许认证用户上传文件')
    console.log('2. 允许公开读取文件')
    console.log('3. 允许文件所有者删除文件')
    
    return true
    
  } catch (error) {
    console.error('创建存储桶时发生错误:', error)
    return false
  }
}

async function verifyBucketCreation() {
  try {
    console.log('\n正在验证存储桶创建...')
    
    // 获取所有存储桶
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('获取存储桶列表失败:', error)
      return false
    }
    
    // 检查是否存在'files'桶
    const filesBucket = buckets.find(bucket => bucket.name === 'files')
    if (filesBucket) {
      console.log('✅ \'files\'存储桶验证成功')
      console.log('桶信息:')
      console.log(`- 名称: ${filesBucket.name}`)
      console.log(`- ID: ${filesBucket.id}`)
      console.log(`- 公开: ${filesBucket.public}`)
      console.log(`- 创建时间: ${filesBucket.created_at}`)
      return true
    } else {
      console.log('❌ \'files\'存储桶验证失败')
      return false
    }
    
  } catch (error) {
    console.error('验证存储桶时发生错误:', error)
    return false
  }
}

// 执行创建和验证
async function main() {
  const created = await createFilesBucket()
  if (created) {
    const verified = await verifyBucketCreation()
    if (verified) {
      console.log('\n🎉 存储桶创建和验证完成！')
      process.exit(0)
    }
  }
  
  console.log('\n❌ 存储桶创建失败')
  process.exit(1)
}

main().catch((error) => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})